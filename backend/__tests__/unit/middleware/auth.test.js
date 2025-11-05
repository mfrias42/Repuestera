/**
 * Tests unitarios para middleware de autenticación
 * Patrón AAA: Arrange, Act, Assert
 */

const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const Admin = require('../../../models/Admin');
const {
  verifyToken,
  verifyUser,
  verifyAdmin,
  requirePermission,
  requireSuperAdmin,
  optionalAuth,
  generateToken,
  generateUserToken,
  generateAdminToken
} = require('../../../middleware/auth');

// Mock de dependencias
jest.mock('../../../models/User');
jest.mock('../../../models/Admin');

describe('Middleware de Autenticación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('verifyToken', () => {
    test('debería permitir acceso con token válido', async () => {
      // Arrange
      const token = jwt.sign({ id: 1, email: 'test@example.com', type: 'user' }, process.env.JWT_SECRET);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.token).toBe(token);
    });

    test('debería rechazar acceso sin header de autorización', async () => {
      // Arrange
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token de acceso requerido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar acceso con token inválido', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token inválido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar acceso con token expirado', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com', type: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Token expirado
      );
      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expirado'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verifyUser', () => {
    test('debería permitir acceso si el usuario existe y está activo', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        activo: true
      };

      const req = {
        user: { id: 1, type: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      User.findById.mockResolvedValue(mockUser);

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.currentUser).toBe(mockUser);
      expect(User.findById).toHaveBeenCalledWith(1);
    });

    test('debería rechazar acceso si no es tipo user', async () => {
      // Arrange
      const req = {
        user: { id: 1, type: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

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

    test('debería rechazar acceso si el usuario no existe', async () => {
      // Arrange
      const req = {
        user: { id: 999, type: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      User.findById.mockResolvedValue(null);

      // Act
      await verifyUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar acceso si el usuario está inactivo', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        activo: false
      };

      const req = {
        user: { id: 1, type: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

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
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verifyAdmin', () => {
    test('debería permitir acceso si el admin existe y está activo', async () => {
      // Arrange
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        rol: 'admin',
        activo: true,
        updateLastAccess: jest.fn().mockResolvedValue()
      };

      const req = {
        user: { id: 1, type: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      Admin.findById.mockResolvedValue(mockAdmin);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.currentAdmin).toBe(mockAdmin);
      expect(Admin.findById).toHaveBeenCalledWith(1);
      expect(mockAdmin.updateLastAccess).toHaveBeenCalled();
    });

    test('debería rechazar acceso si no es tipo admin', async () => {
      // Arrange
      const req = {
        user: { id: 1, type: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar acceso si el admin no existe', async () => {
      // Arrange
      const req = {
        user: { id: 999, type: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      Admin.findById.mockResolvedValue(null);

      // Act
      await verifyAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    test('debería permitir acceso si el admin tiene el permiso', () => {
      // Arrange
      const req = {
        currentAdmin: {
          canPerformAction: jest.fn().mockReturnValue(true)
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requirePermission('create_products');

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.currentAdmin.canPerformAction).toHaveBeenCalledWith('create_products');
    });

    test('debería rechazar acceso si el admin no tiene el permiso', () => {
      // Arrange
      const req = {
        currentAdmin: {
          canPerformAction: jest.fn().mockReturnValue(false)
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requirePermission('delete_admins');

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

    test('debería rechazar acceso si no hay currentAdmin', () => {
      // Arrange
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = requirePermission('create_products');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin', () => {
    test('debería permitir acceso si es super admin', () => {
      // Arrange
      const req = {
        currentAdmin: {
          isSuperAdmin: jest.fn().mockReturnValue(true)
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      requireSuperAdmin(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.currentAdmin.isSuperAdmin).toHaveBeenCalled();
    });

    test('debería rechazar acceso si no es super admin', () => {
      // Arrange
      const req = {
        currentAdmin: {
          isSuperAdmin: jest.fn().mockReturnValue(false)
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      requireSuperAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('debería continuar sin autenticación si no hay token', async () => {
      // Arrange
      const req = {
        headers: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    test('debería autenticar si hay token válido', async () => {
      // Arrange
      const token = jwt.sign({ id: 1, email: 'test@example.com', type: 'user' }, process.env.JWT_SECRET);
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        activo: true
      };

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      User.findById.mockResolvedValue(mockUser);

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.currentUser).toBe(mockUser);
    });

    test('debería ignorar token inválido y continuar', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = {};
      const next = jest.fn();

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      // No debería lanzar error, solo continuar
    });
  });

  describe('generateToken', () => {
    test('debería generar un token JWT válido', () => {
      // Arrange
      const payload = { id: 1, email: 'test@example.com' };

      // Act
      const token = generateToken(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verificar que el token puede ser decodificado
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('generateUserToken', () => {
    test('debería generar un token para usuario', () => {
      // Arrange
      const user = {
        id: 1,
        email: 'user@example.com'
      };

      // Act
      const token = generateUserToken(user);

      // Assert
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('user@example.com');
      expect(decoded.type).toBe('user');
    });
  });

  describe('generateAdminToken', () => {
    test('debería generar un token para administrador', () => {
      // Arrange
      const admin = {
        id: 1,
        email: 'admin@example.com',
        rol: 'admin'
      };

      // Act
      const token = generateAdminToken(admin);

      // Assert
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('admin@example.com');
      expect(decoded.type).toBe('admin');
      expect(decoded.rol).toBe('admin');
    });

    test('debería usar rol por defecto si no se proporciona', () => {
      // Arrange
      const admin = {
        id: 1,
        email: 'admin@example.com'
      };

      // Act
      const token = generateAdminToken(admin);

      // Assert
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.rol).toBe('admin');
    });
  });
});

