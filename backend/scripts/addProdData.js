#!/usr/bin/env node

/**
 * Script para agregar datos de ejemplo adicionales a la base de datos de producción
 * Incluye productos diferentes a QA y un nuevo administrador
 * 
 * Uso:
 *   node scripts/addProdData.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

async function addProdData() {
  let connection = null;
  
  try {
    console.log('🚀 ============================================');
    console.log('🚀 Agregando Datos Adicionales de Producción');
    console.log('🚀 ============================================');
    console.log('');
    
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos');
    console.log('');
    
    // Crear nuevo administrador
    console.log('👨‍💼 Creando nuevo administrador...');
    const adminEmail = 'admin.prod@repuestera.com';
    const adminPassword = 'AdminProd2024!';
    
    // Verificar si ya existe
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM administradores WHERE email = ?',
      [adminEmail]
    );
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await connection.execute(`
        INSERT INTO administradores (nombre, apellido, email, password, rol) 
        VALUES ('Administrador', 'Producción', ?, ?, 'super_admin')
      `, [adminEmail, hashedPassword]);
      console.log('✅ Administrador creado exitosamente');
      console.log('');
      console.log('📋 ============================================');
      console.log('📋 CREDENCIALES DEL NUEVO ADMINISTRADOR');
      console.log('📋 ============================================');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('📋 ============================================');
      console.log('');
    } else {
      console.log('ℹ️  El administrador ya existe');
      console.log('');
      console.log('📋 Credenciales existentes:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('');
    }
    
    // Obtener IDs de categorías para los productos
    console.log('📂 Obteniendo IDs de categorías...');
    const [categorias] = await connection.execute('SELECT id, nombre FROM categorias ORDER BY id');
    const categoriaMap = {};
    categorias.forEach(cat => {
      categoriaMap[cat.nombre] = cat.id;
    });
    console.log(`✅ ${categorias.length} categorías encontradas`);
    console.log('');
    
    // Productos adicionales diferentes a QA
    console.log('🔧 Agregando productos adicionales de producción...');
    const productosAdicionales = [
      // Productos de Motor
      ['Radiador Aluminio', 'Radiador de aluminio de alta eficiencia para refrigeración del motor', 245.99, 12, null, categoriaMap['Motor'], 'RAD001', 'Behr', 'Aluminum Pro', 2018, 2024],
      ['Termostato Motor', 'Termostato electrónico para control de temperatura', 35.50, 30, null, categoriaMap['Motor'], 'TER001', 'Gates', 'Electronic', 2015, 2024],
      ['Bomba de Agua', 'Bomba de agua con sellos de cerámica de larga duración', 89.99, 18, null, categoriaMap['Motor'], 'BAG001', 'GMB', 'Ceramic Seal', 2010, 2024],
      
      // Productos de Frenos
      ['Disco de Freno Delantero', 'Disco de freno ventilado de alta calidad', 125.00, 20, null, categoriaMap['Frenos'], 'DFD001', 'Brembo', 'Vented Disc', 2016, 2024],
      ['Líquido de Freno DOT4', 'Líquido de frenos DOT4 de alto rendimiento', 18.99, 50, null, categoriaMap['Frenos'], 'LFD001', 'Castrol', 'DOT4', 2010, 2024],
      ['Manguera de Freno', 'Manguera de freno reforzada con acero inoxidable', 45.50, 25, null, categoriaMap['Frenos'], 'MF001', 'Goodridge', 'Stainless Steel', 2012, 2024],
      
      // Productos de Suspensión
      ['Resorte Trasero', 'Resorte de suspensión trasera de carga reforzada', 95.99, 15, null, categoriaMap['Suspensión'], 'RTR001', 'Moog', 'Heavy Duty', 2014, 2024],
      ['Buje de Suspensión', 'Buje de goma poliuretano para mejor durabilidad', 32.99, 40, null, categoriaMap['Suspensión'], 'BS001', 'Energy Suspension', 'Polyurethane', 2010, 2024],
      ['Barra Estabilizadora', 'Barra estabilizadora delantera de alto rendimiento', 185.00, 10, null, categoriaMap['Suspensión'], 'BED001', 'Eibach', 'Pro-Kit', 2015, 2024],
      
      // Productos de Transmisión
      ['Aceite Transmisión ATF', 'Aceite de transmisión automática sintético', 42.99, 35, null, categoriaMap['Transmisión'], 'ATA001', 'Valvoline', 'MaxLife ATF', 2010, 2024],
      ['Filtro Transmisión', 'Filtro de transmisión automática de alta calidad', 28.50, 30, null, categoriaMap['Transmisión'], 'FT001', 'Wix', 'Premium', 2012, 2024],
      ['Soporte Motor', 'Soporte de motor hidráulico para reducir vibraciones', 125.99, 12, null, categoriaMap['Transmisión'], 'SM001', 'Anchor', 'Hydraulic', 2013, 2024],
      
      // Productos Eléctricos
      ['Alternador 120A', 'Alternador de alta capacidad 120 amperios', 285.99, 8, null, categoriaMap['Eléctrico'], 'ALT001', 'Bosch', '120A Premium', 2015, 2024],
      ['Batería AGM', 'Batería AGM de ciclo profundo 70Ah', 189.99, 15, null, categoriaMap['Eléctrico'], 'BAT001', 'Optima', 'RedTop AGM', 2010, 2024],
      ['Fusible Kit', 'Kit completo de fusibles automotrices', 15.99, 60, null, categoriaMap['Eléctrico'], 'FK001', 'Bussmann', 'Complete Kit', 2005, 2024],
      ['Cable Batería', 'Cable de batería calibre 4 AWG con terminales', 24.99, 25, null, categoriaMap['Eléctrico'], 'CB001', 'Stinger', '4 AWG', 2010, 2024],
      
      // Productos de Carrocería
      ['Parabrisas Delantero', 'Parabrisas con sensor de lluvia y calefacción', 450.00, 5, null, categoriaMap['Carrocería'], 'PBD001', 'Pilkington', 'Heated', 2018, 2024],
      ['Espejo Retrovisor', 'Espejo retrovisor eléctrico con calefacción', 85.50, 20, null, categoriaMap['Carrocería'], 'ER001', 'Mopar', 'Heated Power', 2015, 2024],
      ['Guardabarros Delantero', 'Guardabarros delantero original de fábrica', 125.99, 8, null, categoriaMap['Carrocería'], 'GBD001', 'OEM', 'Factory Original', 2016, 2024],
      
      // Productos de Interior
      ['Asiento Conductor', 'Asiento del conductor con ajuste eléctrico', 425.99, 4, null, categoriaMap['Interior'], 'AC001', 'Recaro', 'Sport Seat', 2017, 2024],
      ['Volante Deportivo', 'Volante deportivo con airbag y controles', 285.00, 6, null, categoriaMap['Interior'], 'VD001', 'Momo', 'Sport Airbag', 2015, 2024],
      ['Alfombra Premium', 'Set de alfombras premium de goma moldeada', 89.99, 12, null, categoriaMap['Interior'], 'AP001', 'WeatherTech', 'Custom Fit', 2010, 2024],
      
      // Productos de Neumáticos
      ['Neumático 205/55R16', 'Neumático todo tiempo de alta calidad', 95.99, 30, null, categoriaMap['Neumáticos'], 'N001', 'Michelin', 'Primacy 4', 2018, 2024],
      ['Llanta Aleación 16"', 'Llanta de aleación ligera 16 pulgadas', 185.50, 15, null, categoriaMap['Neumáticos'], 'LA001', 'Enkei', 'Racing', 2015, 2024],
      ['Válvula TPMS', 'Válvula con sensor de presión TPMS', 25.99, 50, null, categoriaMap['Neumáticos'], 'VT001', 'Schrader', 'TPMS Sensor', 2012, 2024]
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
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          productosExistentes++;
        } else {
          console.error(`⚠️  Error agregando producto ${producto[0]}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Productos agregados: ${productosAgregados}`);
    if (productosExistentes > 0) {
      console.log(`ℹ️  Productos que ya existían: ${productosExistentes}`);
    }
    console.log('');
    
    // Resumen final
    console.log('📊 ============================================');
    console.log('📊 Resumen Final');
    console.log('📊 ============================================');
    
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM administradores');
    const [categoriaCount] = await connection.execute('SELECT COUNT(*) as count FROM categorias');
    const [productoCount] = await connection.execute('SELECT COUNT(*) as count FROM productos');
    
    console.log(`   Administradores: ${adminCount[0].count}`);
    console.log(`   Categorías: ${categoriaCount[0].count}`);
    console.log(`   Productos: ${productoCount[0].count}`);
    console.log('');
    
    console.log('🎉 ============================================');
    console.log('🎉 Datos Adicionales Agregados Exitosamente');
    console.log('🎉 ============================================');
    console.log('');
    console.log('📋 CREDENCIALES DEL ADMINISTRADOR:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ============================================');
    console.error('❌ ERROR al agregar datos');
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
      console.error('💡 Puede pasar la contraseña como: DB_PASSWORD=tu_password node scripts/addProdData.js');
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
  addProdData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { addProdData };

