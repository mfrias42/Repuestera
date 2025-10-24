const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    // Conectar sin especificar base de datos para crearla
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('🔗 Conectado a MySQL');

    // Crear base de datos si no existe
    const dbName = process.env.DB_NAME || 'repuestera_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`📊 Base de datos '${dbName}' creada o ya existe`);

    // Usar la base de datos
    await connection.query(`USE ${dbName}`);

    // Crear tabla de usuarios
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
    console.log('👥 Tabla usuarios creada');

    // Crear tabla de administradores
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
    console.log('👨‍💼 Tabla administradores creada');

    // Crear tabla de categorías
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('📂 Tabla categorias creada');

    // Crear tabla de productos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        imagen VARCHAR(500),
        categoria_id INT,
        codigo_producto VARCHAR(50) UNIQUE,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        año_desde INT,
        año_hasta INT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
        INDEX idx_nombre (nombre),
        INDEX idx_codigo (codigo_producto),
        INDEX idx_categoria (categoria_id),
        INDEX idx_precio (precio),
        INDEX idx_stock (stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('🔧 Tabla productos creada');

    // Crear tabla de sesiones (para manejo de tokens)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        admin_id INT,
        token_hash VARCHAR(255) NOT NULL,
        tipo_usuario ENUM('usuario', 'admin') NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_expiracion TIMESTAMP NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
        INDEX idx_token (token_hash),
        INDEX idx_usuario (usuario_id),
        INDEX idx_admin (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('🔐 Tabla sesiones creada');

    // Insertar categorías por defecto
    const categorias = [
      ['Motor', 'Repuestos para motor del vehículo'],
      ['Frenos', 'Sistema de frenos y componentes'],
      ['Suspensión', 'Amortiguadores y sistema de suspensión'],
      ['Transmisión', 'Caja de cambios y transmisión'],
      ['Eléctrico', 'Sistema eléctrico y electrónico'],
      ['Carrocería', 'Partes de carrocería y exterior'],
      ['Interior', 'Componentes del interior del vehículo'],
      ['Neumáticos', 'Neumáticos y llantas']
    ];

    for (const [nombre, descripcion] of categorias) {
      await connection.execute(
        'INSERT IGNORE INTO categorias (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion]
      );
    }
    console.log('📂 Categorías por defecto insertadas');

    // Crear administrador por defecto
    const adminPassword = await bcrypt.hash('admin123', 12);
    await connection.execute(`
      INSERT IGNORE INTO administradores (nombre, apellido, email, password, rol) 
      VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'super_admin')
    `, [adminPassword]);
    console.log('👨‍💼 Administrador por defecto creado (email: admin@repuestera.com, password: admin123)');

    // Insertar algunos productos de ejemplo
    const productosEjemplo = [
      ['Filtro de Aceite', 'Filtro de aceite universal para motores', 15.99, 50, null, 1, 'FO001', 'Mann', 'Universal', 2010, 2024],
      ['Pastillas de Freno Delanteras', 'Pastillas de freno cerámicas de alta calidad', 89.99, 25, null, 2, 'PF001', 'Brembo', 'Ceramic', 2015, 2024],
      ['Amortiguador Trasero', 'Amortiguador hidráulico para suspensión trasera', 125.50, 15, null, 3, 'AT001', 'Monroe', 'OESpectrum', 2012, 2023]
    ];

    for (const producto of productosEjemplo) {
      await connection.execute(`
        INSERT IGNORE INTO productos 
        (nombre, descripcion, precio, stock, imagen, categoria_id, codigo_producto, marca, modelo, año_desde, año_hasta) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, producto);
    }
    console.log('🔧 Productos de ejemplo insertados');

    console.log('✅ Base de datos inicializada correctamente');
    console.log('📋 Resumen:');
    console.log('   - Base de datos: ' + dbName);
    console.log('   - Tablas creadas: usuarios, administradores, categorias, productos, sesiones');
    console.log('   - Admin por defecto: admin@repuestera.com / admin123');
    console.log('   - Categorías y productos de ejemplo agregados');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };