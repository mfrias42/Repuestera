#!/usr/bin/env node

/**
 * Script para verificar que todas las tablas existan en QA
 * y crear las que falten
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'manufrias.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: process.env.DB_PASSWORD || '4286Pka1#',
  database: 'repuestera_db',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000
};

async function verifyQATables() {
  let connection = null;
  
  try {
    console.log('🔍 ============================================');
    console.log('🔍 Verificando Tablas en QA');
    console.log('🔍 ============================================');
    console.log('');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos de QA');
    console.log('');
    
    // Verificar qué tablas existen
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'repuestera_db' 
      AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = tables.map(t => t.table_name);
    console.log(`📊 Tablas existentes: ${existingTables.length}`);
    existingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('');
    
    const requiredTables = ['usuarios', 'administradores', 'categorias', 'productos'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`⚠️  Tablas faltantes: ${missingTables.join(', ')}`);
      console.log('🔧 Creando tablas faltantes...');
      console.log('');
      
      // Crear tabla usuarios si no existe
      if (missingTables.includes('usuarios')) {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            direccion TEXT,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            activo BOOLEAN DEFAULT TRUE,
            INDEX idx_email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla usuarios creada');
      }
      
      // Crear tabla administradores si no existe
      if (missingTables.includes('administradores')) {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS administradores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            rol ENUM('admin', 'super_admin') DEFAULT 'admin',
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultimo_acceso TIMESTAMP NULL,
            activo BOOLEAN DEFAULT TRUE,
            INDEX idx_email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla administradores creada');
      }
      
      // Crear tabla categorias si no existe
      if (missingTables.includes('categorias')) {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS categorias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) UNIQUE NOT NULL,
            descripcion TEXT,
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla categorias creada');
      }
      
      // Crear tabla productos si no existe
      if (missingTables.includes('productos')) {
        await connection.execute(`
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
            año_desde INT,
            año_hasta INT,
            imagen VARCHAR(500),
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
            INDEX idx_categoria (categoria_id),
            INDEX idx_activo (activo),
            INDEX idx_codigo (codigo_producto)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla productos creada');
      }
      
      console.log('');
    } else {
      console.log('✅ Todas las tablas requeridas existen');
      console.log('');
    }
    
    // Verificar datos en cada tabla
    console.log('📊 Verificando datos en las tablas:');
    console.log('');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM usuarios WHERE activo = TRUE');
    console.log(`   Usuarios activos: ${userCount[0].count}`);
    
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM administradores WHERE activo = TRUE');
    console.log(`   Administradores activos: ${adminCount[0].count}`);
    
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categorias WHERE activo = TRUE');
    console.log(`   Categorías activas: ${categoryCount[0].count}`);
    
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM productos WHERE activo = TRUE');
    console.log(`   Productos activos: ${productCount[0].count}`);
    console.log('');
    
    // Verificar administradores y sus roles
    const [admins] = await connection.execute('SELECT email, rol FROM administradores WHERE activo = TRUE');
    console.log('👨‍💼 Administradores:');
    admins.forEach(admin => {
      console.log(`   - ${admin.email}: ${admin.rol || 'NULL'}`);
    });
    console.log('');
    
    console.log('🎉 ============================================');
    console.log('🎉 Verificación Completada');
    console.log('🎉 ============================================');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al verificar tablas');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('✅ Conexión cerrada correctamente');
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  verifyQATables()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { verifyQATables };

