const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = process.env.UPLOAD_PATH || 'uploads/products';
      
      // Crear directorio si no existe
      await fs.mkdir(uploadPath, { recursive: true });
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `product_${Date.now()}_${uniqueSuffix}${extension}`;
    
    cb(null, filename);
  }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP, GIF)'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB por defecto
    files: 1 // Solo un archivo por vez
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Archivo demasiado grande',
          message: `El archivo no puede exceder ${(parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Demasiados archivos',
          message: 'Solo se permite subir un archivo por vez'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Campo de archivo inesperado',
          message: 'El campo de archivo no es válido'
        });
      default:
        return res.status(400).json({
          error: 'Error de carga',
          message: 'Error al procesar el archivo'
        });
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      error: 'Tipo de archivo no válido',
      message: error.message
    });
  }

  next(error);
};

// Middleware para validar imagen después de la carga
const validateImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Verificar que el archivo realmente existe
    const filePath = req.file.path;
    await fs.access(filePath);

    // Agregar información adicional al request
    req.file.url = `/uploads/products/${req.file.filename}`;
    req.file.size_mb = (req.file.size / (1024 * 1024)).toFixed(2);

    next();
  } catch (error) {
    // Si hay error, intentar eliminar el archivo
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }

    return res.status(500).json({
      error: 'Error procesando imagen',
      message: 'No se pudo procesar la imagen subida'
    });
  }
};

// Middleware para eliminar imagen anterior
const deleteOldImage = async (oldImagePath) => {
  if (!oldImagePath) return;

  try {
    // Extraer solo el nombre del archivo de la URL
    const filename = path.basename(oldImagePath);
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/products';
    const fullPath = path.join(uploadPath, filename);

    await fs.access(fullPath);
    await fs.unlink(fullPath);
    console.log(`Imagen anterior eliminada: ${fullPath}`);
  } catch (error) {
    console.error('Error eliminando imagen anterior:', error);
    // No lanzar error, solo registrar
  }
};

// Middleware para limpiar archivos huérfanos
const cleanupOrphanedFiles = async () => {
  try {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/products';
    const files = await fs.readdir(uploadPath);
    
    // Aquí podrías implementar lógica para eliminar archivos
    // que no están referenciados en la base de datos
    console.log(`Encontrados ${files.length} archivos en ${uploadPath}`);
  } catch (error) {
    console.error('Error en limpieza de archivos:', error);
  }
};

// Exportar middlewares
module.exports = {
  // Middleware principal de carga
  uploadSingle: upload.single('imagen'),
  
  // Middleware de manejo de errores
  handleMulterError,
  
  // Middleware de validación
  validateImage,
  
  // Funciones utilitarias
  deleteOldImage,
  cleanupOrphanedFiles,
  
  // Middleware combinado para uso fácil
  uploadProductImage: [
    upload.single('imagen'),
    handleMulterError,
    validateImage
  ]
};