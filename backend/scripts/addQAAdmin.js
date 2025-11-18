#!/usr/bin/env node

/**
 * Script para agregar un nuevo administrador con rol super_admin en QA
 * 
 * Uso:
 *   node scripts/addQAAdmin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuración de QA
const DB_CONFIG = {
  host: 'manufrias.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: process.env.DB_PASSWORD || '4286Pka1#',
  database: 'repuestera_db',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000
};

async function addQAAdmin() {
  let connection = null;
  
  try {
    console.log('🚀 ============================================');
    console.log('🚀 Agregando Administrador en QA');
    console.log('🚀 ============================================');
    console.log('');
    
    // Conectar a la base de datos de QA
    console.log('📡 Conectando a QA (manufrias.mysql.database.azure.com)...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos de QA');
    console.log('');
    
    // Verificar conexión
    const [dbInfo] = await connection.execute('SELECT DATABASE() as db, @@hostname as hostname');
    console.log(`   Base de datos: ${dbInfo[0].db}`);
    console.log(`   Hostname del servidor: ${dbInfo[0].hostname}`);
    console.log('');
    
    // Crear nuevo administrador para QA
    console.log('👨‍💼 Creando nuevo administrador para QA...');
    const adminEmail = 'admin.qa@repuestera.com';
    const adminPassword = 'AdminQA2024!';
    const adminNombre = 'Administrador';
    const adminApellido = 'QA';
    const adminRol = 'super_admin';
    
    // Verificar si ya existe
    const [existingAdmin] = await connection.execute(
      'SELECT id, email, rol FROM administradores WHERE email = ?',
      [adminEmail]
    );
    
    if (existingAdmin.length > 0) {
      console.log('ℹ️  El administrador ya existe');
      console.log(`   Email: ${existingAdmin[0].email}`);
      console.log(`   Rol actual: ${existingAdmin[0].rol || 'NULL'}`);
      
      // Actualizar rol a super_admin si no lo es
      if (existingAdmin[0].rol !== 'super_admin') {
        await connection.execute(
          'UPDATE administradores SET rol = ? WHERE id = ?',
          ['super_admin', existingAdmin[0].id]
        );
        console.log('   ✅ Rol actualizado a super_admin');
      } else {
        console.log('   ✅ Rol ya es super_admin');
      }
      
      // Actualizar password por si acaso
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await connection.execute(
        'UPDATE administradores SET password = ? WHERE id = ?',
        [hashedPassword, existingAdmin[0].id]
      );
      console.log('   ✅ Password actualizado');
      console.log('');
    } else {
      // Crear nuevo administrador
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES (?, ?, ?, ?, ?)
      `, [adminNombre, adminApellido, adminEmail, hashedPassword, adminRol]);
      console.log('✅ Administrador creado exitosamente');
      console.log('');
    }
    
    // Verificar administradores existentes
    console.log('📊 Administradores en QA:');
    const [allAdmins] = await connection.execute(
      'SELECT id, nombre, apellido, email, rol, activo FROM administradores ORDER BY fecha_registro DESC'
    );
    
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.nombre} ${admin.apellido}`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      Rol: ${admin.rol || 'NULL'}`);
      console.log(`      Activo: ${admin.activo ? 'Sí' : 'No'}`);
      console.log('');
    });
    
    console.log('🎉 ============================================');
    console.log('🎉 Administrador de QA Creado/Actualizado');
    console.log('🎉 ============================================');
    console.log('');
    console.log('📋 ============================================');
    console.log('📋 CREDENCIALES DEL ADMINISTRADOR DE QA');
    console.log('📋 ============================================');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Rol: ${adminRol}`);
    console.log('📋 ============================================');
    console.log('');
    console.log('✅ Puedes usar estas credenciales para iniciar sesión en QA');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ============================================');
    console.error('❌ ERROR al agregar administrador');
    console.error('❌ ============================================');
    console.error('');
    console.error('Detalles del error:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Errno: ${error.errno || 'N/A'}`);
    console.error('');
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🔍 Verifique la conexión al servidor MySQL de QA');
      console.error('   Host: manufrias.mysql.database.azure.com');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 1045) {
      console.error('🔍 Verifique las credenciales');
      console.error('💡 Puede pasar la contraseña como: DB_PASSWORD=tu_password node scripts/addQAAdmin.js');
    } else if (error.code === 'ER_BAD_DB_ERROR' || error.code === 1049) {
      console.error('🔍 La base de datos no existe');
      console.error('💡 Ejecute primero el script de inicialización de QA');
    }
    console.error('');
    
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('✅ Conexión cerrada correctamente');
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addQAAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { addQAAdmin };

