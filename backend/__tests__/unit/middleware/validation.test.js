// Mock de express-validator ANTES de importar
let mockValidationResultValue = {
  isEmpty: () => true,
  array: () => []
};

jest.mock('express-validator', () => {
  const actual = jest.requireActual('express-validator');
  return {
    ...actual,
    validationResult: jest.fn((req) => mockValidationResultValue)
  };
});

// Importar después del mock
const {
  handleValidationErrors,
  sanitizeInput,
  logRequest,
  validatePagination,
  validateNumericId,
  asyncHandler,
  validateJSON,
  validateContentType,
  setCacheControl,
  customCORS
} = require('../../../middleware/validation');
const { validationResult } = require('express-validator');

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleValidationErrors', () => {
    beforeEach(() => {
      // Resetear el mock antes de cada test
      mockValidationResultValue = {
        isEmpty: () => true,
        array: () => []
      };
      validationResult.mockReturnValue(mockValidationResultValue);
    });

    it('debe continuar si no hay errores de validación', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe retornar 400 si hay errores de validación', () => {
      const errors = [
        { path: 'email', msg: 'Email inválido', value: 'invalid' },
        { param: 'password', msg: 'Contraseña muy corta', value: '123' }
      ];

      mockValidationResultValue = {
        isEmpty: () => false,
        array: () => errors
      };
      validationResult.mockReturnValue(mockValidationResultValue);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeInput', () => {
    it('debe sanitizar strings eliminando espacios', () => {
      const req = {
        body: { nombre: '  Juan  ', email: 'test@test.com' },
        query: { search: '  producto  ' },
        params: { id: '123' }
      };
      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.nombre).toBe('Juan');
      expect(req.query.search).toBe('producto');
      expect(next).toHaveBeenCalled();
    });

    it('debe sanitizar arrays', () => {
      const req = {
        body: { tags: ['  tag1  ', '  tag2  '] }
      };
      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.tags).toEqual(['tag1', 'tag2']);
      expect(next).toHaveBeenCalled();
    });

    it('debe sanitizar objetos anidados', () => {
      const req = {
        body: {
          usuario: {
            nombre: '  Juan  ',
            direccion: { calle: '  Calle 123  ' }
          }
        }
      };
      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.usuario.nombre).toBe('Juan');
      expect(req.body.usuario.direccion.calle).toBe('Calle 123');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logRequest', () => {
    it('debe registrar request y response', (done) => {
      const req = {
        method: 'GET',
        originalUrl: '/api/test',
        ip: '127.0.0.1'
      };
      const res = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(() => {
              callback();
              done();
            }, 10);
          }
        }),
        statusCode: 200
      };
      const next = jest.fn();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

      consoleSpy.mockRestore();
    });
  });

  describe('validatePagination', () => {
    it('debe validar paginación correcta', () => {
      const req = {
        query: { page: '2', limit: '10' }
      };
      const res = {};
      const next = jest.fn();

      validatePagination(req, res, next);

      expect(req.pagination).toEqual({
        page: 2,
        limit: 10,
        offset: 10
      });
      expect(next).toHaveBeenCalled();
    });

    it('debe usar valores por defecto', () => {
      const req = { query: {} };
      const res = {};
      const next = jest.fn();

      validatePagination(req, res, next);

      expect(req.pagination).toEqual({
        page: 1,
        limit: 20,
        offset: 0
      });
      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar página inválida', () => {
      // parseInt('-1') da -1, y -1 || 1 da -1 (porque -1 es truthy)
      // Entonces page será -1, y -1 < 1 es true
      const req = { query: { page: '-1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validatePagination(req, res, next);

      // Verificar que se llamó a res.status con 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe rechazar límite inválido', () => {
      const req = { query: { limit: '150' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateNumericId', () => {
    it('debe validar ID numérico correcto', () => {
      const middleware = validateNumericId('id');
      const req = { params: { id: '123' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar ID inválido', () => {
      const middleware = validateNumericId('id');
      const req = { params: { id: 'abc' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ID inválido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe rechazar ID menor a 1', () => {
      const middleware = validateNumericId('id');
      const req = { params: { id: '0' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('debe manejar función async exitosa', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(asyncFn);
      const req = {};
      const res = {};
      const next = jest.fn();

      await handler(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('debe manejar errores en función async', async () => {
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);
      const req = {};
      const res = {};
      const next = jest.fn();

      await handler(req, res, next);

      expect(asyncFn).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateJSON', () => {
    it('debe continuar si Content-Type es JSON', () => {
      const req = {
        is: jest.fn().mockReturnValue(true),
        body: { test: 'data' }
      };
      const res = {};
      const next = jest.fn();

      validateJSON(req, res, next);

      expect(req.is).toHaveBeenCalledWith('application/json');
      expect(next).toHaveBeenCalled();
    });

    it('debe continuar si no es JSON', () => {
      const req = {
        is: jest.fn().mockReturnValue(false)
      };
      const res = {};
      const next = jest.fn();

      validateJSON(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateContentType', () => {
    it('debe aceptar Content-Type permitido', () => {
      const middleware = validateContentType(['multipart/form-data']);
      const req = {
        get: jest.fn().mockReturnValue('multipart/form-data; boundary=something')
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar Content-Type no permitido', () => {
      const middleware = validateContentType(['application/json']);
      const req = {
        get: jest.fn().mockReturnValue('text/plain')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('debe rechazar si no hay Content-Type', () => {
      const middleware = validateContentType();
      const req = {
        get: jest.fn().mockReturnValue(null)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('setCacheControl', () => {
    it('debe establecer header Cache-Control', () => {
      const middleware = setCacheControl(3600);
      const req = {};
      const res = {
        set: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('customCORS', () => {
    it('debe establecer headers CORS', () => {
      const middleware = customCORS({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
      });

      const req = { method: 'GET' };
      const res = {
        header: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST');
      expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
      expect(next).toHaveBeenCalled();
    });

    it('debe responder OPTIONS con 200', () => {
      const middleware = customCORS();
      const req = { method: 'OPTIONS' };
      const res = {
        header: jest.fn(),
        sendStatus: jest.fn()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

