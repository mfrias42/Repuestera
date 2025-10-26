const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { 
  generateUserToken, 
  generateAdminToken, 
  verifyToken, 
  verifyUser, 
  verifyAdmin 
} = require('../middleware/auth');

const router = express.Router();

// Validaciones comunes
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono')
    .optional({ checkFalsy: true })
    .isMobilePhone('es-AR')
    .withMessage('Debe proporcionar un número de teléfono válido'),
  body('direccion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La dirección no puede exceder 500 caracteres')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      message: 'Por favor, verifique los datos enviados',
      details: errors.array()
    });
  }
  next();
};

// POST /api/auth/register - Registro de usuarios
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;

    // Crear usuario
    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion
    });

    // Generar token
    const token = generateUserToken(user);

    console.log('✅ Registro completado exitosamente');
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: user.toJSON(),
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro'
    });
  }
});

// POST /api/auth/login - Login de usuarios
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = generateUserToken(user);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: user.toJSON(),
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// POST /api/auth/admin/login - Login de administradores (VERSIÓN CORREGIDA)
router.post('/admin/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Intento de login admin: ${email}`);

    // Conectar directamente a la base de datos (mismo método que funciona en debug)
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'manufrias.mysql.database.azure.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'A',
      password: process.env.DB_PASSWORD || '4286Pka1#',
      database: process.env.DB_NAME || 'repuestera_db',
      ssl: { rejectUnauthorized: false }
    });

    // Buscar administrador
    console.log('📋 Buscando administrador en la base de datos...');
    const [admins] = await connection.execute(
      'SELECT * FROM administradores WHERE email = ? AND activo = 1',
      [email]
    );

    await connection.end();
    
    if (admins.length === 0) {
      console.log(`❌ Admin no encontrado: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const admin = admins[0];
    console.log(`✅ Admin encontrado: ${admin.email}, ID: ${admin.id}, Activo: ${admin.activo}`);

    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log(`🔑 Resultado verificación contraseña: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Crear objeto admin para el token
    const adminObj = {
      id: admin.id,
      nombre: admin.nombre,
      apellido: admin.apellido,
      email: admin.email,
      rol: admin.rol || 'admin',
      activo: admin.activo
    };

    // Generar token
    console.log('🎫 Generando token...');
    const token = generateAdminToken(adminObj);
    console.log('✅ Token generado exitosamente');

    console.log(`✅ Login admin exitoso: ${email}`);
    res.json({
      message: 'Inicio de sesión administrativo exitoso',
      admin: adminObj,
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('❌ Error en login admin:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// POST /api/auth/logout - Logout (para ambos tipos de usuario)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Aquí podrías invalidar el token en la base de datos si tienes una tabla de sesiones
    // Por ahora, simplemente confirmamos el logout
    res.json({
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cerrar la sesión'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { id, type } = req.user;
    
    if (type === 'admin') {
      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          error: 'Administrador no encontrado',
          message: 'El administrador no existe'
        });
      }
      res.json({
        user: admin.toJSON(),
        type: 'admin'
      });
    } else {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario no existe'
        });
      }
      res.json({
        user: user.toJSON(),
        type: 'user'
      });
    }
  } catch (error) {
    console.error('❌ Error obteniendo información del usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información del usuario'
    });
  }
});

module.exports = router;
