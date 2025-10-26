const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  let connection;
  
  try {
    console.log('🔍 Probando login de administrador...');
    
    // Configuración de conexión (usar las mismas variables que en Azure)
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

    // Verificar si existe la tabla administradores
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📋 Tablas existentes:', tableNames);
    
    if (!tableNames.includes('administradores')) {
      console.log('❌ Tabla administradores NO existe');
      return;
    }

    // Verificar estructura de la tabla administradores
    const [columns] = await connection.execute('DESCRIBE administradores');
    console.log('🔍 Estructura de tabla administradores:', columns);

    // Buscar administradores existentes
    const [admins] = await connection.execute('SELECT id, nombre, apellido, email, rol FROM administradores');
    console.log('👨‍💼 Administradores existentes:', admins);

    if (admins.length === 0) {
      console.log('🔧 Creando administrador por defecto...');
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Admin', 'Sistema', 'admin@repuestera.com', ?, 'admin')
      `, [adminPassword]);
      console.log('✅ Administrador creado');
    }

    // Probar login
    const [adminResult] = await connection.execute(
      'SELECT * FROM administradores WHERE email = ? AND activo = 1',
      ['admin@repuestera.com']
    );

    if (adminResult.length === 0) {
      console.log('❌ No se encontró administrador con email admin@repuestera.com');
      return;
    }

    const admin = adminResult[0];
    console.log('👨‍💼 Administrador encontrado:', {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol,
      activo: admin.activo
    });

    // Verificar password
    const isValidPassword = await bcrypt.compare('admin123', admin.password);
    console.log('🔐 Password válido:', isValidPassword);

    if (isValidPassword) {
      console.log('✅ Login exitoso - Credenciales correctas');
    } else {
      console.log('❌ Password incorrecto');
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAdminLogin();
