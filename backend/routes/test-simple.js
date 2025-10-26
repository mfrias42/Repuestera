const express = require('express');
const router = express.Router();

// GET /api/test - Endpoint de prueba simple
router.get('/', (req, res) => {
  res.json({
    message: 'Test endpoint funcionando',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// POST /api/test/register - Probar registro simple
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    
    console.log('🔍 Test registro:', { nombre, apellido, email });
    
    // Conectar a la base de datos
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'manufrias.mysql.database.azure.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'A',
      password: process.env.DB_PASSWORD || '4286Pka1#',
      database: process.env.DB_NAME || 'repuestera_db',
      ssl: { rejectUnauthorized: false }
    });

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.end();
      return res.json({
        success: false,
        message: 'Usuario ya existe',
        email: email
      });
    }

    // Hashear password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nombre, apellido, email, password) VALUES (?, ?, ?, ?)',
      [nombre, apellido, email, hashedPassword]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });
    
  } catch (error) {
    console.error('❌ Error en test registro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/test/login - Probar login simple
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Test login:', { email });
    
    // Conectar a la base de datos
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'manufrias.mysql.database.azure.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'A',
      password: process.env.DB_PASSWORD || '4286Pka1#',
      database: process.env.DB_NAME || 'repuestera_db',
      ssl: { rejectUnauthorized: false }
    });

    // Buscar usuario
    const [users] = await connection.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    await connection.end();

    if (users.length === 0) {
      return res.json({
        success: false,
        message: 'Usuario no encontrado',
        email: email
      });
    }

    const user = users[0];

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.json({
        success: false,
        message: 'Contraseña incorrecta',
        email: email
      });
    }

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('❌ Error en test login:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
