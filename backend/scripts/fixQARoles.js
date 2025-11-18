#!/usr/bin/env node

/**
 * Script para asegurar que todos los administradores en QA tengan rol super_admin
 */

const mysql = require('mysql2/promise');

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

async function fixQARoles() {
  let connection = null;
  
  try {
    console.log('🔍 ============================================');
    console.log('🔍 Actualizando Roles de Administradores en QA');
    console.log('🔍 ============================================');
    console.log('');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos de QA');
    console.log('');
    
    // Obtener todos los administradores
    const [admins] = await connection.execute(
      'SELECT id, nombre, apellido, email, rol FROM administradores WHERE activo = TRUE'
    );
    
    console.log(`📊 Administradores encontrados: ${admins.length}`);
    console.log('');
    
    let actualizados = 0;
    
    for (const admin of admins) {
      console.log(`👤 Administrador: ${admin.email}`);
      console.log(`   Nombre: ${admin.nombre} ${admin.apellido}`);
      console.log(`   Rol actual: ${admin.rol || 'NULL'}`);
      
      // Si el rol no es 'super_admin', actualizarlo
      if (!admin.rol || admin.rol === '' || admin.rol !== 'super_admin') {
        await connection.execute(
          'UPDATE administradores SET rol = ? WHERE id = ?',
          ['super_admin', admin.id]
        );
        console.log(`   ✅ Rol actualizado a 'super_admin'`);
        actualizados++;
      } else {
        console.log(`   ✅ Rol ya es 'super_admin'`);
      }
      console.log('');
    }
    
    console.log('📊 ============================================');
    console.log('📊 Resumen');
    console.log('📊 ============================================');
    console.log(`   Total administradores: ${admins.length}`);
    console.log(`   Administradores actualizados: ${actualizados}`);
    console.log('');
    
    // Verificar final
    const [finalAdmins] = await connection.execute(
      'SELECT email, rol FROM administradores WHERE activo = TRUE'
    );
    
    console.log('✅ Estado final de administradores:');
    finalAdmins.forEach(admin => {
      console.log(`   - ${admin.email}: ${admin.rol}`);
    });
    console.log('');
    
    console.log('🎉 ============================================');
    console.log('🎉 Actualización Completada');
    console.log('🎉 ============================================');
    console.log('');
    console.log('✅ Todos los administradores tienen rol super_admin');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al actualizar roles');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  fixQARoles()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixQARoles };

