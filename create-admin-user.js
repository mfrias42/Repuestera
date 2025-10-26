const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuración de Azure Database for MySQL Flexible Server
const config = {
  host: 'manufrias.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: '4286Pka1#',
  database: 'repuestera_db',
  ssl: {
    rejectUnauthorized: false
  }
};

async function createAdminUser() {
  let connection;
  
  try {
    console.log('🔗 Conectando a MySQL Flexible Server...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa');

    // Verificar si el admin ya existe
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (existingAdmin.length > 0) {
      console.log('👨‍💼 Admin ya existe en la base de datos');
      return;
    }

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('🔐 Contraseña hasheada');

    // Insertar admin
    await connection.execute(`
      INSERT INTO administradores (nombre, apellido, email, password, rol) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin', 'Sistema', 'admin@repuestera.com', hashedPassword, 'super_admin']);

    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@repuestera.com');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
