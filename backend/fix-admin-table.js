const mysql = require('mysql2/promise');

async function fixAdminTable() {
  let connection;
  
  try {
    console.log('🔧 Reparando tabla administradores...');
    
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
    console.log('✅ Conectado a MySQL');

    // Verificar si existe la columna rol
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

    // Verificar administradores existentes
    const [admins] = await connection.execute('SELECT id, nombre, apellido, email, rol FROM administradores');
    console.log('👨‍💼 Administradores existentes:', admins);

    if (admins.length === 0) {
      console.log('🔧 Creando administrador por defecto...');
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'admin')
      `, [adminPassword]);
      console.log('✅ Administrador creado');
    } else {
      // Actualizar rol de administradores existentes si no tienen rol
      for (const admin of admins) {
        if (!admin.rol) {
          console.log(`🔧 Actualizando rol para admin ${admin.email}...`);
          await connection.execute(
            'UPDATE administradores SET rol = ? WHERE id = ?',
            ['admin', admin.id]
          );
        }
      }
      console.log('✅ Roles actualizados');
    }

    console.log('✅ Tabla administradores reparada correctamente');

  } catch (error) {
    console.error('❌ Error reparando tabla:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdminTable();
