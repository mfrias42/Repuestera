const sql = require('mssql');
require('dotenv').config();

// Configuración de Azure SQL Database
const config = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'repuestera_db',
  user: process.env.DB_USER || 'repuestera_admin',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true, // Usar encriptación para Azure SQL
    trustServerCertificate: false, // Verificar certificados SSL
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  }
};

console.log('🔗 Configuración Azure SQL:');
console.log('  Server:', config.server);
console.log('  Database:', config.database);
console.log('  User:', config.user);
console.log('  Port:', config.port);

// Pool de conexiones
let pool;

// Función para obtener conexión
async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Conexión a Azure SQL Database establecida');
    }
    return pool;
  } catch (err) {
    console.error('❌ Error conectando a Azure SQL:', err.message);
    throw err;
  }
}

// Función para probar la conexión
async function testConnection() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✅ Conexión a Azure SQL verificada correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error verificando conexión a Azure SQL:', err.message);
    return false;
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros si existen
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    // Reemplazar placeholders ? por @param0, @param1, etc.
    let sqlQuery = query;
    params.forEach((_, index) => {
      sqlQuery = sqlQuery.replace('?', `@param${index}`);
    });
    
    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (err) {
    console.error('❌ Error ejecutando query:', err.message);
    throw err;
  }
}

// Función para transacciones
async function executeTransaction(queries) {
  const pool = await getConnection();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    const results = [];
    for (const { query, params } of queries) {
      const request = transaction.request();
      
      // Agregar parámetros
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      // Reemplazar placeholders
      let sqlQuery = query;
      params.forEach((_, index) => {
        sqlQuery = sqlQuery.replace('?', `@param${index}`);
      });
      
      const result = await request.query(sqlQuery);
      results.push(result);
    }
    
    await transaction.commit();
    return results;
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Error en transacción:', err.message);
    throw err;
  }
}

// Inicializar tablas
async function initializeTables() {
  try {
    console.log('🔧 Inicializando tablas Azure SQL...');
    
    // Verificar conexión
    await testConnection();
    console.log('✅ Conexión verificada antes de crear tablas');
    
    // Crear tabla de usuarios
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
      CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        apellido NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        telefono NVARCHAR(20),
        direccion NVARCHAR(MAX),
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        activo BIT DEFAULT 1
      )
    `);

    // Crear tabla de administradores
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='administradores' AND xtype='U')
      CREATE TABLE administradores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        apellido NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        activo BIT DEFAULT 1
      )
    `);

    // Crear tabla de categorías
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categorias' AND xtype='U')
      CREATE TABLE categorias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) UNIQUE NOT NULL,
        descripcion NVARCHAR(MAX),
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Crear tabla de productos
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='productos' AND xtype='U')
      CREATE TABLE productos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(200) NOT NULL,
        descripcion NVARCHAR(MAX),
        precio DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        categoria_id INT,
        codigo_producto NVARCHAR(50) UNIQUE,
        marca NVARCHAR(100),
        modelo NVARCHAR(100),
        año_vehiculo NVARCHAR(20),
        imagen_url NVARCHAR(500),
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);

    console.log('✅ Tablas Azure SQL inicializadas correctamente');
    
    // Insertar datos de ejemplo
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error inicializando tablas Azure SQL:', error);
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

    console.log('✅ Datos de ejemplo insertados en Azure SQL');
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
    throw error;
  }
}

// Cerrar conexión
async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      console.log('✅ Conexión a Azure SQL cerrada');
    }
  } catch (err) {
    console.error('❌ Error cerrando conexión:', err.message);
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
