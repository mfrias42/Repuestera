/**
 * Tests unitarios para el modelo User
 * Patrón AAA: Arrange, Act, Assert
 */

const User = require('../../../models/User');
const { executeQuery } = require('../../../config/database-mysql');
const bcrypt = require('bcryptjs');

// Mock de executeQuery
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

// Mock de bcrypt
jest.mock('bcryptjs');

describe('Modelo User', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debería crear una instancia de User con los datos proporcionados', () => {
      // Arrange
      const userData = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'hashedPassword123',
        telefono: '1234567890',
        direccion: 'Calle 123',
        fecha_registro: new Date(),
        activo: true
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.id).toBe(1);
      expect(user.nombre).toBe('Juan');
      expect(user.apellido).toBe('Pérez');
      expect(user.email).toBe('juan@example.com');
      expect(user.password).toBe('hashedPassword123');
      expect(user.telefono).toBe('1234567890');
      expect(user.direccion).toBe('Calle 123');
      expect(user.activo).toBe(true);
    });
  });

  describe('User.create()', () => {
    test('debería crear un nuevo usuario exitosamente', async () => {
      // Arrange
      const userData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'password123',
        telefono: '1234567890',
        direccion: 'Calle 123'
      };

      const hashedPassword = 'hashedPassword123';
      const insertId = 1;
      const createdUser = {
        id: insertId,
        ...userData,
        password: hashedPassword,
        fecha_registro: new Date(),
        activo: true
      };

      bcrypt.hash.mockResolvedValue(hashedPassword);
      executeQuery
        .mockResolvedValueOnce({ insertId }) // Para INSERT
        .mockResolvedValueOnce([createdUser]); // Para findById

      // Act
      const user = await User.create(userData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(insertId);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(hashedPassword);
    });

    test('debería crear usuario con campos opcionales como null', async () => {
      // Arrange
      const userData = {
        nombre: 'María',
        apellido: 'García',
        email: 'maria@example.com',
        password: 'password123'
      };

      const hashedPassword = 'hashedPassword123';
      const insertId = 2;
      const createdUser = {
        id: insertId,
        ...userData,
        password: hashedPassword,
        telefono: null,
        direccion: null,
        fecha_registro: new Date(),
        activo: true
      };

      bcrypt.hash.mockResolvedValue(hashedPassword);
      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdUser]);

      // Act
      const user = await User.create(userData);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        expect.arrayContaining([null, null])
      );
      expect(user.telefono).toBeNull();
      expect(user.direccion).toBeNull();
    });

    test('debería lanzar error si no se puede crear el usuario', async () => {
      // Arrange
      const userData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'password123'
      };

      bcrypt.hash.mockResolvedValue('hashedPassword123');
      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow('Error al crear usuario');
    });
  });

  describe('User.findById()', () => {
    test('debería encontrar un usuario por ID', async () => {
      // Arrange
      const userId = 1;
      const userData = {
        id: userId,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'hashedPassword123',
        telefono: '1234567890',
        direccion: 'Calle 123',
        fecha_registro: new Date(),
        activo: true
      };

      executeQuery.mockResolvedValue([userData]);

      // Act
      const user = await User.findById(userId);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
        [userId]
      );
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(userId);
      expect(user.email).toBe(userData.email);
    });

    test('debería retornar null si el usuario no existe', async () => {
      // Arrange
      const userId = 999;
      executeQuery.mockResolvedValue([]);

      // Act
      const user = await User.findById(userId);

      // Assert
      expect(user).toBeNull();
    });

    test('debería retornar null si el usuario está inactivo', async () => {
      // Arrange
      const userId = 1;
      executeQuery.mockResolvedValue([]);

      // Act
      const user = await User.findById(userId);

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('User.findByEmail()', () => {
    test('debería encontrar un usuario por email', async () => {
      // Arrange
      const email = 'juan@example.com';
      const userData = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: email,
        password: 'hashedPassword123',
        activo: true
      };

      executeQuery.mockResolvedValue([userData]);

      // Act
      const user = await User.findByEmail(email);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(email);
    });

    test('debería retornar null si el email no existe', async () => {
      // Arrange
      const email = 'noexiste@example.com';
      executeQuery.mockResolvedValue([]);

      // Act
      const user = await User.findByEmail(email);

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('User.findAll()', () => {
    test('debería obtener todos los usuarios con límite y offset por defecto', async () => {
      // Arrange
      const usersData = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', activo: true },
        { id: 2, nombre: 'María', apellido: 'García', email: 'maria@example.com', activo: true }
      ];

      executeQuery.mockResolvedValue(usersData);

      // Act
      const users = await User.findAll();

      // Assert
      expect(executeQuery).toHaveBeenCalled();
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].nombre).toBe('Juan');
    });

    test('debería aplicar límite y offset personalizados', async () => {
      // Arrange
      const limit = 10;
      const offset = 5;
      const usersData = [{ id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', activo: true }];

      executeQuery.mockResolvedValue(usersData);

      // Act
      await User.findAll(limit, offset);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining(`LIMIT ${limit} OFFSET ${offset}`),
        []
      );
    });
  });

  describe('user.update()', () => {
    test('debería actualizar campos permitidos del usuario', async () => {
      // Arrange
      const user = new User({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        activo: true
      });

      const updateData = {
        nombre: 'Juan Carlos',
        telefono: '9876543210'
      };

      const updatedUserData = {
        ...user,
        ...updateData
      };

      executeQuery
        .mockResolvedValueOnce([]) // Para UPDATE
        .mockResolvedValueOnce([updatedUserData]); // Para findById

      // Act
      const result = await user.update(updateData);

      // Assert
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(user.nombre).toBe(updateData.nombre);
      expect(user.telefono).toBe(updateData.telefono);
      expect(result).toBe(user);
    });

    test('debería ignorar campos no permitidos', async () => {
      // Arrange
      const user = new User({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        activo: true
      });

      const updateData = {
        nombre: 'Juan Carlos',
        email: 'nuevo@example.com', // Campo no permitido
        password: 'newpassword' // Campo no permitido
      };

      const updatedUserData = {
        ...user,
        nombre: 'Juan Carlos'
      };

      executeQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updatedUserData]);

      // Act
      await user.update(updateData);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('nombre = ?'),
        expect.arrayContaining(['Juan Carlos'])
      );
      expect(executeQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('email = ?'),
        expect.anything()
      );
    });

    test('debería lanzar error si no hay campos válidos para actualizar', async () => {
      // Arrange
      const user = new User({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        activo: true
      });

      const updateData = {
        email: 'nuevo@example.com', // Campo no permitido
        password: 'newpassword' // Campo no permitido
      };

      // Act & Assert
      await expect(user.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('user.changePassword()', () => {
    test('debería cambiar la contraseña si la actual es correcta', async () => {
      // Arrange
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword123';
      const oldHashedPassword = 'hashedOldPassword';
      const newHashedPassword = 'hashedNewPassword';

      const user = new User({
        id: 1,
        email: 'juan@example.com',
        password: oldHashedPassword,
        activo: true
      });

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue(newHashedPassword);
      executeQuery.mockResolvedValue([]);

      // Act
      const result = await user.changePassword(currentPassword, newPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, oldHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [newHashedPassword, user.id]
      );
      expect(user.password).toBe(newHashedPassword);
      expect(result).toBe(true);
    });

    test('debería lanzar error si la contraseña actual es incorrecta', async () => {
      // Arrange
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword123';
      const oldHashedPassword = 'hashedOldPassword';

      const user = new User({
        id: 1,
        email: 'juan@example.com',
        password: oldHashedPassword,
        activo: true
      });

      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(user.changePassword(currentPassword, newPassword)).rejects.toThrow(
        'Password actual incorrecto'
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('user.verifyPassword()', () => {
    test('debería verificar contraseña correcta', async () => {
      // Arrange
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      const user = new User({
        id: 1,
        password: hashedPassword,
        activo: true
      });

      bcrypt.compare.mockResolvedValue(true);

      // Act
      const isValid = await user.verifyPassword(password);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('debería retornar false para contraseña incorrecta', async () => {
      // Arrange
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';
      const user = new User({
        id: 1,
        password: hashedPassword,
        activo: true
      });

      bcrypt.compare.mockResolvedValue(false);

      // Act
      const isValid = await user.verifyPassword(password);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('user.deactivate()', () => {
    test('debería desactivar un usuario', async () => {
      // Arrange
      const user = new User({
        id: 1,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await user.deactivate();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE usuarios SET activo = FALSE WHERE id = ?',
        [user.id]
      );
      expect(user.activo).toBe(false);
      expect(result).toBe(user);
    });
  });

  describe('user.activate()', () => {
    test('debería activar un usuario', async () => {
      // Arrange
      const user = new User({
        id: 1,
        activo: false
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await user.activate();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE usuarios SET activo = TRUE WHERE id = ?',
        [user.id]
      );
      expect(user.activo).toBe(true);
      expect(result).toBe(user);
    });
  });

  describe('User.count()', () => {
    test('debería contar el total de usuarios activos', async () => {
      // Arrange
      const total = 42;
      executeQuery.mockResolvedValue([{ total }]);

      // Act
      const count = await User.count();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'
      );
      expect(count).toBe(total);
    });
  });

  describe('User.search()', () => {
    test('debería buscar usuarios por término', async () => {
      // Arrange
      const searchTerm = 'juan';
      const usersData = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', activo: true }
      ];

      executeQuery.mockResolvedValue(usersData);

      // Act
      const users = await User.search(searchTerm);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('nombre LIKE ?'),
        expect.arrayContaining([`%${searchTerm}%`])
      );
      expect(users).toHaveLength(1);
      expect(users[0]).toBeInstanceOf(User);
    });
  });

  describe('user.toJSON()', () => {
    test('debería convertir a JSON sin incluir password', () => {
      // Arrange
      const user = new User({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'hashedPassword123',
        activo: true
      });

      // Act
      const json = user.toJSON();

      // Assert
      expect(json).not.toHaveProperty('password');
      expect(json.id).toBe(1);
      expect(json.nombre).toBe('Juan');
      expect(json.email).toBe('juan@example.com');
    });
  });
});

