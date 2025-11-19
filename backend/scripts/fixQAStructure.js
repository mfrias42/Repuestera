#!/usr/bin/env node

/**
 * Script para corregir la estructura de la base de datos de QA
 * basándose en los problemas encontrados
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

async function fixQAStructure() {
  let connection = null;
  
  try {
    console.log('🔧 ============================================');
    console.log('🔧 Corrigiendo Estructura de Base de Datos QA');
    console.log('🔧 ============================================');
    console.log('');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos de QA');
    console.log('');
    
    // 1. Agregar columna ultimo_acceso a administradores
    console.log('📋 1. Corrigiendo tabla administradores...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'administradores' 
        AND COLUMN_NAME = 'ultimo_acceso'
      `);
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE administradores 
          ADD COLUMN ultimo_acceso TIMESTAMP NULL
        `);
        console.log('   ✅ Columna ultimo_acceso agregada');
      } else {
        console.log('   ℹ️  Columna ultimo_acceso ya existe');
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message);
    }
    
    // 2. Crear índice idx_email en administradores si no existe
    try {
      const [indexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'administradores' 
        AND INDEX_NAME = 'idx_email'
      `);
      if (indexes.length === 0) {
        await connection.execute(`
          CREATE INDEX idx_email ON administradores(email)
        `);
        console.log('   ✅ Índice idx_email creado en administradores');
      } else {
        console.log('   ℹ️  Índice idx_email ya existe');
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message);
    }
    
    // 3. Crear índice idx_email en usuarios si no existe
    console.log('\n📋 2. Corrigiendo tabla usuarios...');
    try {
      const [indexes] = await connection.execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND INDEX_NAME = 'idx_email'
      `);
      if (indexes.length === 0) {
        await connection.execute(`
          CREATE INDEX idx_email ON usuarios(email)
        `);
        console.log('   ✅ Índice idx_email creado en usuarios');
      } else {
        console.log('   ℹ️  Índice idx_email ya existe');
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message);
    }
    
    // 4. Corregir tabla productos
    console.log('\n📋 3. Corrigiendo tabla productos...');
    
    // 4.1 Agregar año_desde y año_hasta
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'productos' 
        AND COLUMN_NAME IN ('año_desde', 'año_hasta')
      `);
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      
      if (!existingColumns.includes('año_desde')) {
        await connection.execute(`ALTER TABLE productos ADD COLUMN año_desde INT`);
        console.log('   ✅ Columna año_desde agregada');
      } else {
        console.log('   ℹ️  Columna año_desde ya existe');
      }
      
      if (!existingColumns.includes('año_hasta')) {
        await connection.execute(`ALTER TABLE productos ADD COLUMN año_hasta INT`);
        console.log('   ✅ Columna año_hasta agregada');
      } else {
        console.log('   ℹ️  Columna año_hasta ya existe');
      }
    } catch (err) {
      console.error('   ❌ Error agregando columnas de año:', err.message);
    }
    
    // 4.2 Renombrar imagen_url a imagen
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'productos' 
        AND COLUMN_NAME IN ('imagen', 'imagen_url')
      `);
      const columnNames = columns.map(c => c.COLUMN_NAME);
      
      if (columnNames.includes('imagen_url') && !columnNames.includes('imagen')) {
        await connection.execute(`
          ALTER TABLE productos 
          CHANGE COLUMN imagen_url imagen VARCHAR(500)
        `);
        console.log('   ✅ Columna imagen_url renombrada a imagen');
      } else if (columnNames.includes('imagen')) {
        console.log('   ℹ️  Columna imagen ya existe');
      } else {
        console.log('   ⚠️  No se encontró imagen_url para renombrar');
      }
    } catch (err) {
      console.error('   ❌ Error renombrando columna imagen:', err.message);
    }
    
    // 4.3 Crear índices faltantes en productos
    try {
      const [indexes] = await connection.execute(`
        SELECT DISTINCT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'productos'
      `);
      const existingIndexes = indexes.map(i => i.INDEX_NAME);
      
      if (!existingIndexes.includes('idx_categoria')) {
        await connection.execute(`CREATE INDEX idx_categoria ON productos(categoria_id)`);
        console.log('   ✅ Índice idx_categoria creado');
      } else {
        console.log('   ℹ️  Índice idx_categoria ya existe');
      }
      
      if (!existingIndexes.includes('idx_activo')) {
        await connection.execute(`CREATE INDEX idx_activo ON productos(activo)`);
        console.log('   ✅ Índice idx_activo creado');
      } else {
        console.log('   ℹ️  Índice idx_activo ya existe');
      }
      
      if (!existingIndexes.includes('idx_codigo')) {
        await connection.execute(`CREATE INDEX idx_codigo ON productos(codigo_producto)`);
        console.log('   ✅ Índice idx_codigo creado');
      } else {
        console.log('   ℹ️  Índice idx_codigo ya existe');
      }
    } catch (err) {
      console.error('   ❌ Error creando índices:', err.message);
    }
    
    console.log('\n\n🎉 ============================================');
    console.log('🎉 Corrección Completada');
    console.log('🎉 ============================================');
    console.log('');
    console.log('✅ La estructura de la base de datos ha sido corregida');
    console.log('💡 Ejecuta checkQADatabaseStructure.js para verificar');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al corregir estructura');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('✅ Conexión cerrada correctamente');
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  fixQAStructure()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixQAStructure };

