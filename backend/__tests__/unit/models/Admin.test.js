/**
 * Tests unitarios para el modelo Admin
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de dependencias externas ANTES de importar los módulos
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

const Admin = require('../../../models/Admin');
const { executeQuery } = require('../../../config/database-mysql');
const bcrypt = require('bcryptjs');
const { mockData, setupMockResponse } = require('../../helpers/db-mock');

describe('Admin Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debe crear una instancia de Admin con los datos proporcionados', () => {
      // Arrange
      const adminData = mockData.admins[0];

      // Act
      const admin = new Admin(adminData);

      // Assert
      expect(admin.id).toBe(adminData.id);
      expect(admin.email).toBe(adminData.email);
      expect(admin.rol).toBe('super_admin');
      expect(admin.activo).toBe(true);
    });

    test('debe asignar rol por defecto "admin" si no se proporciona', () => {
      // Arrange
      const adminData = {
        ...mockData.admins[0],
        rol: null
      };

      // Act
      const admin = new Admin(adminData);

      // Assert
      expect(admin.rol).toBe('admin');
    });
  });

  describe('isSuperAdmin', () => {
    test('debe retornar true cuando el rol es super_admin', () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);

      // Act
      const result = admin.isSuperAdmin();

      // Assert
      expect(result).toBe(true);
    });

    test('debe retornar false cuando el rol es admin', () => {
      // Arrange
      const admin = new Admin({ ...mockData.admins[0], rol: 'admin' });

      // Act
      const result = admin.isSuperAdmin();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    test('debe retornar true para permisos de super_admin', () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);

      // Act & Assert
      expect(admin.canPerformAction('read_products')).toBe(true);
      expect(admin.canPerformAction('create_products')).toBe(true);
      expect(admin.canPerformAction('create_admins')).toBe(true);
      expect(admin.canPerformAction('delete_admins')).toBe(true);
    });

    test('debe retornar true solo para permisos básicos de admin', () => {
      // Arrange
      const admin = new Admin({ ...mockData.admins[0], rol: 'admin' });

      // Act & Assert
      expect(admin.canPerformAction('read_products')).toBe(true);
      expect(admin.canPerformAction('create_products')).toBe(true);
      expect(admin.canPerformAction('create_admins')).toBe(false);
      expect(admin.canPerformAction('delete_admins')).toBe(false);
    });

    test('debe retornar false para acciones no permitidas', () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);

      // Act
      const result = admin.canPerformAction('invalid_action');

      // Assert
      expect(result).toBe(false);
    });

    test('debe manejar rol null asignando admin por defecto', () => {
      // Arrange
      const admin = new Admin({ ...mockData.admins[0], rol: null });

      // Act & Assert
      expect(admin.canPerformAction('read_products')).toBe(true);
      expect(admin.canPerformAction('create_admins')).toBe(false);
    });
  });

  describe('findById', () => {
    test('debe retornar un administrador cuando existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.admins[0]]);

      // Act
      const admin = await Admin.findById(1);

      // Assert
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.id).toBe(1);
      expect(admin.email).toBe('admin@repuestera.com');
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM administradores WHERE id = ? AND activo = TRUE',
        [1]
      );
    });

    test('debe retornar null cuando el administrador no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const admin = await Admin.findById(999);

      // Assert
      expect(admin).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('debe retornar un administrador cuando el email existe', async () => {
      // Arrange
      const email = 'admin@repuestera.com';
      executeQuery.mockResolvedValue([mockData.admins[0]]);

      // Act
      const admin = await Admin.findByEmail(email);

      // Assert
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.email).toBe(email);
    });
  });

  describe('create', () => {
    test('debe crear un nuevo administrador correctamente', async () => {
      // Arrange
      const adminData = {
        nombre: 'Nuevo',
        apellido: 'Admin',
        email: 'nuevo@repuestera.com',
        password: 'password123',
        rol: 'admin'
      };
      
      const hashedPassword = '$2a$12$hashed';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      executeQuery
        .mockResolvedValueOnce({ insertId: 2 })
        .mockResolvedValueOnce([{
          ...adminData,
          id: 2,
          password: hashedPassword,
          fecha_registro: new Date(),
          activo: true
        }]);

      // Act
      const admin = await Admin.create(adminData);

      // Assert
      expect(admin).toBeInstanceOf(Admin);
      expect(admin.email).toBe(adminData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(adminData.password, 12);
    });

    test('debe usar rol "admin" por defecto si no se proporciona', async () => {
      // Arrange
      const adminData = {
        nombre: 'Nuevo',
        apellido: 'Admin',
        email: 'nuevo@repuestera.com',
        password: 'password123'
      };
      
      bcrypt.hash.mockResolvedValue('$2a$12$hashed');
      executeQuery
        .mockResolvedValueOnce({ insertId: 2 })
        .mockResolvedValueOnce([{
          ...adminData,
          id: 2,
          rol: 'admin',
          password: '$2a$12$hashed',
          fecha_registro: new Date(),
          activo: true
        }]);

      // Act
      const admin = await Admin.create(adminData);

      // Assert
      expect(admin.rol).toBe('admin');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO administradores'),
        expect.arrayContaining(['admin'])
      );
    });
  });

  describe('updateLastAccess', () => {
    test('debe actualizar el último acceso correctamente', async () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await admin.updateLastAccess();

      // Assert
      expect(result.ultimo_acceso).toBeInstanceOf(Date);
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE administradores SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );
    });
  });

  describe('update', () => {
    test('debe actualizar campos permitidos correctamente', async () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);
      const updateData = {
        nombre: 'Admin Actualizado',
        rol: 'admin'
      };
      
      executeQuery
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([{
          ...mockData.admins[0],
          ...updateData
        }]);

      // Act
      const updatedAdmin = await admin.update(updateData);

      // Assert
      expect(updatedAdmin.nombre).toBe(updateData.nombre);
      expect(updatedAdmin.rol).toBe(updateData.rol);
    });

    test('debe rechazar campos no permitidos', async () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);
      const updateData = {
        email: 'nuevo@email.com', // No permitido
        password: 'nuevopassword' // No permitido
      };

      // Act & Assert
      await expect(admin.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('getStats', () => {
    test('debe retornar estadísticas del administrador', async () => {
      // Arrange
      const adminData = mockData.admins[0];
      const admin = new Admin(adminData);

      // Act
      const stats = await admin.getStats();

      // Assert
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('id');
      expect(stats).toHaveProperty('nombre');
      expect(stats).toHaveProperty('rol');
      expect(stats.id).toBe(adminData.id);
      expect(stats.nombre).toBe(`${adminData.nombre} ${adminData.apellido}`); // 'Admin Sistema'
      expect(stats.rol).toBe(adminData.rol);
    });
  });

  describe('toJSON', () => {
    test('debe retornar objeto sin password', () => {
      // Arrange
      const admin = new Admin(mockData.admins[0]);

      // Act
      const json = admin.toJSON();

      // Assert
      expect(json).not.toHaveProperty('password');
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email');
      expect(json).toHaveProperty('rol');
    });

    test('debe asignar rol por defecto si es null', () => {
      // Arrange
      const admin = new Admin({ ...mockData.admins[0], rol: null });

      // Act
      const json = admin.toJSON();

      // Assert
      expect(json.rol).toBe('admin');
    });
  });
});

