const { validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Middleware para sanitizar entrada
const sanitizeInput = (req, res, next) => {
  // Función recursiva para limpiar objetos
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitizar body, query y params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Middleware para logging de requests
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log de request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log de response cuando termine
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Middleware para validar paginación
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Validar límites
  if (page < 1) {
    return res.status(400).json({
      error: 'Parámetro inválido',
      message: 'La página debe ser mayor a 0'
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: 'Parámetro inválido',
      message: 'El límite debe estar entre 1 y 100'
    });
  }

  // Agregar valores validados al request
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

// Middleware para validar IDs numéricos
const validateNumericId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        error: 'ID inválido',
        message: `El ${paramName} debe ser un número válido mayor a 0`
      });
    }

    req.params[paramName] = id;
    next();
  };
};

// Middleware para manejar errores async
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para validar JSON
const validateJSON = (req, res, next) => {
  if (req.is('application/json')) {
    try {
      // Si el body ya fue parseado por express.json(), continuar
      if (req.body !== undefined) {
        return next();
      }
    } catch (error) {
      return res.status(400).json({
        error: 'JSON inválido',
        message: 'El formato JSON enviado no es válido'
      });
    }
  }
  next();
};

// Middleware para validar Content-Type en uploads
const validateContentType = (allowedTypes = ['multipart/form-data', 'application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type requerido',
        message: 'Debe especificar el Content-Type'
      });
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      return res.status(400).json({
        error: 'Content-Type no soportado',
        message: `Content-Type debe ser uno de: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// Middleware para cache control
const setCacheControl = (maxAge = 3600) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

// Middleware para CORS personalizado (si se necesita más control)
const customCORS = (options = {}) => {
  const defaultOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  const corsOptions = { ...defaultOptions, ...options };

  return (req, res, next) => {
    res.header('Access-Control-Allow-Origin', corsOptions.origin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    
    if (corsOptions.credentials) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
};

module.exports = {
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
};