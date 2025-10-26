const path = require('path');
require('dotenv').config();

// Configuración de base de datos híbrida: SQLite para desarrollo, Azure SQL para producción
const dbType = process.env.DB_TYPE || 'sqlite';

console.log('🗄️  Tipo de base de datos:', dbType);
console.log('🌍 Entorno:', process.env.NODE_ENV);

if (dbType === 'sqlite') {
  // Usar SQLite para desarrollo
  console.log('📱 Usando SQLite para desarrollo local');
  module.exports = require('./database-sqlite');
} else if (dbType === 'mysql') {
  // Usar MySQL Flexible Server para producción
  console.log('☁️  Usando Azure Database for MySQL Flexible Server para producción');
  module.exports = require('./database-mysql');
} else if (dbType === 'sqlserver') {
  // Usar Azure SQL Database para producción
  console.log('☁️  Usando Azure SQL Database para producción');
  module.exports = require('./database-sqlserver');
} else {
  console.error('❌ Tipo de base de datos no soportado:', dbType);
  process.exit(1);
}