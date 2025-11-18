// Cargar variables de entorno PRIMERO con ruta explícita
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verificar que las variables se cargaron
console.log('🔍 Variables de entorno cargadas:');
console.log('  DB_HOST:', process.env.DB_HOST || 'NO DEFINIDO');
console.log('  DB_USER:', process.env.DB_USER || 'NO DEFINIDO');
console.log('  DB_NAME:', process.env.DB_NAME || 'NO DEFINIDO');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***DEFINIDO***' : 'NO DEFINIDO');

const { executeQuery } = require('../config/database-mysql');

async function fixAdminRoles() {
  try {
    console.log('🔧 Verificando y corrigiendo roles de administradores...');
    
    // Primero verificar si la columna 'rol' existe
    try {
      const checkColumnQuery = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'administradores' 
        AND COLUMN_NAME = 'rol'
      `;
      const columnExists = await executeQuery(checkColumnQuery);
      
      if (columnExists.length === 0) {
        console.log('⚠️  La columna "rol" no existe. Creándola...');
        await executeQuery(`
          ALTER TABLE administradores 
          ADD COLUMN rol ENUM('admin', 'super_admin') DEFAULT 'admin' 
          AFTER password
        `);
        console.log('✅ Columna "rol" creada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error verificando/creando columna rol:', error.message);
      throw error;
    }
    
    // Buscar administradores sin rol o con rol NULL
    const query = 'SELECT id, email, rol FROM administradores WHERE rol IS NULL OR rol = ""';
    const admins = await executeQuery(query);
    
    if (admins.length === 0) {
      console.log('✅ Todos los administradores tienen rol asignado');
      return;
    }
    
    console.log(`⚠️  Encontrados ${admins.length} administradores sin rol:`);
    admins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Email: ${admin.email}, Rol actual: ${admin.rol || 'NULL'}`);
    });
    
    // Actualizar administradores sin rol a 'admin' por defecto
    const updateQuery = 'UPDATE administradores SET rol = ? WHERE rol IS NULL OR rol = ""';
    const result = await executeQuery(updateQuery, ['admin']);
    
    console.log(`✅ Actualizados ${admins.length} administradores con rol 'admin' por defecto`);
    
    // Verificar que se actualizaron correctamente
    const verifyQuery = 'SELECT id, email, rol FROM administradores WHERE activo = TRUE';
    const allAdmins = await executeQuery(verifyQuery);
    
    console.log('\n📋 Estado actual de todos los administradores activos:');
    allAdmins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Email: ${admin.email}, Rol: ${admin.rol || 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al corregir roles de administradores:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixAdminRoles();
}

module.exports = { fixAdminRoles };

