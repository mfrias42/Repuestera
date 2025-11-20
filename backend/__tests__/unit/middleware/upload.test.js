// Mock de fs.promises ANTES de importar el módulo
const mockFs = {
  mkdir: jest.fn(),
  access: jest.fn(),
  unlink: jest.fn(),
  readdir: jest.fn()
};

jest.mock('fs', () => ({
  promises: mockFs
}));

// Importar multer para usar MulterError
const multer = require('multer');

// Importar después del mock
const {
  uploadSingle,
  handleMulterError,
  validateImage,
  deleteOldImage,
  cleanupOrphanedFiles
} = require('../../../middleware/upload');

describe('Upload Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPLOAD_PATH = 'uploads/products';
    process.env.MAX_FILE_SIZE = '5242880'; // 5MB
  });

  describe('handleMulterError', () => {
    it('debe manejar error LIMIT_FILE_SIZE', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new multer.MulterError('LIMIT_FILE_SIZE');

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo demasiado grande'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe manejar error LIMIT_FILE_COUNT', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new multer.MulterError('LIMIT_FILE_COUNT');

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Demasiados archivos'
        })
      );
    });

    it('debe manejar error LIMIT_UNEXPECTED_FILE', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Campo de archivo inesperado'
        })
      );
    });

    it('debe manejar error de tipo de archivo no permitido', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new Error('Tipo de archivo no permitido. Solo se permiten imágenes');

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tipo de archivo no válido'
        })
      );
    });

    it('debe pasar otros errores al siguiente middleware', () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      const error = new Error('Otro error');

      handleMulterError(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateImage', () => {
    it('debe continuar si no hay archivo', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      await validateImage(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe validar imagen exitosamente', async () => {
      const req = {
        file: {
          path: 'uploads/products/test.jpg',
          filename: 'test.jpg',
          size: 1024
        }
      };
      const res = {};
      const next = jest.fn();

      mockFs.access.mockResolvedValue();

      await validateImage(req, res, next);

      expect(mockFs.access).toHaveBeenCalledWith('uploads/products/test.jpg');
      expect(req.file.url).toBe('/uploads/products/test.jpg');
      expect(req.file.size_mb).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('debe eliminar archivo si hay error al validar', async () => {
      const req = {
        file: {
          path: 'uploads/products/test.jpg',
          filename: 'test.jpg'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.unlink.mockResolvedValue();

      await validateImage(req, res, next);

      expect(mockFs.unlink).toHaveBeenCalledWith('uploads/products/test.jpg');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error procesando imagen'
        })
      );
    });
  });

  describe('deleteOldImage', () => {
    it('debe eliminar imagen anterior exitosamente', async () => {
      const imagePath = '/uploads/products/old_image.jpg';
      mockFs.access.mockResolvedValue();
      mockFs.unlink.mockResolvedValue();

      await deleteOldImage(imagePath);

      expect(mockFs.access).toHaveBeenCalled();
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('debe manejar error al eliminar imagen sin lanzar excepción', async () => {
      const imagePath = '/uploads/products/nonexistent.jpg';
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await expect(deleteOldImage(imagePath)).resolves.not.toThrow();
    });

    it('debe retornar sin hacer nada si no hay imagen', async () => {
      await deleteOldImage(null);
      await deleteOldImage(undefined);

      expect(mockFs.access).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOrphanedFiles', () => {
    it('debe listar archivos en el directorio', async () => {
      mockFs.readdir.mockResolvedValue(['file1.jpg', 'file2.jpg']);

      await cleanupOrphanedFiles();

      expect(mockFs.readdir).toHaveBeenCalledWith('uploads/products');
    });

    it('debe manejar error al leer directorio', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(cleanupOrphanedFiles()).resolves.not.toThrow();
    });
  });
});

