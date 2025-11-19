/**
 * Tests unitarios para el modelo User
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

const User = require('../../../models/User');
const { executeQuery } = require('../../../config/database-mysql');
const bcrypt = require('bcryptjs');
const { mockData, setupMockResponse } = require('../../helpers/db-mock');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debe crear una instancia de User con los datos proporcionados', () => {
      // Arrange
      const userData = mockData.users[0];

      // Act
      const user = new User(userData);

      // Assert
      expect(user.id).toBe(userData.id);
      expect(user.nombre).toBe(userData.nombre);
      expect(user.email).toBe(userData.email);
      expect(user.activo).toBe(true);
    });
  });

  describe('findById', () => {
    test('debe retornar un usuario cuando existe', async () => {
      // Arrange
      setupMockResponse('user_found');
      executeQuery.mockResolvedValue([mockData.users[0]]);

      // Act
      const user = await User.findById(1);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.email).toBe('juan@example.com');
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
        [1]
      );
    });

    test('debe retornar null cuando el usuario no existe', async () => {
      // Arrange
      setupMockResponse('user_not_found');
      executeQuery.mockResolvedValue([]);

      // Act
      const user = await User.findById(999);

      // Assert
      expect(user).toBeNull();
    });

    test('debe manejar errores de base de datos', async () => {
      // Arrange
      setupMockResponse('database_error');
      executeQuery.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(User.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    test('debe retornar un usuario cuando el email existe', async () => {
      // Arrange
      const email = 'juan@example.com';
      executeQuery.mockResolvedValue([mockData.users[0]]);

      // Act
      const user = await User.findByEmail(email);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(email);
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );
    });

    test('debe retornar null cuando el email no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const user = await User.findByEmail('nonexistent@example.com');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    test('debe crear un nuevo usuario correctamente', async () => {
      // Arrange
      const userData = {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@example.com',
        password: 'password123',
        telefono: '123456789',
        direccion: 'Calle Nueva'
      };
      
      const hashedPassword = '$2a$12$hashed';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      executeQuery
        .mockResolvedValueOnce({ insertId: 3 })
        .mockResolvedValueOnce([{
          ...userData,
          id: 3,
          password: hashedPassword,
          fecha_registro: new Date(),
          activo: true
        }]);

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(executeQuery).toHaveBeenCalledTimes(2);
    });

    test('debe lanzar error si no se puede crear el usuario', async () => {
      // Arrange
      const userData = {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@example.com',
        password: 'password123'
      };
      
      bcrypt.hash.mockResolvedValue('$2a$12$hashed');
      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow('Error al crear usuario');
    });
  });

  describe('verifyPassword', () => {
    test('debe retornar true cuando la contraseña es correcta', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const password = 'password123';
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await user.verifyPassword(password);

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    test('debe retornar false cuando la contraseña es incorrecta', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const wrongPassword = 'wrongpassword';
      bcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await user.verifyPassword(wrongPassword);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    test('debe actualizar campos permitidos correctamente', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const updateData = {
        nombre: 'Juan Actualizado',
        telefono: '999999999'
      };
      
      executeQuery
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([{
          ...mockData.users[0],
          ...updateData
        }]);

      // Act
      const updatedUser = await user.update(updateData);

      // Assert
      expect(updatedUser.nombre).toBe(updateData.nombre);
      expect(updatedUser.telefono).toBe(updateData.telefono);
      expect(executeQuery).toHaveBeenCalledTimes(2);
    });

    test('debe lanzar error si no hay campos válidos para actualizar', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const updateData = {
        campoInvalido: 'valor'
      };

      // Act & Assert
      await expect(user.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('changePassword', () => {
    test('debe cambiar la contraseña cuando la actual es correcta', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword123';
      const newHashedPassword = '$2a$12$newhashed';
      
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue(newHashedPassword);
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await user.changePassword(currentPassword, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, user.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(executeQuery).toHaveBeenCalled();
    });

    test('debe lanzar error si la contraseña actual es incorrecta', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      const wrongPassword = 'wrongpassword';
      const newPassword = 'newpassword123';
      
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(user.changePassword(wrongPassword, newPassword))
        .rejects.toThrow('Password actual incorrecto');
    });
  });

  describe('deactivate', () => {
    test('debe desactivar un usuario correctamente', async () => {
      // Arrange
      const user = new User(mockData.users[0]);
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await user.deactivate();

      // Assert
      expect(result.activo).toBe(false);
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE usuarios SET activo = FALSE WHERE id = ?',
        [user.id]
      );
    });
  });

  describe('activate', () => {
    test('debe activar un usuario correctamente', async () => {
      // Arrange
      const user = new User({ ...mockData.users[0], activo: false });
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await user.activate();

      // Assert
      expect(result.activo).toBe(true);
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE usuarios SET activo = TRUE WHERE id = ?',
        [user.id]
      );
    });
  });

  describe('findAll', () => {
    test('debe retornar lista de usuarios con paginación', async () => {
      // Arrange
      executeQuery.mockResolvedValue(mockData.users);

      // Act
      const users = await User.findAll(10, 0);

      // Assert
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(executeQuery).toHaveBeenCalled();
    });

    test('debe usar valores por defecto para limit y offset', async () => {
      // Arrange
      executeQuery.mockResolvedValue(mockData.users);

      // Act
      await User.findAll();

      // Assert
      const callArgs = executeQuery.mock.calls[0][0];
      expect(callArgs).toContain('LIMIT 50');
    });
  });

  describe('count', () => {
    test('debe retornar el número total de usuarios activos', async () => {
      // Arrange
      executeQuery.mockResolvedValue([{ total: 2 }]);

      // Act
      const count = await User.count();

      // Assert
      expect(count).toBe(2);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        expect.any(Array)
      );
    });
  });

  describe('search', () => {
    test('debe buscar usuarios por término', async () => {
      // Arrange
      const searchTerm = 'Juan';
      executeQuery.mockResolvedValue([mockData.users[0]]);

      // Act
      const users = await User.search(searchTerm);

      // Assert
      expect(users).toHaveLength(1);
      expect(users[0].nombre).toContain('Juan');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining([`%${searchTerm}%`])
      );
    });
  });

  describe('toJSON', () => {
    test('debe retornar objeto sin password', () => {
      // Arrange
      const user = new User(mockData.users[0]);

      // Act
      const json = user.toJSON();

      // Assert
      expect(json).not.toHaveProperty('password');
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email');
    });
  });
});

