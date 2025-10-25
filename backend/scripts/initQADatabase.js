const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initQADatabase() {
  let connection;
  
  try {
    // Configuración para QA en Azure
    connection = await mysql.createConnection({
      host: 'repuestera-mfrias-qa-server.database.windows.net',
      port: 1433,
      user: 'repuestera_admin',
      password: 'Repuestera2024!',
      database: 'repuestera_qa_db',
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('🔗 Conectado a Azure SQL Database QA');

    // Verificar si ya existe el administrador
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (existingAdmin.length > 0) {
      console.log('👨‍💼 Administrador ya existe en QA');
    } else {
      // Crear administrador por defecto
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'super_admin')
      `, [adminPassword]);
      console.log('👨‍💼 Administrador creado en QA (email: admin@repuestera.com, password: admin123)');
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
      console.log('📂 Categorías insertadas en QA');
    }

    console.log('✅ Base de datos QA inicializada correctamente');
    console.log('📋 Credenciales de administrador:');
    console.log('   - Email: admin@repuestera.com');
    console.log('   - Password: admin123');

  } catch (error) {
    console.error('❌ Error inicializando base de datos QA:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initQADatabase();
}

module.exports = { initQADatabase };