/**
 * Tests unitarios para middleware de autenticación
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de dependencias ANTES de importar los módulos
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

jest.mock('../../../models/Admin', () => ({
  findById: jest.fn()
}));

jest.mock('../../../models/User', () => ({
  findById: jest.fn()
}));

// Importar módulos después de los mocks
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/auth');
const Admin = require('../../../models/Admin');
const User = require('../../../models/User');

// Extraer funciones del módulo
const {
  verifyToken,
  verifyUser,
  verifyAdmin,
  requirePermission,
  requireSuperAdmin,
  optionalAuth,
  generateAdminToken,
  generateUserToken
} = authMiddleware;

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Arrange - Configurar objetos mock para cada test
    req = {
      headers: {},
      user: null,
      currentAdmin: null,
      currentUser: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    test('debe permitir acceso con token válido', () => {
      // Arrange
      const token = 'valid_token';
      const decoded = { id: 1, email: 'test@example.com', type: 'user' };
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.user).toEqual(decoded);
      expect(req.token).toBe(token);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso sin token', () => {
      // Arrange
      req.headers.authorization = undefined;

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token de acceso requerido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar header sin Bearer', () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token123';

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token de acceso requerido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token vacío después de Bearer', () => {
      // Arrange
      req.headers.authorization = 'Bearer ';

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token no proporcionado'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token expirado', () => {
      // Arrange
      req.headers.authorization = 'Bearer expired_token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expirado'
        })
      );
    });

    test('debe rechazar token inválido', () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid_token';
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token inválido'
        })
      );
    });

    test('debe manejar otros errores de verificación', () => {
      // Arrange
      req.headers.authorization = 'Bearer token';
      const error = new Error('Other error');
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de autenticación'
        })
      );
    });
  });

  describe('verifyUser', () => {
    test('debe permitir acceso cuando el usuario existe y está activo', async () => {
      // Arrange
      req.user = { id: 1, type: 'user' };
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        activo: true
      };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(req.currentUser).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no es tipo user', async () => {
      // Arrange
      req.user = { id: 1, type: 'admin' };

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando no hay req.user', async () => {
      // Arrange
      req.user = null;

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no existe', async () => {
      // Arrange
      req.user = { id: 999, type: 'user' };
      User.findById.mockResolvedValue(null);

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario no encontrado'
        })
      );
    });

    test('debe rechazar acceso cuando el usuario está inactivo', async () => {
      // Arrange
      req.user = { id: 1, type: 'user' };
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        activo: false
      };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cuenta desactivada'
        })
      );
    });

    test('debe manejar errores de base de datos', async () => {
      // Arrange
      req.user = { id: 1, type: 'user' };
      User.findById.mockRejectedValue(new Error('DB Error'));

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de verificación'
        })
      );
    });
  });

  describe('verifyAdmin', () => {
    test('debe permitir acceso cuando el admin existe y está activo', async () => {
      // Arrange
      req.user = { id: 1, type: 'admin', email: 'admin@test.com' };
      const mockAdmin = {
        id: 1,
        email: 'admin@test.com',
        rol: 'super_admin',
        activo: true,
        updateLastAccess: jest.fn().mockResolvedValue(true)
      };
      Admin.findById.mockResolvedValue(mockAdmin);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(Admin.findById).toHaveBeenCalledWith(1);
      expect(req.currentAdmin).toEqual(mockAdmin);
      expect(mockAdmin.updateLastAccess).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el usuario no es admin', async () => {
      // Arrange
      req.user = { id: 1, type: 'user' };

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando no hay req.user', async () => {
      // Arrange
      req.user = null;

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el admin no existe', async () => {
      // Arrange
      req.user = { id: 999, type: 'admin' };
      Admin.findById.mockResolvedValue(null);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Administrador no encontrado'
        })
      );
    });

    test('debe rechazar acceso cuando el admin está inactivo', async () => {
      // Arrange
      req.user = { id: 1, type: 'admin' };
      const mockAdmin = {
        id: 1,
        email: 'admin@test.com',
        rol: 'admin',
        activo: false
      };
      Admin.findById.mockResolvedValue(mockAdmin);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cuenta desactivada'
        })
      );
    });

    test('debe asignar rol por defecto si es null', async () => {
      // Arrange
      req.user = { id: 1, type: 'admin' };
      const mockAdmin = {
        id: 1,
        email: 'admin@test.com',
        rol: null,
        activo: true,
        updateLastAccess: jest.fn().mockResolvedValue(true)
      };
      Admin.findById.mockResolvedValue(mockAdmin);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(mockAdmin.rol).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar errores de base de datos', async () => {
      // Arrange
      req.user = { id: 1, type: 'admin' };
      Admin.findById.mockRejectedValue(new Error('DB Error'));

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de verificación'
        })
      );
    });
  });

  describe('requirePermission', () => {
    test('debe permitir acceso cuando el admin tiene el permiso', () => {
      // Arrange
      const mockAdmin = {
        id: 1,
        rol: 'super_admin',
        canPerformAction: jest.fn().mockReturnValue(true)
      };
      req.currentAdmin = mockAdmin;
      const middleware = requirePermission('create_products');

      // Act
      middleware(req, res, next);

      // Assert
      expect(mockAdmin.canPerformAction).toHaveBeenCalledWith('create_products');
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando el admin no tiene el permiso', () => {
      // Arrange
      const mockAdmin = {
        id: 1,
        rol: 'admin',
        canPerformAction: jest.fn().mockReturnValue(false)
      };
      req.currentAdmin = mockAdmin;
      const middleware = requirePermission('create_admins');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permisos insuficientes'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando no hay currentAdmin', () => {
      // Arrange
      req.currentAdmin = null;
      const middleware = requirePermission('create_products');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin', () => {
    test('debe permitir acceso cuando es super_admin', () => {
      // Arrange
      const mockAdmin = {
        id: 1,
        rol: 'super_admin',
        isSuperAdmin: jest.fn().mockReturnValue(true)
      };
      req.currentAdmin = mockAdmin;

      // Act
      requireSuperAdmin(req, res, next);

      // Assert
      expect(mockAdmin.isSuperAdmin).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe rechazar acceso cuando no es super_admin', () => {
      // Arrange
      const mockAdmin = {
        id: 1,
        rol: 'admin',
        isSuperAdmin: jest.fn().mockReturnValue(false)
      };
      req.currentAdmin = mockAdmin;

      // Act
      requireSuperAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado',
          message: 'Se requieren privilegios de super administrador'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateAdminToken', () => {
    test('debe generar token para administrador', () => {
      // Arrange
      const admin = {
        id: 1,
        email: 'admin@test.com',
        rol: 'super_admin'
      };
      jwt.sign.mockReturnValue('generated_token');

      // Act
      const token = generateAdminToken(admin);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: admin.id,
          email: admin.email,
          type: 'admin',
          rol: admin.rol
        }),
        process.env.JWT_SECRET,
        expect.any(Object)
      );
      expect(token).toBe('generated_token');
    });

    test('debe usar rol por defecto si no existe', () => {
      // Arrange
      const admin = {
        id: 1,
        email: 'admin@test.com',
        rol: null
      };
      jwt.sign.mockReturnValue('token');

      // Act
      generateAdminToken(admin);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          rol: 'admin'
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('generateUserToken', () => {
    test('debe generar token para usuario', () => {
      // Arrange
      const user = {
        id: 1,
        email: 'user@test.com'
      };
      jwt.sign.mockReturnValue('user_token');

      // Act
      const token = generateUserToken(user);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          type: 'user'
        }),
        process.env.JWT_SECRET,
        expect.any(Object)
      );
      expect(token).toBe('user_token');
    });
  });

  describe('optionalAuth', () => {
    test('debe continuar sin token si no hay header', async () => {
      // Arrange
      req.headers.authorization = undefined;

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    test('debe continuar sin token si header no tiene Bearer', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token';

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    test('debe establecer req.user con token válido de usuario', async () => {
      // Arrange
      const decoded = { id: 1, type: 'user' };
      const mockUser = { id: 1, activo: true };
      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue(decoded);
      User.findById.mockResolvedValue(mockUser);

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toEqual(decoded);
      expect(req.currentUser).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('debe establecer req.currentAdmin con token válido de admin', async () => {
      // Arrange
      const decoded = { id: 1, type: 'admin' };
      const mockAdmin = { id: 1, activo: true, updateLastAccess: jest.fn().mockResolvedValue(true) };
      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue(decoded);
      Admin.findById.mockResolvedValue(mockAdmin);

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toEqual(decoded);
      expect(req.currentAdmin).toEqual(mockAdmin);
      expect(mockAdmin.updateLastAccess).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe ignorar errores de token inválido', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid_token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    test('debe ignorar usuario inactivo', async () => {
      // Arrange
      const decoded = { id: 1, type: 'user' };
      const mockUser = { id: 1, activo: false };
      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue(decoded);
      User.findById.mockResolvedValue(mockUser);

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toEqual(decoded);
      expect(req.currentUser).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});

