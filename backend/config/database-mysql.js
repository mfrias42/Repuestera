const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de Azure Database for MySQL Flexible Server
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'repuestera_admin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'repuestera_db',
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('mysql.database.azure.com') ? {
    rejectUnauthorized: false // Para Azure MySQL Flexible Server (igual que QA)
  } : false, // No usar SSL para conexiones locales
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log('🔗 Configuración Azure MySQL Flexible Server:');
console.log('  Host:', config.host);
console.log('  Database:', config.database);
console.log('  User:', config.user);
console.log('  Port:', config.port);
console.log('  SSL:', config.ssl ? 'enabled (Azure)' : 'disabled');
console.log('  Password:', config.password ? '***DEFINIDO***' : 'NO DEFINIDO');

// Pool de conexiones
let pool;

// Función para obtener conexión
async function getConnection() {
  try {
    if (!pool) {
      pool = mysql.createPool(config);
      console.log('✅ Pool de conexiones MySQL creado');
    }
    return pool;
  } catch (err) {
    console.error('❌ Error creando pool de conexiones MySQL:', err.message);
    throw err;
  }
}

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('🔍 Intentando conectar a MySQL...');
    console.log('🔍 Variables de entorno:', {
      DB_HOST: process.env.DB_HOST || 'NO DEFINIDO',
      DB_USER: process.env.DB_USER || 'NO DEFINIDO',
      DB_NAME: process.env.DB_NAME || 'NO DEFINIDO',
      DB_PORT: process.env.DB_PORT || 'NO DEFINIDO',
      DB_PASSWORD: process.env.DB_PASSWORD ? '***DEFINIDO***' : 'NO DEFINIDO',
      DB_TYPE: process.env.DB_TYPE || 'NO DEFINIDO',
      NODE_ENV: process.env.NODE_ENV || 'NO DEFINIDO'
    });
    
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT 1 as test, DATABASE() as current_db, USER() as current_user');
    console.log('✅ Conexión a MySQL Flexible Server verificada correctamente');
    console.log('✅ Base de datos actual:', rows[0].current_db);
    console.log('✅ Usuario actual:', rows[0].current_user);
    return true;
  } catch (err) {
    console.error('❌ Error detallado verificando conexión a MySQL:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      stack: err.stack
    });
    return false;
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (err) {
    console.error('❌ Error ejecutando query MySQL:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params: params.length > 0 ? '[' + params.length + ' params]' : 'no params'
    });
    
    // Si es un error de conexión, intentar reconectar
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔄 Intentando reconectar a la base de datos...');
      pool = null; // Resetear el pool para forzar reconexión
    }
    
    throw err;
  }
}

// Función para transacciones
async function executeTransaction(queries) {
  const connection = await getConnection();
  const conn = await connection.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await conn.execute(query, params);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en transacción MySQL:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

// Inicializar tablas
async function initializeTables() {
  try {
    console.log('🔧 Inicializando tablas MySQL Flexible Server...');
    
    // Verificar conexión
    await testConnection();
    console.log('✅ Conexión verificada antes de crear tablas');
    
    // Crear tabla de usuarios
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        direccion TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de administradores
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de categorías
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla de productos
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        categoria_id INT,
        codigo_producto VARCHAR(50) UNIQUE,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        año_vehiculo VARCHAR(20),
        imagen_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear índices para mejor rendimiento (MySQL no soporta IF NOT EXISTS para índices)
    try {
      await executeQuery(`CREATE INDEX idx_productos_categoria ON productos(categoria_id)`);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }
    
    try {
      await executeQuery(`CREATE INDEX idx_productos_activo ON productos(activo)`);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }
    
    try {
      await executeQuery(`CREATE INDEX idx_usuarios_email ON usuarios(email)`);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }

    console.log('✅ Tablas MySQL Flexible Server inicializadas correctamente');
    
    // Insertar datos de ejemplo
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error inicializando tablas MySQL:', error);
    throw error;
  }
}

// Insertar datos de ejemplo
async function insertSampleData() {
  try {
    // Verificar si ya hay datos
    const existingProducts = await executeQuery('SELECT COUNT(*) as count FROM productos');
    if (existingProducts[0].count > 0) {
      console.log('📊 Datos de ejemplo ya existen');
      return;
    }

    // Insertar categorías
    await executeQuery(`
      INSERT INTO categorias (nombre, descripcion) VALUES 
      ('Motor', 'Repuestos para motor'),
      ('Frenos', 'Sistema de frenos'),
      ('Suspensión', 'Sistema de suspensión'),
      ('Eléctrico', 'Sistema eléctrico')
    `);

    // Insertar productos de ejemplo
    await executeQuery(`
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, codigo_producto, marca) VALUES 
      ('Filtro de Aceite', 'Filtro de aceite para motor', 25.99, 50, 1, 'FO001', 'Bosch'),
      ('Pastillas de Freno', 'Pastillas de freno delanteras', 89.99, 30, 2, 'PF001', 'Brembo'),
      ('Amortiguador', 'Amortiguador trasero', 159.99, 20, 3, 'AM001', 'Monroe'),
      ('Batería', 'Batería 12V 60Ah', 199.99, 15, 4, 'BAT001', 'Varta')
    `);

    console.log('✅ Datos de ejemplo insertados en MySQL Flexible Server');
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
    throw error;
  }
}

// Cerrar conexión
async function closeConnection() {
  try {
    if (pool) {
      await pool.end();
      console.log('✅ Pool de conexiones MySQL cerrado');
    }
  } catch (err) {
    console.error('❌ Error cerrando pool de conexiones:', err.message);
  }
}

// Manejo de cierre de proceso
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  getConnection,
  testConnection,
  executeQuery,
  executeTransaction,
  initializeTables,
  closeConnection
};
