const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'repuestera_db',
  port: process.env.DB_PORT || 3306
};

/**
 * Limpiar base de datos (eliminar todos los datos pero mantener estructura)
 */
async function cleanDatabase() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 Limpiando datos de la base de datos...');
    
    // Deshabilitar verificación de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Limpiar tablas en orden
    const tables = ['productos', 'usuarios', 'administradores', 'categorias'];
    
    for (const table of tables) {
      await connection.execute(`DELETE FROM ${table}`);
      await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      console.log(`   ✅ Tabla ${table} limpiada`);
    }
    
    // Rehabilitar verificación de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Base de datos limpiada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Limpiar archivos de uploads
 */
async function cleanUploads() {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
    
    console.log('🧹 Limpiando archivos de uploads...');
    
    // Verificar si el directorio existe
    try {
      await fs.access(uploadsDir);
    } catch {
      console.log('📁 Directorio de uploads no existe, creándolo...');
      await fs.mkdir(uploadsDir, { recursive: true });
      return;
    }
    
    // Leer archivos en el directorio
    const files = await fs.readdir(uploadsDir);
    
    if (files.length === 0) {
      console.log('📁 Directorio de uploads ya está vacío');
      return;
    }
    
    // Eliminar cada archivo
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      await fs.unlink(filePath);
      console.log(`   🗑️  Eliminado: ${file}`);
    }
    
    console.log(`✅ ${files.length} archivos eliminados del directorio uploads`);
    
  } catch (error) {
    console.error('❌ Error al limpiar uploads:', error.message);
  }
}

/**
 * Crear directorios necesarios
 */
async function createDirectories() {
  const directories = [
    'uploads/products',
    'logs',
    'backups'
  ];
  
  console.log('📁 Creando directorios necesarios...');
  
  for (const dir of directories) {
    const fullPath = path.join(__dirname, '..', dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`   ✅ Directorio creado: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`   ❌ Error creando ${dir}:`, error.message);
      } else {
        console.log(`   📁 Directorio ya existe: ${dir}`);
      }
    }
  }
}

/**
 * Verificar estado de la base de datos
 */
async function checkDatabaseStatus() {
  let connection;
  
  try {
    console.log('🔍 Verificando estado de la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    const tables = ['categorias', 'usuarios', 'administradores', 'productos'];
    
    console.log('\n📊 Estado de las tablas:');
    console.log('┌─────────────────┬─────────────┐');
    console.log('│ Tabla           │ Registros   │');
    console.log('├─────────────────┼─────────────┤');
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`│ ${table.padEnd(15)} │ ${count.toString().padStart(11)} │`);
      } catch (error) {
        console.log(`│ ${table.padEnd(15)} │ ${'ERROR'.padStart(11)} │`);
      }
    }
    
    console.log('└─────────────────┴─────────────┘');
    
  } catch (error) {
    console.error('❌ Error al verificar la base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Generar datos de prueba adicionales
 */
async function generateTestData() {
  let connection;
  
  try {
    console.log('🔄 Generando datos de prueba adicionales...');
    connection = await mysql.createConnection(dbConfig);
    
    // Generar usuarios adicionales
    const additionalUsers = [];
    for (let i = 1; i <= 10; i++) {
      additionalUsers.push({
        nombre: `Usuario${i}`,
        apellido: `Test${i}`,
        email: `usuario${i}@test.com`,
        password: '$2a$10$example.hash.here', // Hash de 'test123'
        telefono: `+54123456789${i}`,
        direccion: `Dirección de prueba ${i}, Buenos Aires`
      });
    }
    
    for (const user of additionalUsers) {
      try {
        await connection.execute(
          'INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
          [user.nombre, user.apellido, user.email, user.password, user.telefono, user.direccion]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
      }
    }
    
    console.log(`✅ ${additionalUsers.length} usuarios de prueba generados`);
    
  } catch (error) {
    console.error('❌ Error al generar datos de prueba:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Backup rápido de la base de datos
 */
async function quickBackup() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    console.log('💾 Creando backup rápido...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, '..', 'backups', `backup_${timestamp}.sql`);
    
    // Crear directorio de backups si no existe
    await fs.mkdir(path.dirname(backupFile), { recursive: true });
    
    const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > ${backupFile}`;
    
    await execAsync(command);
    
    console.log(`✅ Backup creado: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Error al crear backup:', error.message);
  }
}

// Función principal para manejar argumentos de línea de comandos
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'clean-db':
      await cleanDatabase();
      break;
    case 'clean-uploads':
      await cleanUploads();
      break;
    case 'clean-all':
      await cleanDatabase();
      await cleanUploads();
      break;
    case 'create-dirs':
      await createDirectories();
      break;
    case 'status':
      await checkDatabaseStatus();
      break;
    case 'generate-test':
      await generateTestData();
      break;
    case 'backup':
      await quickBackup();
      break;
    case 'reset':
      console.log('🔄 Reiniciando entorno de desarrollo...');
      await cleanDatabase();
      await cleanUploads();
      await createDirectories();
      // Re-importar datos iniciales
      const { initializeDatabase } = require('./initDatabase');
      await initializeDatabase();
      console.log('✅ Entorno reiniciado completamente');
      break;
    default:
      console.log(`
🛠️  Utilidades de Desarrollo - Repuestera Backend

Uso: node scripts/dev-utils.js <comando>

Comandos disponibles:
  clean-db        Limpiar todos los datos de la base de datos
  clean-uploads   Limpiar archivos de uploads
  clean-all       Limpiar base de datos y uploads
  create-dirs     Crear directorios necesarios
  status          Mostrar estado de la base de datos
  generate-test   Generar datos de prueba adicionales
  backup          Crear backup rápido de la base de datos
  reset           Reiniciar completamente el entorno de desarrollo

Ejemplos:
  npm run dev-utils status
  npm run dev-utils clean-all
  npm run dev-utils reset
      `);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  cleanDatabase,
  cleanUploads,
  createDirectories,
  checkDatabaseStatus,
  generateTestData,
  quickBackup
};