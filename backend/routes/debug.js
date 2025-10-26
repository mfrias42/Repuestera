const express = require('express');
const router = express.Router();

// GET /api/debug/test - Endpoint de prueba simple
router.get('/test', (req, res) => {
  res.json({
    message: 'Debug endpoint funcionando',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// POST /api/debug/admin-test - Probar login de admin sin validaciones complejas
router.post('/admin-test', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Debug admin test:', { email, password: password ? '***' : 'undefined' });
    
    // Conectar directamente a la base de datos
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
    const [admins] = await connection.execute(
      'SELECT * FROM administradores WHERE email = ? AND activo = 1',
      [email]
    );

    await connection.end();

    if (admins.length === 0) {
      return res.json({
        success: false,
        message: 'Administrador no encontrado',
        email: email
      });
    }

    const admin = admins[0];
    
    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.json({
        success: false,
        message: 'Contraseña incorrecta',
        email: email
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug admin test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
