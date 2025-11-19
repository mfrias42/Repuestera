#!/usr/bin/env node

/**
 * Script para revisar la estructura completa de la base de datos de QA
 * y compararla con la estructura esperada
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

// Estructura esperada de las tablas
const EXPECTED_STRUCTURE = {
  usuarios: {
    columns: ['id', 'nombre', 'apellido', 'email', 'password', 'telefono', 'direccion', 'fecha_registro', 'activo'],
    indexes: ['PRIMARY', 'idx_email']
  },
  administradores: {
    columns: ['id', 'nombre', 'apellido', 'email', 'password', 'rol', 'fecha_registro', 'ultimo_acceso', 'activo'],
    indexes: ['PRIMARY', 'idx_email']
  },
  categorias: {
    columns: ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion'],
    indexes: ['PRIMARY']
  },
  productos: {
    columns: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'categoria_id', 'codigo_producto', 'marca', 'modelo', 'año_desde', 'año_hasta', 'imagen', 'activo', 'fecha_creacion', 'fecha_actualizacion'],
    indexes: ['PRIMARY', 'idx_categoria', 'idx_activo', 'idx_codigo']
  }
};

async function checkDatabaseStructure() {
  let connection = null;
  
  try {
    console.log('🔍 ============================================');
    console.log('🔍 Revisando Estructura de Base de Datos QA');
    console.log('🔍 ============================================');
    console.log('');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos de QA');
    console.log('');
    
    // Verificar qué tablas existen
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME as table_name
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tables.map(t => t.table_name || t.TABLE_NAME).filter(Boolean);
    console.log(`📊 Tablas encontradas: ${existingTables.length}`);
    existingTables.forEach(table => {
      console.log(`   ✓ ${table}`);
    });
    console.log('');
    
    // Verificar cada tabla esperada
    for (const [tableName, expected] of Object.entries(EXPECTED_STRUCTURE)) {
      console.log(`\n📋 ============================================`);
      console.log(`📋 Tabla: ${tableName}`);
      console.log(`📋 ============================================`);
      
      if (!existingTables.includes(tableName)) {
        console.log(`❌ TABLA NO EXISTE`);
        console.log(`   Columnas esperadas: ${expected.columns.join(', ')}`);
        continue;
      }
      
      // Obtener columnas de la tabla
      const [columns] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      console.log(`\n📊 Columnas encontradas (${existingColumns.length}):`);
      columns.forEach(col => {
        const marker = expected.columns.includes(col.COLUMN_NAME) ? '✓' : '⚠️';
        console.log(`   ${marker} ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.IS_NULLABLE === 'YES' ? ', NULL' : ', NOT NULL'})`);
      });
      
      // Verificar columnas faltantes
      const missingColumns = expected.columns.filter(col => !existingColumns.includes(col));
      if (missingColumns.length > 0) {
        console.log(`\n❌ Columnas faltantes (${missingColumns.length}):`);
        missingColumns.forEach(col => {
          console.log(`   - ${col}`);
        });
      } else {
        console.log(`\n✅ Todas las columnas esperadas están presentes`);
      }
      
      // Verificar columnas extra
      const extraColumns = existingColumns.filter(col => !expected.columns.includes(col));
      if (extraColumns.length > 0) {
        console.log(`\n⚠️  Columnas adicionales (no esperadas):`);
        extraColumns.forEach(col => {
          console.log(`   - ${col}`);
        });
      }
      
      // Verificar índices
      const [indexes] = await connection.execute(`
        SELECT INDEX_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);
      
      const existingIndexes = [...new Set(indexes.map(i => i.INDEX_NAME))];
      console.log(`\n📊 Índices encontrados (${existingIndexes.length}):`);
      existingIndexes.forEach(idx => {
        const cols = indexes.filter(i => i.INDEX_NAME === idx).map(i => i.COLUMN_NAME).join(', ');
        const marker = expected.indexes.includes(idx) ? '✓' : '⚠️';
        console.log(`   ${marker} ${idx} (${cols})`);
      });
      
      const missingIndexes = expected.indexes.filter(idx => !existingIndexes.includes(idx));
      if (missingIndexes.length > 0) {
        console.log(`\n❌ Índices faltantes (${missingIndexes.length}):`);
        missingIndexes.forEach(idx => {
          console.log(`   - ${idx}`);
        });
      } else {
        console.log(`\n✅ Todos los índices esperados están presentes`);
      }
      
      // Contar registros
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n📊 Registros: ${count[0].count}`);
    }
    
    console.log('\n\n🎯 ============================================');
    console.log('🎯 Resumen de Problemas Encontrados');
    console.log('🎯 ============================================');
    
    let totalProblems = 0;
    for (const [tableName, expected] of Object.entries(EXPECTED_STRUCTURE)) {
      if (!existingTables.includes(tableName)) {
        console.log(`\n❌ ${tableName}: TABLA NO EXISTE`);
        totalProblems++;
        continue;
      }
      
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
      `, [tableName]);
      
      const existingColumns = columns.map(c => c.COLUMN_NAME);
      const missingColumns = expected.columns.filter(col => !existingColumns.includes(col));
      
      const [indexes] = await connection.execute(`
        SELECT DISTINCT INDEX_NAME
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
      `, [tableName]);
      
      const existingIndexes = indexes.map(i => i.INDEX_NAME);
      const missingIndexes = expected.indexes.filter(idx => !existingIndexes.includes(idx));
      
      if (missingColumns.length > 0 || missingIndexes.length > 0) {
        console.log(`\n⚠️  ${tableName}:`);
        if (missingColumns.length > 0) {
          console.log(`   Columnas faltantes: ${missingColumns.join(', ')}`);
          totalProblems += missingColumns.length;
        }
        if (missingIndexes.length > 0) {
          console.log(`   Índices faltantes: ${missingIndexes.join(', ')}`);
          totalProblems += missingIndexes.length;
        }
      } else {
        console.log(`\n✅ ${tableName}: Estructura correcta`);
      }
    }
    
    if (totalProblems === 0) {
      console.log('\n\n🎉 ============================================');
      console.log('🎉 ¡Estructura de Base de Datos Correcta!');
      console.log('🎉 ============================================');
    } else {
      console.log(`\n\n⚠️  Total de problemas encontrados: ${totalProblems}`);
      console.log('💡 Ejecuta el script de inicialización para corregir estos problemas');
    }
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al revisar estructura');
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
  checkDatabaseStructure()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStructure };

