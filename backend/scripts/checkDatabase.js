const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  let connection;
  
  try {
    console.log('🔍 Verificando estado de la base de datos...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'repuestera_db',
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Conectado a MySQL');

    // Verificar tablas existentes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas existentes:', tables.map(t => Object.values(t)[0]));

    // Verificar estructura de tabla administradores
    if (tables.some(t => Object.values(t)[0] === 'administradores')) {
      console.log('\n🔍 Verificando tabla administradores...');
      const [columns] = await connection.execute('DESCRIBE administradores');
      console.log('Columnas de administradores:', columns);
      
      const [admins] = await connection.execute('SELECT id, nombre, apellido, email, rol FROM administradores');
      console.log('Administradores existentes:', admins);
    } else {
      console.log('❌ Tabla administradores NO existe');
    }

    // Verificar estructura de tabla usuarios
    if (tables.some(t => Object.values(t)[0] === 'usuarios')) {
      console.log('\n🔍 Verificando tabla usuarios...');
      const [columns] = await connection.execute('DESCRIBE usuarios');
      console.log('Columnas de usuarios:', columns);
    } else {
      console.log('❌ Tabla usuarios NO existe');
    }

    // Verificar estructura de tabla productos
    if (tables.some(t => Object.values(t)[0] === 'productos')) {
      console.log('\n🔍 Verificando tabla productos...');
      const [columns] = await connection.execute('DESCRIBE productos');
      console.log('Columnas de productos:', columns);
    } else {
      console.log('❌ Tabla productos NO existe');
    }

    // Verificar estructura de tabla categorias
    if (tables.some(t => Object.values(t)[0] === 'categorias')) {
      console.log('\n🔍 Verificando tabla categorias...');
      const [columns] = await connection.execute('DESCRIBE categorias');
      console.log('Columnas de categorias:', columns);
    } else {
      console.log('❌ Tabla categorias NO existe');
    }

    // Verificar estructura de tabla sesiones
    if (tables.some(t => Object.values(t)[0] === 'sesiones')) {
      console.log('\n🔍 Verificando tabla sesiones...');
      const [columns] = await connection.execute('DESCRIBE sesiones');
      console.log('Columnas de sesiones:', columns);
    } else {
      console.log('❌ Tabla sesiones NO existe');
    }

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };
