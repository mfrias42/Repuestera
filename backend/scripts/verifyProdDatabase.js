#!/usr/bin/env node

/**
 * Script para verificar que los productos están en la base de datos de PRODUCCIÓN
 */

const mysql = require('mysql2/promise');

// Configuración de PRODUCCIÓN
const DB_CONFIG_PROD = {
  host: 'manufrias-prod.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: process.env.DB_PASSWORD || '4286Pk1#',
  database: 'repuestera_db',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000
};

// Configuración de QA (para comparar)
const DB_CONFIG_QA = {
  host: 'manufrias.mysql.database.azure.com',
  port: 3306,
  user: 'A',
  password: process.env.DB_PASSWORD || '4286Pk1#',
  database: 'repuestera_db',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000
};

async function verifyProdDatabase() {
  let connectionProd = null;
  let connectionQA = null;
  
  try {
    console.log('🔍 ============================================');
    console.log('🔍 VERIFICANDO BASE DE DATOS DE PRODUCCIÓN');
    console.log('🔍 ============================================');
    console.log('');
    
    // Conectar a PRODUCCIÓN
    console.log('📡 Conectando a PRODUCCIÓN (manufrias-prod.mysql.database.azure.com)...');
    connectionProd = await mysql.createConnection(DB_CONFIG_PROD);
    console.log('✅ Conectado a PRODUCCIÓN');
    
    // Verificar conexión
    const [prodInfo] = await connectionProd.execute('SELECT DATABASE() as db, @@hostname as hostname');
    console.log(`   Base de datos: ${prodInfo[0].db}`);
    console.log(`   Hostname del servidor: ${prodInfo[0].hostname}`);
    console.log('');
    
    // Contar productos en PRODUCCIÓN
    const [prodCount] = await connectionProd.execute('SELECT COUNT(*) as count FROM productos');
    console.log(`📊 Total de productos en PRODUCCIÓN: ${prodCount[0].count}`);
    console.log('');
    
    // Listar algunos productos de PRODUCCIÓN
    console.log('📦 Productos en PRODUCCIÓN (últimos 10):');
    const [prodProducts] = await connectionProd.execute(`
      SELECT nombre, codigo_producto, precio, categoria_id 
      FROM productos 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    prodProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre} (${p.codigo_producto}) - $${p.precio}`);
    });
    console.log('');
    
    // Verificar administradores en PRODUCCIÓN
    const [prodAdmins] = await connectionProd.execute('SELECT email, rol FROM administradores');
    console.log(`👨‍💼 Administradores en PRODUCCIÓN: ${prodAdmins.length}`);
    prodAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.rol})`);
    });
    console.log('');
    
    // Comparar con QA (opcional, para confirmar que son diferentes)
    try {
      console.log('📡 Conectando a QA (manufrias.mysql.database.azure.com) para comparar...');
      connectionQA = await mysql.createConnection(DB_CONFIG_QA);
      console.log('✅ Conectado a QA');
      
      const [qaCount] = await connectionQA.execute('SELECT COUNT(*) as count FROM productos');
      console.log(`📊 Total de productos en QA: ${qaCount[0].count}`);
      console.log('');
      
      if (prodCount[0].count !== qaCount[0].count) {
        console.log('✅ CONFIRMADO: Las bases de datos tienen diferentes cantidades de productos');
        console.log(`   PRODUCCIÓN: ${prodCount[0].count} productos`);
        console.log(`   QA: ${qaCount[0].count} productos`);
      } else {
        console.log('⚠️  Ambas bases tienen la misma cantidad de productos');
      }
      console.log('');
      
    } catch (qaError) {
      console.log('⚠️  No se pudo conectar a QA para comparar (esto está bien)');
      console.log('');
    }
    
    console.log('🎉 ============================================');
    console.log('🎉 VERIFICACIÓN COMPLETA');
    console.log('🎉 ============================================');
    console.log('');
    console.log('✅ Los productos están en PRODUCCIÓN');
    console.log(`✅ Host: manufrias-prod.mysql.database.azure.com`);
    console.log(`✅ Base de datos: repuestera_db`);
    console.log(`✅ Total productos: ${prodCount[0].count}`);
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR al verificar la base de datos');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('');
    process.exit(1);
  } finally {
    if (connectionProd) {
      try {
        await connectionProd.end();
      } catch (e) {}
    }
    if (connectionQA) {
      try {
        await connectionQA.end();
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  verifyProdDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { verifyProdDatabase };

