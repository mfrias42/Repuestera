const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Cargar dotenv solo si existe el archivo (no en producción)
try {
  require('dotenv').config();
} catch (e) {
  // En producción, las variables vienen de App Service settings
  console.log('📝 Usando variables de entorno del sistema (Azure App Service)');
}

async function initProdDatabase() {
  let connection;
  
  try {
    // Obtener configuración de variables de entorno (prioridad: env vars > defaults)
    const dbConfig = {
      host: process.env.DB_HOST || 'manufrias-prod.mysql.database.azure.com',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'A',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'repuestera_db',
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 60000
    };

    console.log('🔗 Intentando conectar a Azure MySQL Database Producción...');
    console.log(`📊 Host: ${dbConfig.host}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`📊 User: ${dbConfig.user}`);
    console.log(`📊 Port: ${dbConfig.port}`);
    console.log(`📊 Password: ${dbConfig.password ? '***DEFINIDO***' : 'NO DEFINIDO'}`);

    // Verificar que tenemos las credenciales necesarias
    if (!dbConfig.password) {
      throw new Error('DB_PASSWORD no está definida. Verifique las variables de entorno del App Service.');
    }

    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Conectado a Azure MySQL Database Producción');

    // Crear tablas si no existen
    console.log('🔧 Verificando y creando tablas...');

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
    console.log('✅ Tabla usuarios verificada/creada');

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
    console.log('✅ Tabla administradores verificada/creada');

    // Crear tabla de categorías
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla categorias verificada/creada');

    // Crear tabla de productos
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
    console.log('✅ Tabla productos verificada/creada');

    // Inicializar datos
    console.log('📊 Inicializando datos...');

    // Verificar y crear administrador por defecto
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (existingAdmin.length > 0) {
      console.log('👨‍💼 Administrador ya existe en Producción');
    } else {
      // Crear administrador por defecto
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'super_admin')
      `, [adminPassword]);
      console.log('👨‍💼 Administrador creado en Producción (email: admin@repuestera.com, password: admin123)');
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
      console.log('📂 Categorías insertadas en Producción');
    } else {
      console.log(`📂 Ya existen ${categorias[0].count} categorías en Producción`);
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
      console.log('🔧 Productos de ejemplo insertados en Producción');
    } else {
      console.log(`🔧 Ya existen ${productos[0].count} productos en Producción`);
    }

    console.log('✅ Base de datos Producción inicializada correctamente');
    console.log('📋 Credenciales de administrador:');
    console.log('   - Email: admin@repuestera.com');
    console.log('   - Password: admin123');
    console.log('📦 Productos de ejemplo disponibles para pruebas');

  } catch (error) {
    console.error('❌ Error inicializando base de datos Producción:', error);
    console.error('❌ Detalles del error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Si se ejecuta desde el servidor, no hacer exit(1) para no detener el servidor
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error; // Re-lanzar para que el llamador maneje el error
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initProdDatabase();
}

module.exports = { initProdDatabase };