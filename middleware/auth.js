const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debe proporcionar un token válido en el header Authorization'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    if (!token) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        message: 'El token de acceso es requerido'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del token a la request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token de acceso ha expirado. Por favor, inicie sesión nuevamente.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    return res.status(500).json({
      error: 'Error de autenticación',
      message: 'Error interno del servidor al verificar el token'
    });
  }
};

// Middleware para verificar que el usuario existe y está activo
const verifyUser = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'user') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Se requiere autenticación de usuario'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe'
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        message: 'Su cuenta ha sido desactivada. Contacte al administrador.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Error de verificación',
      message: 'Error interno del servidor al verificar el usuario'
    });
  }
};

// Middleware para verificar que el administrador existe y está activo
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Se requiere autenticación de administrador'
      });
    }

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        error: 'Administrador no encontrado',
        message: 'El administrador asociado al token no existe'
      });
    }

    if (!admin.activo) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        message: 'Su cuenta de administrador ha sido desactivada'
      });
    }

    // Actualizar último acceso
    await admin.updateLastAccess();
    
    req.currentAdmin = admin;
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Error de verificación',
      message: 'Error interno del servidor al verificar el administrador'
    });
  }
};

// Middleware para verificar permisos específicos de administrador
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.currentAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Se requiere autenticación de administrador'
      });
    }

    if (!req.currentAdmin.canPerformAction(permission)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: `No tiene permisos para realizar la acción: ${permission}`
      });
    }

    next();
  };
};

// Middleware para verificar que es super administrador
const requireSuperAdmin = (req, res, next) => {
  if (!req.currentAdmin) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requiere autenticación de administrador'
    });
  }

  if (!req.currentAdmin.isSuperAdmin()) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de super administrador'
    });
  }

  next();
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;

    // Intentar cargar el usuario/admin
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (user && user.activo) {
        req.currentUser = user;
      }
    } else if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (admin && admin.activo) {
        req.currentAdmin = admin;
        await admin.updateLastAccess();
      }
    }

    next();
  } catch (error) {
    // En autenticación opcional, ignoramos errores de token
    next();
  }
};

// Función para generar token JWT
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Función para generar tokens de usuario
const generateUserToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'user'
  };
  
  return generateToken(payload);
};

// Función para generar tokens de administrador
const generateAdminToken = (admin) => {
  const payload = {
    id: admin.id,
    email: admin.email,
    type: 'admin',
    rol: admin.rol
  };
  
  return generateToken(payload);
};

module.exports = {
  verifyToken,
  verifyUser,
  verifyAdmin,
  requirePermission,
  requireSuperAdmin,
  optionalAuth,
  generateToken,
  generateUserToken,
  generateAdminToken
};