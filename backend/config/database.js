require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de MySQL para todos los entornos
console.log('🗄️ Usando MySQL para todos los entornos');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'repuestera_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'qa' ? {
    rejectUnauthorized: false
  } : false
};

console.log(`📊 Conectando a MySQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

// Función para transacciones
async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para probar la conexión
async function testConnection() {
  if (usesSQLite) {
    return await dbModule.testConnection();
  } else {
    try {
      const connection = await dbModule.pool.getConnection();
      console.log('✅ Conexión a MySQL establecida correctamente');
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ Error conectando a MySQL:', error.message);
      return false;
    }
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  if (usesSQLite) {
    return await dbModule.executeQuery(query, params);
  } else {
    try {
      const [results] = await dbModule.pool.execute(query, params);
      return results;
    } catch (error) {
      console.error('Error ejecutando query:', error);
      throw error;
    }
  }
}

// Función para transacciones
async function executeTransaction(queries) {
  if (usesSQLite) {
    return await dbModule.executeTransaction(queries);
  } else {
    const connection = await dbModule.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params } of queries) {
        const [result] = await connection.execute(query, params || []);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction
};