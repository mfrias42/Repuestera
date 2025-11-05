/**
 * Tests unitarios para el modelo Admin
 * Patrón AAA: Arrange, Act, Assert
 */

const Admin = require('../../../models/Admin');
const { executeQuery } = require('../../../config/database-mysql');
const bcrypt = require('bcryptjs');

// Mock de executeQuery
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

// Mock de bcrypt
jest.mock('bcryptjs');

describe('Modelo Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debería crear una instancia de Admin con los datos proporcionados', () => {
      // Arrange
      const adminData = {
        id: 1,
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@example.com',
        password: 'hashedPassword123',
        rol: 'admin',
        activo: true
      };

      // Act
      const admin = new Admin(adminData);

      // Assert
      expect(admin.id).toBe(1);
      expect(admin.nombre).toBe('Admin');
      expect(admin.email).toBe('admin@example.com');
      expect(admin.rol).toBe('admin');
      expect(admin.activo).toBe(true);
    });
  });

  describe('Admin.create()', () => {
    test('debería crear un nuevo administrador exitosamente', async () => {
      // Arrange
      const adminData = {
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@example.com',
        password: 'password123',
        rol: 'admin'
      };

      const hashedPassword = 'hashedPassword123';
      const insertId = 1;
      const createdAdmin = {
        id: insertId,
        ...adminData,
        password: hashedPassword,
        fecha_registro: new Date(),
        activo: true
      };

      bcrypt.hash.mockResolvedValue(hashedPassword);
      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdAdmin]);

      // Act
      const admin = await Admin.create(adminData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.id).toBe(insertId);
      expect(admin.email).toBe(adminData.email);
    });

    test('debería usar rol por defecto si no se proporciona', async () => {
      // Arrange
      const adminData = {
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@example.com',
        password: 'password123'
      };

      const hashedPassword = 'hashedPassword123';
      const insertId = 1;
      const createdAdmin = {
        id: insertId,
        ...adminData,
        password: hashedPassword,
        rol: 'admin',
        activo: true
      };

      bcrypt.hash.mockResolvedValue(hashedPassword);
      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdAdmin]);

      // Act
      const admin = await Admin.create(adminData);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO administradores'),
        expect.arrayContaining(['admin'])
      );
    });
  });

  describe('Admin.findById()', () => {
    test('debería encontrar un administrador por ID', async () => {
      // Arrange
      const adminId = 1;
      const adminData = {
        id: adminId,
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@example.com',
        rol: 'admin',
        activo: true
      };

      executeQuery.mockResolvedValue([adminData]);

      // Act
      const admin = await Admin.findById(adminId);

      // Assert
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.id).toBe(adminId);
      expect(admin.email).toBe(adminData.email);
    });

    test('debería retornar null si el administrador no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const admin = await Admin.findById(999);

      // Assert
      expect(admin).toBeNull();
    });
  });

  describe('Admin.findByEmail()', () => {
    test('debería encontrar un administrador por email', async () => {
      // Arrange
      const email = 'admin@example.com';
      const adminData = {
        id: 1,
        nombre: 'Admin',
        email: email,
        rol: 'admin',
        activo: true
      };

      executeQuery.mockResolvedValue([adminData]);

      // Act
      const admin = await Admin.findByEmail(email);

      // Assert
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.email).toBe(email);
    });
  });

  describe('admin.update()', () => {
    test('debería actualizar campos permitidos del administrador', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        nombre: 'Admin',
        apellido: 'Principal',
        rol: 'admin',
        activo: true
      });

      const updateData = {
        nombre: 'Admin Actualizado',
        rol: 'super_admin'
      };

      const updatedAdminData = {
        ...admin,
        ...updateData
      };

      executeQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updatedAdminData]);

      // Act
      const result = await admin.update(updateData);

      // Assert
      expect(admin.nombre).toBe(updateData.nombre);
      expect(admin.rol).toBe(updateData.rol);
      expect(result).toBe(admin);
    });

    test('debería lanzar error si no hay campos válidos para actualizar', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        nombre: 'Admin',
        activo: true
      });

      const updateData = {
        email: 'nuevo@example.com' // Campo no permitido
      };

      // Act & Assert
      await expect(admin.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('admin.changePassword()', () => {
    test('debería cambiar la contraseña si la actual es correcta', async () => {
      // Arrange
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword123';
      const oldHashedPassword = 'hashedOldPassword';
      const newHashedPassword = 'hashedNewPassword';

      const admin = new Admin({
        id: 1,
        email: 'admin@example.com',
        password: oldHashedPassword,
        activo: true
      });

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue(newHashedPassword);
      executeQuery.mockResolvedValue([]);

      // Act
      const result = await admin.changePassword(currentPassword, newPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, oldHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(admin.password).toBe(newHashedPassword);
      expect(result).toBe(true);
    });

    test('debería lanzar error si la contraseña actual es incorrecta', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        password: 'hashedPassword',
        activo: true
      });

      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(admin.changePassword('wrong', 'new')).rejects.toThrow('Password actual incorrecto');
    });
  });

  describe('admin.verifyPassword()', () => {
    test('debería verificar contraseña correcta', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        password: 'hashedPassword',
        activo: true
      });

      bcrypt.compare.mockResolvedValue(true);

      // Act
      const isValid = await admin.verifyPassword('password123');

      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('admin.updateLastAccess()', () => {
    test('debería actualizar el último acceso', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await admin.updateLastAccess();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE administradores SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );
      expect(result).toBe(admin);
    });
  });

  describe('admin.isSuperAdmin()', () => {
    test('debería retornar true si es super admin', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        rol: 'super_admin',
        activo: true
      });

      // Act
      const isSuper = admin.isSuperAdmin();

      // Assert
      expect(isSuper).toBe(true);
    });

    test('debería retornar false si no es super admin', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        rol: 'admin',
        activo: true
      });

      // Act
      const isSuper = admin.isSuperAdmin();

      // Assert
      expect(isSuper).toBe(false);
    });
  });

  describe('admin.canPerformAction()', () => {
    test('debería retornar true para acciones permitidas de admin', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        rol: 'admin',
        activo: true
      });

      // Act & Assert
      expect(admin.canPerformAction('read_products')).toBe(true);
      expect(admin.canPerformAction('create_products')).toBe(true);
      expect(admin.canPerformAction('delete_users')).toBe(false);
    });

    test('debería retornar true para todas las acciones si es super admin', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        rol: 'super_admin',
        activo: true
      });

      // Act & Assert
      expect(admin.canPerformAction('read_products')).toBe(true);
      expect(admin.canPerformAction('create_admins')).toBe(true);
      expect(admin.canPerformAction('delete_admins')).toBe(true);
    });
  });

  describe('admin.deactivate()', () => {
    test('debería desactivar un administrador', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await admin.deactivate();

      // Assert
      expect(admin.activo).toBe(false);
      expect(result).toBe(admin);
    });
  });

  describe('admin.getStats()', () => {
    test('debería retornar estadísticas del administrador', async () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        nombre: 'Admin',
        apellido: 'Principal',
        rol: 'admin',
        fecha_registro: new Date(),
        ultimo_acceso: new Date(),
        activo: true
      });

      // Act
      const stats = await admin.getStats();

      // Assert
      expect(stats).toHaveProperty('id');
      expect(stats).toHaveProperty('nombre');
      expect(stats).toHaveProperty('rol');
      expect(stats.nombre).toBe('Admin Principal');
    });
  });

  describe('admin.toJSON()', () => {
    test('debería convertir a JSON sin incluir password', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        nombre: 'Admin',
        email: 'admin@example.com',
        password: 'hashedPassword123',
        rol: 'admin',
        activo: true
      });

      // Act
      const json = admin.toJSON();

      // Assert
      expect(json).not.toHaveProperty('password');
      expect(json.id).toBe(1);
      expect(json.rol).toBe('admin');
    });

    test('debería asignar rol por defecto si no existe', () => {
      // Arrange
      const admin = new Admin({
        id: 1,
        nombre: 'Admin',
        email: 'admin@example.com',
        activo: true
      });

      // Act
      const json = admin.toJSON();

      // Assert
      expect(json.rol).toBe('admin');
    });
  });
});

