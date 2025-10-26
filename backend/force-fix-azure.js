const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function forceFixAzure() {
  let connection;
  
  try {
    console.log('🔧 Forzando reparación en Azure...');
    
    const dbConfig = {
      host: 'manufrias.mysql.database.azure.com',
      port: 3306,
      user: 'A',
      password: '4286Pka1#',
      database: 'repuestera_db',
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL en Azure');

    // Verificar y agregar columna rol si no existe
    const [columns] = await connection.execute('DESCRIBE administradores');
    const hasRolColumn = columns.some(col => col.Field === 'rol');
    
    if (!hasRolColumn) {
      console.log('🔧 Agregando columna rol...');
      await connection.execute(`
        ALTER TABLE administradores 
        ADD COLUMN rol ENUM('admin', 'super_admin') DEFAULT 'admin' AFTER password
      `);
      console.log('✅ Columna rol agregada');
    } else {
      console.log('✅ Columna rol ya existe');
    }

    // Eliminar administradores existentes y crear uno nuevo
    console.log('🗑️  Limpiando administradores existentes...');
    await connection.execute('DELETE FROM administradores');
    console.log('✅ Administradores eliminados');

    // Crear administrador por defecto
    console.log('👨‍💼 Creando administrador por defecto...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await connection.execute(`
      INSERT INTO administradores (nombre, apellido, email, password, rol, activo) 
      VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'admin', 1)
    `, [adminPassword]);
    console.log('✅ Administrador por defecto creado');

    // Verificar que se creó correctamente
    const [admins] = await connection.execute('SELECT * FROM administradores');
    console.log('👨‍💼 Administradores en la base de datos:', admins);

    // Probar login
    const [loginTest] = await connection.execute(
      'SELECT id, nombre, apellido, email, rol, activo FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (loginTest.length > 0) {
      const admin = loginTest[0];
      console.log('✅ Login test exitoso:', {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
        activo: admin.activo
      });
    }

    console.log('✅ Reparación forzada completada');

  } catch (error) {
    console.error('❌ Error en reparación forzada:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

forceFixAzure();
