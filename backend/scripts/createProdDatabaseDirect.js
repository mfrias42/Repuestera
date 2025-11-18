#!/usr/bin/env node

/**
 * Script para crear directamente la base de datos de producción
 * Se conecta directamente a manufrias-prod.mysql.database.azure.com
 * sin pasar por el pipeline
 * 
 * Uso:
 *   node scripts/createProdDatabaseDirect.js
 * 
 * O con variables de entorno:
 *   DB_PASSWORD=tu_password node scripts/createProdDatabaseDirect.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

// Configuración directa de producción
const DB_CONFIG = {
  host: 'manufrias-prod.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: process.env.DB_PASSWORD || '4286Pk1#',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000
};

const DB_NAME = 'repuestera_db';

async function createProdDatabaseDirect() {
  let connectionWithoutDB = null;
  let connection = null;
  
  try {
    console.log('🚀 ============================================');
    console.log('🚀 Creando Base de Datos de Producción');
    console.log('🚀 ============================================');
    console.log('');
    console.log('📊 Configuración:');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Port: ${DB_CONFIG.port}`);
    console.log(`   User: ${DB_CONFIG.user}`);
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Password: ${DB_CONFIG.password ? '***DEFINIDO***' : 'NO DEFINIDO'}`);
    console.log('');
    
    // PASO 1: Conectar sin especificar base de datos
    console.log('📡 Paso 1: Conectando al servidor MySQL...');
    connectionWithoutDB = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado al servidor MySQL');
    console.log('');
    
    // PASO 2: Crear base de datos si no existe
    console.log(`📡 Paso 2: Creando base de datos '${DB_NAME}'...`);
    await connectionWithoutDB.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Base de datos '${DB_NAME}' creada/verificada`);
    console.log('');
    
    // Cerrar conexión sin base de datos
    await connectionWithoutDB.end();
    connectionWithoutDB = null;
    
    // PASO 3: Conectar a la base de datos específica
    console.log(`📡 Paso 3: Conectando a la base de datos '${DB_NAME}'...`);
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      database: DB_NAME
    });
    console.log(`✅ Conectado a la base de datos '${DB_NAME}'`);
    
    // Verificar conexión
    const [testResult] = await connection.execute('SELECT DATABASE() as db, USER() as user');
    console.log(`   Base de datos actual: ${testResult[0].db}`);
    console.log(`   Usuario actual: ${testResult[0].user}`);
    console.log('');
    
    // PASO 4: Crear tablas
    console.log('📡 Paso 4: Creando tablas...');
    
    // Tabla usuarios
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
    console.log('✅ Tabla usuarios creada/verificada');
    
    // Tabla administradores
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
    console.log('✅ Tabla administradores creada/verificada');
    
    // Tabla categorías
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla categorias creada/verificada');
    
    // Tabla productos
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
    console.log('✅ Tabla productos creada/verificada');
    console.log('');
    
    // PASO 5: Insertar datos iniciales
    console.log('📡 Paso 5: Insertando datos iniciales...');
    
    // Verificar y crear administrador
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );
    
    if (existingAdmin.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'super_admin')
      `, [adminPassword]);
      console.log('✅ Administrador creado (admin@repuestera.com / admin123)');
    } else {
      console.log('ℹ️  Administrador ya existe');
    }
    
    // Verificar y crear categorías
    const [categorias] = await connection.execute('SELECT COUNT(*) as count FROM categorias');
    if (categorias[0].count === 0) {
      const categoriasData = [
        ['Motor', 'Repuestos para motor del vehículo'],
        ['Frenos', 'Sistema de frenos y componentes'],
        ['Suspensión', 'Amortiguadores y sistema de suspensión'],
        ['Transmisión', 'Caja de cambios y transmisión'],
        ['Eléctrico', 'Sistema eléctrico y electrónico'],
        ['Carrocería', 'Partes de carrocería y exterior'],
        ['Interior', 'Componentes del interior del vehículo'],
        ['Neumáticos', 'Neumáticos y llantas']
      ];
      
      for (const [nombre, descripcion] of categoriasData) {
        await connection.execute(
          'INSERT IGNORE INTO categorias (nombre, descripcion) VALUES (?, ?)',
          [nombre, descripcion]
        );
      }
      console.log(`✅ ${categoriasData.length} categorías insertadas`);
    } else {
      console.log(`ℹ️  Ya existen ${categorias[0].count} categorías`);
    }
    
    // Verificar y crear productos de ejemplo
    const [productos] = await connection.execute('SELECT COUNT(*) as count FROM productos');
    if (productos[0].count === 0) {
      const productosEjemplo = [
        ['Filtro de Aceite', 'Filtro de aceite universal para motores', 15.99, 50, null, 1, 'FO001', 'Mann', 'Universal', 2010, 2024],
        ['Pastillas de Freno Delanteras', 'Pastillas de freno cerámicas de alta calidad', 89.99, 25, null, 2, 'PF001', 'Brembo', 'Ceramic', 2015, 2024],
        ['Amortiguador Trasero', 'Amortiguador hidráulico para suspensión trasera', 125.50, 15, null, 3, 'AT001', 'Monroe', 'OESpectrum', 2012, 2023],
        ['Relay', 'Relay eléctrico universal 12V', 8.50, 100, null, 5, 'RE001', 'Bosch', '12V-40A', 2005, 2024],
        ['Lámpara H4', 'Lámpara halógena H4 12V 60/55W', 12.99, 75, null, 5, 'LH4001', 'Philips', 'H4', 2000, 2024],
        ['Lámpara H7', 'Lámpara halógena H7 12V 55W', 11.99, 80, null, 5, 'LH7001', 'Osram', 'H7', 2000, 2024]
      ];
      
      for (const producto of productosEjemplo) {
        await connection.execute(`
          INSERT IGNORE INTO productos 
          (nombre, descripcion, precio, stock, imagen, categoria_id, codigo_producto, marca, modelo, año_desde, año_hasta) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, producto);
      }
      console.log(`✅ ${productosEjemplo.length} productos de ejemplo insertados`);
    } else {
      console.log(`ℹ️  Ya existen ${productos[0].count} productos`);
    }
    console.log('');
    
    // PASO 6: Verificación final
    console.log('📡 Paso 6: Verificación final...');
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_type = 'BASE TABLE'
    `, [DB_NAME]);
    console.log(`✅ Total de tablas: ${tables[0].count}`);
    
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM administradores');
    const [categoriaCount] = await connection.execute('SELECT COUNT(*) as count FROM categorias');
    const [productoCount] = await connection.execute('SELECT COUNT(*) as count FROM productos');
    
    console.log(`✅ Administradores: ${adminCount[0].count}`);
    console.log(`✅ Categorías: ${categoriaCount[0].count}`);
    console.log(`✅ Productos: ${productoCount[0].count}`);
    console.log('');
    
    console.log('🎉 ============================================');
    console.log('🎉 Base de Datos de Producción Creada Exitosamente');
    console.log('🎉 ============================================');
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('   Email: admin@repuestera.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('✅ La base de datos está lista para usar');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ============================================');
    console.error('❌ ERROR al crear la base de datos');
    console.error('❌ ============================================');
    console.error('');
    console.error('Detalles del error:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Errno: ${error.errno || 'N/A'}`);
    console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
    console.error('');
    
    // Mensajes específicos según el tipo de error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🔍 Diagnóstico:');
      console.error('   - No se pudo conectar al servidor MySQL');
      console.error('   - Verifique que el servidor esté accesible');
      console.error('   - Verifique las reglas de firewall en Azure');
      console.error('   - Asegúrese de que "Allow Azure services" esté habilitado');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 1045) {
      console.error('🔍 Diagnóstico:');
      console.error('   - Error de autenticación');
      console.error('   - Verifique el usuario y contraseña');
      console.error('   - La contraseña puede haber cambiado');
      console.error('');
      console.error('💡 Solución:');
      console.error('   Puede pasar la contraseña como variable de entorno:');
      console.error('   DB_PASSWORD=tu_password node scripts/createProdDatabaseDirect.js');
    } else if (error.code === 'ER_BAD_DB_ERROR' || error.code === 1049) {
      console.error('🔍 Diagnóstico:');
      console.error('   - La base de datos no existe');
      console.error('   - El script debería haberla creado, pero falló');
    } else {
      console.error('🔍 Stack trace completo:');
      console.error(error.stack);
    }
    console.error('');
    
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (connectionWithoutDB) {
      try {
        await connectionWithoutDB.end();
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
    if (connection) {
      try {
        await connection.end();
        console.log('✅ Conexión cerrada correctamente');
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createProdDatabaseDirect()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { createProdDatabaseDirect };

