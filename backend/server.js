const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const debugRoutes = require('./routes/debug');
const testRoutes = require('./routes/test-simple');

// Inicializar base de datos MySQL
const { testConnection, initializeTables, executeQuery } = require('./config/database-mysql');
const { initProdDatabase } = require('./scripts/initProdDatabase');

// Función para verificar si las tablas existen
async function checkTablesExist() {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('usuarios', 'administradores', 'categorias', 'productos')
    `;
    const result = await executeQuery(query);
    return result[0].count === 4;
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
    return false;
  }
}

// Probar conexión y inicializar base de datos si es necesario
async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando verificación e inicialización de base de datos...');
    console.log('📊 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('📊 DB_TYPE:', process.env.DB_TYPE || 'NO DEFINIDO');
    
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Error conectando a la base de datos. El servidor continuará pero algunas funciones no funcionarán.');
      console.error('❌ Verifique las variables de entorno: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
      return false;
    }

    console.log('✅ Base de datos conectada correctamente');

    // Verificar si las tablas existen
    const tablesExist = await checkTablesExist();
    console.log('📊 Estado de las tablas:', tablesExist ? 'Existen' : 'No existen');
    
    if (!tablesExist) {
      console.log('⚠️  Las tablas no existen. Inicializando base de datos...');
      
      // Solo inicializar en producción si DB_TYPE es mysql
      if (process.env.DB_TYPE === 'mysql' && process.env.NODE_ENV === 'production') {
        console.log('🔧 Ejecutando script de inicialización de producción...');
        try {
          await initProdDatabase();
          console.log('✅ Base de datos de producción inicializada correctamente');
        } catch (error) {
          console.error('❌ Error detallado inicializando base de datos de producción:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            stack: error.stack
          });
          // No lanzar error para que el servidor pueda iniciar
        }
      } else {
        // Para otros ambientes, usar initializeTables
        console.log('🔧 Ejecutando inicialización de tablas estándar...');
        try {
          await initializeTables();
          console.log('✅ Tablas inicializadas correctamente');
        } catch (error) {
          console.error('❌ Error inicializando tablas:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
          });
        }
      }
    } else {
      console.log('✅ Las tablas ya existen. Base de datos lista.');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en inicialización de base de datos:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    return false;
  }
}

// Inicializar base de datos al iniciar (no bloqueante)
initializeDatabase().catch(console.error);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana de tiempo
});
app.use(limiter);

// CORS - Configuración mejorada
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // URLs de Azure App Service - Producción
  'http://repuestera-web.azurewebsites.net',
  'https://repuestera-web.azurewebsites.net',
  // URLs de Azure App Service - QA
  'http://repuestera-web-qa.azurewebsites.net',
  'https://repuestera-web-qa.azurewebsites.net',
  // URLs de Azure App Service - Producción separada
  'http://repuestera-web-prod.azurewebsites.net',
  'https://repuestera-web-prod.azurewebsites.net',
  // URLs adicionales para desarrollo
  'http://localhost:8080',
  'http://localhost:8000'
];

// Función para validar origen
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, aplicaciones móviles, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test', testRoutes);

// Ruta de prueba con verificación de base de datos
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    // Verificar si las tablas existen
    let tablesStatus = 'unknown';
    let tablesCount = 0;
    try {
      const tablesQuery = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name IN ('usuarios', 'administradores', 'categorias', 'productos')
      `;
      const { executeQuery } = require('./config/database-mysql');
      const result = await executeQuery(tablesQuery);
      tablesCount = result[0].count;
      tablesStatus = tablesCount === 4 ? 'completas' : `incompletas (${tablesCount}/4)`;
    } catch (error) {
      tablesStatus = 'error verificando';
      console.error('Error verificando tablas:', error.message);
    }
    
    res.json({ 
      status: 'OK', 
      message: 'Servidor funcionando correctamente',
      database: {
        connected: dbStatus,
        status: dbStatus ? 'Conectada' : 'Desconectada',
        tables: tablesStatus,
        tablesCount: tablesCount
      },
      environment: process.env.NODE_ENV || 'development',
      config: {
        dbHost: process.env.DB_HOST || 'NO DEFINIDO',
        dbName: process.env.DB_NAME || 'NO DEFINIDO',
        dbUser: process.env.DB_USER || 'NO DEFINIDO',
        dbType: process.env.DB_TYPE || 'NO DEFINIDO'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error en el servidor',
      database: {
        connected: false,
        status: 'Error de conexión',
        error: error.message
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('🔧 Versión con reparación de base de datos aplicada');
});