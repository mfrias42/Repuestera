const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Configuración de SQLite para Azure
const dbPath = path.join(__dirname, '..', 'data', 'repuestera.db');

// Crear directorio data si no existe
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Crear conexión SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
  } else {
    console.log('✅ Conexión a SQLite establecida correctamente');
  }
});

// Función para probar la conexión
async function testConnection() {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1", (err) => {
      if (err) {
        console.error('❌ Error conectando a SQLite:', err.message);
        resolve(false);
      } else {
        console.log('✅ Conexión a SQLite establecida correctamente');
        resolve(true);
      }
    });
  });
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    // Convertir query de MySQL a SQLite si es necesario
    let sqliteQuery = query
      .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
      .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g, '')
      .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
      .replace(/BOOLEAN/g, 'INTEGER')
      .replace(/TEXT,/g, 'TEXT,')
      .replace(/INDEX idx_\w+ \([^)]+\)/g, ''); // Remover índices inline

    if (query.toLowerCase().includes('select') || query.toLowerCase().includes('show')) {
      db.all(sqliteQuery, params, (err, rows) => {
        if (err) {
          console.error('Error ejecutando query:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } else {
      db.run(sqliteQuery, params, function(err) {
        if (err) {
          console.error('Error ejecutando query:', err);
          reject(err);
        } else {
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        }
      });
    }
  });
}

// Función para transacciones
async function executeTransaction(queries) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      let results = [];
      let hasError = false;
      
      const processQuery = (index) => {
        if (index >= queries.length) {
          if (hasError) {
            db.run("ROLLBACK");
            reject(new Error('Transaction failed'));
          } else {
            db.run("COMMIT");
            resolve(results);
          }
          return;
        }
        
        const { query, params } = queries[index];
        db.run(query, params, function(err) {
          if (err) {
            hasError = true;
            console.error('Error en transacción:', err);
            db.run("ROLLBACK");
            reject(err);
          } else {
            results.push({ insertId: this.lastID, affectedRows: this.changes });
            processQuery(index + 1);
          }
        });
      };
      
      processQuery(0);
    });
  });
}

// Inicializar tablas
async function initializeTables() {
  try {
    // Crear tabla de usuarios
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        direccion TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER DEFAULT 1
      )
    `);

    // Crear tabla de administradores
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER DEFAULT 1
      )
    `);

    // Crear tabla de categorías
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de productos
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        categoria_id INTEGER,
        codigo_producto VARCHAR(50) UNIQUE,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        año_vehiculo VARCHAR(20),
        imagen_url VARCHAR(500),
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);

    console.log('✅ Tablas SQLite inicializadas correctamente');
    
    // Insertar datos de ejemplo
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error inicializando tablas SQLite:', error);
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
    await executeQuery(`INSERT INTO categorias (nombre, descripcion) VALUES 
      ('Motor', 'Repuestos para motor'),
      ('Frenos', 'Sistema de frenos'),
      ('Suspensión', 'Sistema de suspensión'),
      ('Eléctrico', 'Sistema eléctrico')
    `);

    // Insertar productos de ejemplo
    await executeQuery(`INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, codigo_producto, marca) VALUES 
      ('Filtro de Aceite', 'Filtro de aceite para motor', 25.99, 50, 1, 'FO001', 'Bosch'),
      ('Pastillas de Freno', 'Pastillas de freno delanteras', 89.99, 30, 2, 'PF001', 'Brembo'),
      ('Amortiguador', 'Amortiguador trasero', 159.99, 20, 3, 'AM001', 'Monroe'),
      ('Batería', 'Batería 12V 60Ah', 199.99, 15, 4, 'BAT001', 'Varta')
    `);

    console.log('✅ Datos de ejemplo insertados');
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
  }
}

module.exports = {
  db,
  testConnection,
  executeQuery,
  executeTransaction,
  initializeTables
};