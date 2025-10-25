const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initProdDatabase() {
  let connection;
  
  try {
    // Configuración para Producción en Azure MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'repuestera-server-mfrias.mysql.database.azure.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'prod_admin',
      password: process.env.DB_PASSWORD || 'Prod_SecurePass2024!',
      database: process.env.DB_NAME || 'repuestera_prod_db',
    ssl: {
      rejectUnauthorized: false
    },
    connectTimeout: 60000
    });

    console.log('🔗 Conectado a Azure MySQL Database Producción');

    // Verificar si ya existe el administrador
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

    // Verificar categorías
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
          'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
          [nombre, descripcion]
        );
      }
      console.log('📂 Categorías insertadas en Producción');
    }

    // Verificar productos de ejemplo
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
          INSERT INTO productos 
          (nombre, descripcion, precio, stock, imagen, categoria_id, codigo_producto, marca, modelo, año_desde, año_hasta) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, producto);
      }
      console.log('🔧 Productos de ejemplo insertados en Producción');
    }

    console.log('✅ Base de datos Producción inicializada correctamente');
    console.log('📋 Credenciales de administrador:');
    console.log('   - Email: admin@repuestera.com');
    console.log('   - Password: admin123');
    console.log('📦 Productos de ejemplo disponibles para pruebas');

  } catch (error) {
    console.error('❌ Error inicializando base de datos Producción:', error);
    process.exit(1);
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