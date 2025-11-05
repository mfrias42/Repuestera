/**
 * Tests unitarios para middleware de validación
 * Patrón AAA: Arrange, Act, Assert
 */

const { validationResult } = require('express-validator');
const {
  handleValidationErrors,
  sanitizeInput,
  validatePagination,
  validateNumericId,
  asyncHandler,
  validateJSON,
  validateContentType
} = require('../../../middleware/validation');

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Middleware de Validación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleValidationErrors', () => {
    test('debería continuar si no hay errores de validación', () => {
      // Arrange
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleValidationErrors(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debería retornar error si hay errores de validación', () => {
      // Arrange
      const errors = [
        { path: 'email', msg: 'Email inválido', value: 'invalid-email' },
        { param: 'password', msg: 'Contraseña muy corta', value: '123' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      handleValidationErrors(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos de entrada inválidos',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email', message: 'Email inválido' })
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeInput', () => {
    test('debería sanitizar strings eliminando espacios', () => {
      // Arrange
      const req = {
        body: {
          nombre: '  Juan  ',
          email: 'test@example.com  '
        },
        query: {},
        params: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      sanitizeInput(req, res, next);

      // Assert
      expect(req.body.nombre).toBe('Juan');
      expect(req.body.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    test('debería sanitizar arrays recursivamente', () => {
      // Arrange
      const req = {
        body: {
          items: ['  item1  ', '  item2  ']
        },
        query: {},
        params: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      sanitizeInput(req, res, next);

      // Assert
      expect(req.body.items[0]).toBe('item1');
      expect(req.body.items[1]).toBe('item2');
      expect(next).toHaveBeenCalled();
    });

    test('debería sanitizar objetos anidados', () => {
      // Arrange
      const req = {
        body: {
          user: {
            nombre: '  Juan  ',
            email: '  test@example.com  '
          }
        },
        query: {},
        params: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      sanitizeInput(req, res, next);

      // Assert
      expect(req.body.user.nombre).toBe('Juan');
      expect(req.body.user.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validatePagination', () => {
    test('debería usar valores por defecto si no se proporcionan', () => {
      // Arrange
      const req = {
        query: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      validatePagination(req, res, next);

      // Assert
      expect(req.pagination.page).toBe(1);
      expect(req.pagination.limit).toBe(20);
      expect(req.pagination.offset).toBe(0);
      expect(next).toHaveBeenCalled();
    });

    test('debería usar valores proporcionados si son válidos', () => {
      // Arrange
      const req = {
        query: {
          page: '2',
          limit: '10'
        }
      };
      const res = {};
      const next = jest.fn();

      // Act
      validatePagination(req, res, next);

      // Assert
      expect(req.pagination.page).toBe(2);
      expect(req.pagination.limit).toBe(10);
      expect(req.pagination.offset).toBe(10);
      expect(next).toHaveBeenCalled();
    });

    test('debería rechazar página menor a 1', () => {
      // Arrange
      const req = {
        query: {
          page: '-1' // Usar -1 en lugar de 0, ya que parseInt('0') || 1 = 1
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      validatePagination(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Parámetro inválido',
          message: 'La página debe ser mayor a 0'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar límite fuera del rango', () => {
      // Arrange
      const req = {
        query: {
          limit: '150'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      validatePagination(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Parámetro inválido',
          message: 'El límite debe estar entre 1 y 100'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateNumericId', () => {
    test('debería validar ID numérico válido', () => {
      // Arrange
      const req = {
        params: {
          id: '123'
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = validateNumericId('id');

      // Act
      middleware(req, res, next);

      // Assert
      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalled();
    });

    test('debería rechazar ID no numérico', () => {
      // Arrange
      const req = {
        params: {
          id: 'abc'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateNumericId('id');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ID inválido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar ID menor a 1', () => {
      // Arrange
      const req = {
        params: {
          id: '0'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateNumericId('id');

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('debería funcionar con nombre de parámetro personalizado', () => {
      // Arrange
      const req = {
        params: {
          userId: '456'
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = validateNumericId('userId');

      // Act
      middleware(req, res, next);

      // Assert
      expect(req.params.userId).toBe(456);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    test('debería manejar funciones async exitosamente', async () => {
      // Arrange
      const asyncFn = async (req, res, next) => {
        res.status(200).json({ success: true });
      };

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const handler = asyncHandler(asyncFn);

      // Act
      await handler(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería pasar errores al next si ocurre una excepción', async () => {
      // Arrange
      const error = new Error('Test error');
      const asyncFn = async (req, res, next) => {
        throw error;
      };

      const req = {};
      const res = {};
      const next = jest.fn();

      const handler = asyncHandler(asyncFn);

      // Act
      await handler(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateJSON', () => {
    test('debería continuar si el Content-Type es JSON válido', () => {
      // Arrange
      const req = {
        is: jest.fn().mockReturnValue(true),
        body: { test: 'data' }
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateJSON(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    test('debería continuar si no es JSON', () => {
      // Arrange
      const req = {
        is: jest.fn().mockReturnValue(false)
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateJSON(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateContentType', () => {
    test('debería permitir Content-Type permitido', () => {
      // Arrange
      const req = {
        get: jest.fn().mockReturnValue('application/json')
      };
      const res = {};
      const next = jest.fn();

      const middleware = validateContentType(['application/json', 'multipart/form-data']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    test('debería rechazar Content-Type no permitido', () => {
      // Arrange
      const req = {
        get: jest.fn().mockReturnValue('text/plain')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateContentType(['application/json']);

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar si no hay Content-Type', () => {
      // Arrange
      const req = {
        get: jest.fn().mockReturnValue(undefined)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateContentType();

      // Act
      middleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Content-Type requerido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

