const bcrypt = require('bcryptjs');
const { executeQuery, initializeTables } = require('../config/database-sqlite');

async function addAdminUser() {
  try {
    console.log('🔧 Iniciando creación de usuario administrador...');
    
    // Primero inicializar las tablas
    console.log('📊 Inicializando tablas...');
    await initializeTables();

    // Verificar si ya existe el administrador
    const existingAdmin = await executeQuery(
      'SELECT id FROM administradores WHERE email = ?',
      ['admin@repuestera.com']
    );

    if (existingAdmin.length > 0) {
      console.log('👨‍💼 Administrador ya existe');
      console.log('📋 Credenciales de administrador:');
      console.log('   - Email: admin@repuestera.com');
      console.log('   - Password: admin123');
      return;
    }

    // Crear administrador por defecto
    const adminPassword = await bcrypt.hash('admin123', 12);
    await executeQuery(`
      INSERT INTO administradores (nombre, apellido, email, password) 
      VALUES (?, ?, ?, ?)
    `, ['Admin', 'Sistema', 'admin@repuestera.com', adminPassword]);

    console.log('✅ Administrador creado exitosamente');
    console.log('📋 Credenciales de administrador:');
    console.log('   - Email: admin@repuestera.com');
    console.log('   - Password: admin123');

    // Verificar categorías
    const categorias = await executeQuery('SELECT COUNT(*) as count FROM categorias');
    if (categorias[0].count === 0) {
      console.log('📂 Agregando categorías por defecto...');
      await executeQuery(`INSERT INTO categorias (nombre, descripcion) VALUES 
        ('Motor', 'Repuestos para motor del vehículo'),
        ('Frenos', 'Sistema de frenos y componentes'),
        ('Suspensión', 'Amortiguadores y sistema de suspensión'),
        ('Transmisión', 'Caja de cambios y transmisión'),
        ('Eléctrico', 'Sistema eléctrico y electrónico'),
        ('Carrocería', 'Partes de carrocería y exterior'),
        ('Interior', 'Componentes del interior del vehículo'),
        ('Neumáticos', 'Neumáticos y llantas')
      `);
      console.log('✅ Categorías agregadas');
    }

  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addAdminUser().then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  });
}

module.exports = { addAdminUser };