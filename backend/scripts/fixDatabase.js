const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixDatabase() {
  let connection;
  
  try {
    console.log('🔧 Iniciando reparación de base de datos...');
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

    // Verificar si las tablas existen
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📋 Tablas existentes:', tableNames);

    // Crear tabla administradores si no existe
    if (!tableNames.includes('administradores')) {
      console.log('🔧 Creando tabla administradores...');
      await connection.execute(`
        CREATE TABLE administradores (
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

    // Crear tabla usuarios si no existe
    if (!tableNames.includes('usuarios')) {
      console.log('🔧 Creando tabla usuarios...');
      await connection.execute(`
        CREATE TABLE usuarios (
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

    // Crear tabla categorias si no existe
    if (!tableNames.includes('categorias')) {
      console.log('🔧 Creando tabla categorias...');
      await connection.execute(`
        CREATE TABLE categorias (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL UNIQUE,
          descripcion TEXT,
          activo BOOLEAN DEFAULT TRUE,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabla categorias creada');
    }

    // Crear tabla productos si no existe
    if (!tableNames.includes('productos')) {
      console.log('🔧 Creando tabla productos...');
      await connection.execute(`
        CREATE TABLE productos (
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
      console.log('✅ Tabla productos creada');
    }

    // Crear tabla sesiones si no existe
    if (!tableNames.includes('sesiones')) {
      console.log('🔧 Creando tabla sesiones...');
      await connection.execute(`
        CREATE TABLE sesiones (
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
      console.log('✅ Tabla sesiones creada');
    }

    // Verificar si existe el administrador por defecto
    const [admins] = await connection.execute('SELECT COUNT(*) as count FROM administradores');
    if (admins[0].count === 0) {
      console.log('🔧 Creando administrador por defecto...');
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'admin')
      `, [adminPassword]);
      console.log('✅ Administrador por defecto creado (email: admin@repuestera.com, password: admin123)');
    } else {
      console.log('✅ Administrador ya existe');
    }

    // Verificar categorías por defecto
    const [categorias] = await connection.execute('SELECT COUNT(*) as count FROM categorias');
    if (categorias[0].count === 0) {
      console.log('🔧 Insertando categorías por defecto...');
      const categoriasDefault = [
        ['Motor', 'Repuestos para motor del vehículo'],
        ['Frenos', 'Sistema de frenos y componentes'],
        ['Suspensión', 'Amortiguadores y sistema de suspensión'],
        ['Transmisión', 'Caja de cambios y transmisión'],
        ['Eléctrico', 'Sistema eléctrico y electrónico'],
        ['Carrocería', 'Partes de carrocería y exterior'],
        ['Interior', 'Componentes del interior del vehículo'],
        ['Neumáticos', 'Neumáticos y llantas']
      ];

      for (const [nombre, descripcion] of categoriasDefault) {
        await connection.execute(
          'INSERT IGNORE INTO categorias (nombre, descripcion) VALUES (?, ?)',
          [nombre, descripcion]
        );
      }
      console.log('✅ Categorías por defecto insertadas');
    } else {
      console.log('✅ Categorías ya existen');
    }

    console.log('✅ Base de datos reparada correctamente');

  } catch (error) {
    console.error('❌ Error reparando base de datos:', error);
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
  fixDatabase();
}

module.exports = { fixDatabase };
