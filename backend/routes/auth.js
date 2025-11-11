const express = require('express');
const { body, validationResult } = require('express-validator');
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

// Función para conectar a la base de datos
async function getConnection() {
  const mysql = require('mysql2/promise');
  const config = {
    host: process.env.DB_HOST || 'manufrias.mysql.database.azure.com',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'A',
    database: process.env.DB_NAME || 'repuestera_db',
    ssl: { rejectUnauthorized: false }
  };
  
  // Solo agregar password si existe y no está vacío
  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
    config.password = process.env.DB_PASSWORD;
  } else if (!process.env.DB_HOST || process.env.DB_HOST === 'manufrias.mysql.database.azure.com') {
    // Usar password de Azure solo si estamos conectando a Azure
    config.password = '4286Pka1#';
  }
  
  return await mysql.createConnection(config);
}

// POST /api/auth/register - Registro de usuarios
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  let connection;
  try {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;

    connection = await getConnection();

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hashear password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, hashedPassword, telefono || null, direccion || null]
    );

    await connection.end();

    // Crear objeto usuario para el token
    const user = {
      id: result.insertId,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      activo: true
    };

    // Generar token
    const token = generateUserToken(user);

    console.log('✅ Registro completado exitosamente');
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: user,
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    if (connection) await connection.end();
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro'
    });
  }
});

// POST /api/auth/login - Login de usuarios
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    connection = await getConnection();

    // Buscar usuario
    const [users] = await connection.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Crear objeto usuario para el token
    const userObj = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      activo: user.activo
    };

    // Generar token
    const token = generateUserToken(userObj);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: userObj,
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    if (connection) await connection.end();
    console.error('❌ Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// POST /api/auth/admin/login - Login de administradores
router.post('/admin/login', loginValidation, handleValidationErrors, async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;
    console.log(`🔐 Intento de login admin: ${email}`);

    connection = await getConnection();

    // Buscar administrador
    const [admins] = await connection.execute(
      'SELECT * FROM administradores WHERE email = ? AND activo = 1',
      [email]
    );

    await connection.end();
    
    if (admins.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const admin = admins[0];

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
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
    const token = generateAdminToken(adminObj);

    res.json({
      message: 'Inicio de sesión administrativo exitoso',
      admin: adminObj,
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    if (connection) await connection.end();
    console.error('❌ Error en login admin:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
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
  let connection;
  try {
    const { id, type } = req.user;
    
    connection = await getConnection();
    
    if (type === 'admin') {
      const [admins] = await connection.execute(
        'SELECT id, nombre, apellido, email, rol, activo FROM administradores WHERE id = ?',
        [id]
      );
      
      await connection.end();
      
      if (admins.length === 0) {
        return res.status(404).json({
          error: 'Administrador no encontrado',
          message: 'El administrador no existe'
        });
      }
      
      res.json({
        user: admins[0],
        type: 'admin'
      });
    } else {
      const [users] = await connection.execute(
        'SELECT id, nombre, apellido, email, telefono, direccion, activo FROM usuarios WHERE id = ?',
        [id]
      );
      
      await connection.end();
      
      if (users.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario no existe'
        });
      }
      
      res.json({
        user: users[0],
        type: 'user'
      });
    }
  } catch (error) {
    if (connection) await connection.end();
    console.error('❌ Error obteniendo información del usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información del usuario'
    });
  }
});

module.exports = router;