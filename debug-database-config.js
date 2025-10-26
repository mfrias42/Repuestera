// Script para diagnosticar la configuración de base de datos en el App Service
console.log('🔍 Diagnóstico de configuración de base de datos');
console.log('==============================================');

console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🗄️  DB_TYPE:', process.env.DB_TYPE);
console.log('🏠 DB_HOST:', process.env.DB_HOST);
console.log('👤 DB_USER:', process.env.DB_USER);
console.log('📊 DB_NAME:', process.env.DB_NAME);
console.log('🔌 DB_PORT:', process.env.DB_PORT);

// Verificar si las variables están definidas
const dbType = process.env.DB_TYPE || 'sqlite';
console.log('📋 DB_TYPE detectado:', dbType);

if (dbType === 'mysql') {
  console.log('✅ Configuración MySQL detectada');
  console.log('🔗 Host:', process.env.DB_HOST);
  console.log('📊 Database:', process.env.DB_NAME);
  console.log('👤 User:', process.env.DB_USER);
  console.log('🔌 Port:', process.env.DB_PORT);
} else if (dbType === 'sqlite') {
  console.log('⚠️  Configuración SQLite detectada (puede ser incorrecta)');
} else {
  console.log('❌ Tipo de base de datos no reconocido:', dbType);
}

// Probar la carga del módulo de base de datos
try {
  const dbConfig = require('./config/database');
  console.log('✅ Módulo de base de datos cargado correctamente');
  console.log('📋 Funciones disponibles:', Object.keys(dbConfig));
} catch (error) {
  console.error('❌ Error cargando módulo de base de datos:', error.message);
}
