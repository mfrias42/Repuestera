const mysql = require('mysql2/promise');
// Configurar dotenv sin sobrescribir variables de entorno existentes
require('dotenv').config({ override: false });

// Configuración de Azure Database for MySQL Flexible Server
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'repuestera_db',
  ssl: {
    rejectUnauthorized: false // Para Azure MySQL Flexible Server
  },
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
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Conexión a MySQL Flexible Server verificada correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error verificando conexión a MySQL:', err.message);
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
    console.error('❌ Error ejecutando query MySQL:', err.message);
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
