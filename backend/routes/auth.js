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

module.exports = router;
