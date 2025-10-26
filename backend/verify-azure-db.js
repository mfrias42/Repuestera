const mysql = require('mysql2/promise');

async function verifyAzureDatabase() {
  let connection;
  
  try {
    console.log('🔍 Verificando base de datos en Azure...');
    
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

    // Verificar estructura de la tabla administradores
    console.log('\n🔍 Estructura de tabla administradores:');
    const [columns] = await connection.execute('DESCRIBE administradores');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Verificar si existe la columna rol
    const hasRolColumn = columns.some(col => col.Field === 'rol');
    console.log(`\n📋 ¿Existe columna 'rol'? ${hasRolColumn ? '✅ SÍ' : '❌ NO'}`);

    // Verificar administradores existentes
    console.log('\n👨‍💼 Administradores existentes:');
    const [admins] = await connection.execute('SELECT id, nombre, apellido, email, rol, activo FROM administradores');
    console.log(admins);

    if (admins.length === 0) {
      console.log('\n❌ No hay administradores en la base de datos');
    } else {
      // Verificar si algún admin tiene rol null
      const adminsWithoutRol = admins.filter(admin => !admin.rol);
      if (adminsWithoutRol.length > 0) {
        console.log('\n⚠️  Administradores sin rol:', adminsWithoutRol);
      } else {
        console.log('\n✅ Todos los administradores tienen rol asignado');
      }
    }

    // Si no existe la columna rol, crearla
    if (!hasRolColumn) {
      console.log('\n🔧 Agregando columna rol...');
      await connection.execute(`
        ALTER TABLE administradores 
        ADD COLUMN rol ENUM('admin', 'super_admin') DEFAULT 'admin' AFTER password
      `);
      console.log('✅ Columna rol agregada');
      
      // Actualizar administradores existentes
      await connection.execute(`
        UPDATE administradores SET rol = 'admin' WHERE rol IS NULL
      `);
      console.log('✅ Roles actualizados para administradores existentes');
    }

    // Verificar si existe el administrador por defecto
    const [defaultAdmin] = await connection.execute(
      'SELECT * FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (defaultAdmin.length === 0) {
      console.log('\n🔧 Creando administrador por defecto...');
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'admin')
      `, [adminPassword]);
      console.log('✅ Administrador por defecto creado');
    } else {
      console.log('\n✅ Administrador por defecto ya existe');
    }

    // Probar login final
    console.log('\n🔐 Probando login...');
    const [loginTest] = await connection.execute(
      'SELECT id, nombre, apellido, email, rol FROM administradores WHERE email = ? AND activo = 1',
      ['admin@repuestera.com']
    );

    if (loginTest.length > 0) {
      const admin = loginTest[0];
      console.log('✅ Administrador encontrado:', {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol
      });
    } else {
      console.log('❌ No se encontró administrador activo');
    }

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyAzureDatabase();
