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
const { testConnection, initializeTables } = require('./config/database-mysql');
const { fixDatabase } = require('./scripts/fixDatabase');

// Probar conexión a la base de datos al iniciar
testConnection().then(async (success) => {
  if (success) {
    console.log('✅ Base de datos conectada correctamente');
    // Inicializar tablas si no existen
    try {
      await initializeTables();
      console.log('✅ Tablas de base de datos inicializadas');
    } catch (error) {
      console.error('⚠️  Error inicializando tablas:', error.message);
    }
  } else {
    console.error('❌ Error conectando a la base de datos');
    throw new Error('No se pudo conectar a la base de datos');
  }
}).catch(console.error);

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
    res.json({ 
      status: 'OK', 
      message: 'Servidor funcionando correctamente',
      database: dbStatus ? 'Conectada' : 'Desconectada',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error en el servidor',
      database: 'Error de conexión',
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