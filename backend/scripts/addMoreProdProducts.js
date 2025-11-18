#!/usr/bin/env node

/**
 * Script para agregar 10 productos adicionales diferentes a QA
 * 
 * Uso:
 *   node scripts/addMoreProdProducts.js
 */

const mysql = require('mysql2/promise');

// Configuración directa de producción
const DB_CONFIG = {
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

async function addMoreProdProducts() {
  let connection = null;
  
  try {
    console.log('🚀 ============================================');
    console.log('🚀 Agregando 10 Productos Adicionales');
    console.log('🚀 ============================================');
    console.log('');
    
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos');
    console.log('');
    
    // Obtener IDs de categorías
    console.log('📂 Obteniendo IDs de categorías...');
    const [categorias] = await connection.execute('SELECT id, nombre FROM categorias ORDER BY id');
    const categoriaMap = {};
    categorias.forEach(cat => {
      categoriaMap[cat.nombre] = cat.id;
    });
    console.log(`✅ ${categorias.length} categorías encontradas`);
    console.log('');
    
    // 10 productos adicionales diferentes a QA
    console.log('🔧 Agregando 10 productos adicionales...');
    const productosAdicionales = [
      // Motor - Productos premium
      ['Turbo Compresor', 'Turbo compresor de alta eficiencia con intercooler integrado', 1250.99, 3, null, categoriaMap['Motor'], 'TUR001', 'Garrett', 'GT2860RS', 2018, 2024],
      
      // Frenos - Sistema completo
      ['Kit Freno Completo', 'Kit completo de frenos delanteros y traseros con pastillas y discos', 425.99, 8, null, categoriaMap['Frenos'], 'KFC001', 'PowerStop', 'Z23 Evolution', 2015, 2024],
      
      // Suspensión - Componentes avanzados
      ['Sistema Suspensión Aire', 'Sistema de suspensión neumática ajustable con compresor', 1850.00, 2, null, categoriaMap['Suspensión'], 'SSA001', 'Air Lift', 'Performance 3H', 2016, 2024],
      
      // Transmisión - Componentes especializados
      ['Convertidor Par', 'Convertidor de par de alto rendimiento para transmisión automática', 650.99, 5, null, categoriaMap['Transmisión'], 'CP001', 'TCI', 'Street Fighter', 2014, 2024],
      
      // Eléctrico - Sistema avanzado
      ['Sistema Audio Premium', 'Sistema de audio completo con amplificador y subwoofer', 899.99, 6, null, categoriaMap['Eléctrico'], 'SAP001', 'Pioneer', 'DMH-WT8600NEX', 2019, 2024],
      
      // Carrocería - Accesorios premium
      ['Kit Body Kit Completo', 'Kit completo de body kit con faldones y alerón trasero', 1250.50, 4, null, categoriaMap['Carrocería'], 'KBK001', 'VIS Racing', 'Carbon Fiber', 2017, 2024],
      
      // Interior - Lujo
      ['Sistema Navegación GPS', 'Sistema de navegación GPS integrado con pantalla táctil 10"', 650.00, 7, null, categoriaMap['Interior'], 'SNG001', 'Kenwood', 'DNX997XR', 2018, 2024],
      
      // Neumáticos - Gama alta
      ['Neumático Deportivo 225/45R17', 'Neumático deportivo de alto rendimiento para pista', 185.99, 20, null, categoriaMap['Neumáticos'], 'ND001', 'Bridgestone', 'Potenza RE-71R', 2019, 2024],
      
      // Motor - Refrigeración avanzada
      ['Intercooler Front Mount', 'Intercooler de montaje frontal de alta eficiencia', 425.99, 6, null, categoriaMap['Motor'], 'IFM001', 'Mishimoto', 'Front Mount', 2017, 2024],
      
      // Eléctrico - Iluminación LED
      ['Kit LED Completo', 'Kit completo de iluminación LED para faros delanteros y traseros', 285.50, 12, null, categoriaMap['Eléctrico'], 'KLC001', 'Morimoto', 'XSB LED', 2016, 2024]
    ];
    
    let productosAgregados = 0;
    let productosExistentes = 0;
    
    for (const producto of productosAdicionales) {
      try {
        await connection.execute(`
          INSERT INTO productos 
          (nombre, descripcion, precio, stock, imagen, categoria_id, codigo_producto, marca, modelo, año_desde, año_hasta) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, producto);
        productosAgregados++;
        console.log(`✅ Agregado: ${producto[0]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          productosExistentes++;
          console.log(`ℹ️  Ya existe: ${producto[0]}`);
        } else {
          console.error(`⚠️  Error agregando ${producto[0]}:`, error.message);
        }
      }
    }
    
    console.log('');
    console.log('📊 ============================================');
    console.log('📊 Resumen');
    console.log('📊 ============================================');
    console.log(`   Productos agregados: ${productosAgregados}`);
    if (productosExistentes > 0) {
      console.log(`   Productos que ya existían: ${productosExistentes}`);
    }
    console.log('');
    
    // Resumen final de productos totales
    const [productoCount] = await connection.execute('SELECT COUNT(*) as count FROM productos');
    console.log(`✅ Total de productos en producción: ${productoCount[0].count}`);
    console.log('');
    
    console.log('🎉 ============================================');
    console.log('🎉 Productos Adicionales Agregados Exitosamente');
    console.log('🎉 ============================================');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ============================================');
    console.error('❌ ERROR al agregar productos');
    console.error('❌ ============================================');
    console.error('');
    console.error('Detalles del error:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('');
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🔍 Verifique la conexión al servidor MySQL');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 1045) {
      console.error('🔍 Verifique las credenciales');
      console.error('💡 Puede pasar la contraseña como: DB_PASSWORD=tu_password node scripts/addMoreProdProducts.js');
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
  addMoreProdProducts()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { addMoreProdProducts };

