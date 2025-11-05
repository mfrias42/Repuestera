/**
 * Tests unitarios para middleware de upload
 * Patrón AAA: Arrange, Act, Assert
 */

const multer = require('multer');
const fs = require('fs').promises;
const {
  handleMulterError,
  validateImage,
  deleteOldImage,
  uploadProductImage
} = require('../../../middleware/upload');

// Mock de fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(),
    readdir: jest.fn().mockResolvedValue([])
  }
}));

describe('Middleware de Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMulterError', () => {
    test('debería manejar error de tamaño de archivo excedido', () => {
      // Arrange
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleMulterError(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo demasiado grande'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería manejar error de demasiados archivos', () => {
      // Arrange
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleMulterError(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Demasiados archivos'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería manejar error de campo inesperado', () => {
      // Arrange
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleMulterError(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Campo de archivo inesperado'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería manejar error de tipo de archivo no permitido', () => {
      // Arrange
      const error = new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP, GIF)');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleMulterError(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tipo de archivo no válido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería pasar otros errores al siguiente middleware', () => {
      // Arrange
      const error = new Error('Otro error');
      const req = {};
      const res = {};
      const next = jest.fn();

      // Act
      handleMulterError(error, req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateImage', () => {
    test('debería continuar si no hay archivo', async () => {
      // Arrange
      const req = {};
      const res = {};
      const next = jest.fn();

      // Act
      await validateImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    test('debería validar y procesar archivo existente', async () => {
      // Arrange
      const req = {
        file: {
          path: '/uploads/products/test.jpg',
          filename: 'test.jpg',
          size: 1024 * 1024 // 1MB
        }
      };
      const res = {};
      const next = jest.fn();

      fs.access.mockResolvedValue();

      // Act
      await validateImage(req, res, next);

      // Assert
      expect(fs.access).toHaveBeenCalledWith(req.file.path);
      expect(req.file.url).toBe('/uploads/products/test.jpg');
      expect(req.file.size_mb).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    test('debería eliminar archivo y retornar error si no existe', async () => {
      // Arrange
      const req = {
        file: {
          path: '/uploads/products/test.jpg',
          filename: 'test.jpg'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      fs.access.mockRejectedValue(new Error('File not found'));
      fs.unlink.mockResolvedValue();

      // Act
      await validateImage(req, res, next);

      // Assert
      expect(fs.access).toHaveBeenCalledWith(req.file.path);
      expect(fs.unlink).toHaveBeenCalledWith(req.file.path);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error procesando imagen'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteOldImage', () => {
    test('debería eliminar imagen anterior exitosamente', async () => {
      // Arrange
      const imagePath = '/uploads/products/old-image.jpg';
      fs.access.mockResolvedValue();
      fs.unlink.mockResolvedValue();

      // Act
      await deleteOldImage(imagePath);

      // Assert
      expect(fs.unlink).toHaveBeenCalled();
    });

    test('debería hacer nada si no hay ruta de imagen', async () => {
      // Arrange
      const imagePath = null;

      // Act
      await deleteOldImage(imagePath);

      // Assert
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test('debería manejar error al eliminar sin lanzar excepción', async () => {
      // Arrange
      const imagePath = '/uploads/products/nonexistent.jpg';
      fs.access.mockRejectedValue(new Error('File not found'));

      // Act & Assert - No debería lanzar error
      await expect(deleteOldImage(imagePath)).resolves.not.toThrow();
    });
  });
});

