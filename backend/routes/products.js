const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { 
  verifyToken, 
  verifyAdmin, 
  requirePermission,
  optionalAuth
} = require('../middleware/auth');
const { uploadProductImage, deleteOldImage } = require('../middleware/upload');
const { handleValidationErrors, validatePagination, validateNumericId, asyncHandler } = require('../middleware/validation');

const router = express.Router();

// Validaciones para productos
const productValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('precio')
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser un número mayor a 0'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La categoría debe ser un ID válido'),
  body('codigo_producto')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El código de producto no puede exceder 50 caracteres'),
  body('marca')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La marca no puede exceder 100 caracteres'),
  body('modelo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El modelo no puede exceder 100 caracteres'),
  body('año_desde')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('El año desde debe ser válido'),
  body('año_hasta')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('El año hasta debe ser válido')
];

// GET /api/products - Obtener productos con filtros y paginación
router.get('/', 
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
    query('categoria_id').optional().isInt({ min: 1 }).withMessage('La categoría debe ser un ID válido'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres'),
    query('min_price').optional().isFloat({ min: 0 }).withMessage('El precio mínimo debe ser mayor o igual a 0'),
    query('max_price').optional().isFloat({ min: 0 }).withMessage('El precio máximo debe ser mayor o igual a 0'),
    query('in_stock').optional().isBoolean().withMessage('in_stock debe ser true o false'),
    query('order_by').optional().isIn(['nombre', 'precio', 'stock', 'fecha_creacion']).withMessage('Ordenamiento inválido'),
    query('order_direction').optional().isIn(['ASC', 'DESC']).withMessage('Dirección de ordenamiento inválida')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📦 Solicitud de productos recibida:', {
        query: req.query,
        headers: req.headers.origin || 'Sin origin'
      });

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const options = {
        limit,
        offset,
        categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : null,
        search: req.query.search || null,
        orderBy: req.query.order_by || 'fecha_creacion',
        orderDirection: req.query.order_direction || 'DESC',
        minPrice: req.query.min_price ? parseFloat(req.query.min_price) : null,
        maxPrice: req.query.max_price ? parseFloat(req.query.max_price) : null,
        inStock: req.query.in_stock !== undefined ? req.query.in_stock === 'true' : null
      };

      console.log('📦 Opciones de búsqueda:', options);

      const [products, total] = await Promise.all([
        Product.findAll(options),
        Product.count(options)
      ]);

      console.log(`📦 Productos encontrados: ${products.length} de ${total} total`);

      const totalPages = Math.ceil(total / limit);

      const response = {
        products: products.map(product => product.toJSON()),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        filters: {
          categoria_id: options.categoria_id,
          search: options.search,
          min_price: options.minPrice,
          max_price: options.maxPrice,
          in_stock: options.inStock,
          order_by: options.orderBy,
          order_direction: options.orderDirection
        }
      };
      res.json(response);

    } catch (error) {
      console.error('❌ Error detallado obteniendo productos:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
        query: req.query,
        origin: req.headers.origin
      });
      
      // Errores específicos de base de datos
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist") || error.message.includes("Unknown table")) {
        return res.status(500).json({
          error: 'Base de datos no inicializada',
          message: 'Las tablas de la base de datos no existen. El servidor intentará inicializarlas automáticamente.',
          details: 'Por favor, espere unos segundos y recargue la página. Si el problema persiste, verifique los logs del servidor.'
        });
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(500).json({
          error: 'Error de conexión a la base de datos',
          message: 'No se pudo conectar a la base de datos. Verifique la configuración de conexión.',
          details: error.message
        });
      }
      
      if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 1045) {
        return res.status(500).json({
          error: 'Error de autenticación',
          message: 'Las credenciales de la base de datos son incorrectas.',
          details: 'Verifique DB_USER y DB_PASSWORD en las variables de entorno.'
        });
      }
      
      if (error.code === 'ER_BAD_DB_ERROR' || error.code === 1049) {
        return res.status(500).json({
          error: 'Base de datos no encontrada',
          message: 'La base de datos especificada no existe.',
          details: `Verifique que la base de datos '${process.env.DB_NAME || 'repuestera_db'}' exista en el servidor.`
        });
      }
      
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        errorCode: error.code || 'UNKNOWN'
      });
    }
  }
);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id',
  optionalAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto solicitado no existe'
        });
      }

      // Obtener productos relacionados
      const relatedProducts = await product.getRelatedProducts(4);

      res.json({
        product: product.toJSON(),
        related_products: relatedProducts.map(p => p.toJSON())
      });

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el producto'
      });
    }
  }
);

// POST /api/products - Crear nuevo producto (solo administradores)
router.post('/',
  verifyToken,
  verifyAdmin,
  requirePermission('create_products'),
  uploadProductImage,
  productValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log('📦 POST /api/products - Crear producto');
      console.log('📦 Body recibido:', req.body);
      console.log('📦 File recibido:', req.file);
      console.log('📦 Admin ID:', req.currentAdmin?.id);
      console.log('📦 Admin Rol:', req.currentAdmin?.rol);

      // Verificar que la categoría existe si se proporciona
      if (req.body.categoria_id) {
        const category = await Category.findById(req.body.categoria_id);
        if (!category) {
          console.error('❌ Categoría no encontrada:', req.body.categoria_id);
          return res.status(400).json({
            error: 'Categoría inválida',
            message: 'La categoría especificada no existe'
          });
        }
      }

      // Verificar que el código de producto no existe si se proporciona
      if (req.body.codigo_producto) {
        const existingProduct = await Product.findByCode(req.body.codigo_producto);
        if (existingProduct) {
          console.error('❌ Código de producto duplicado:', req.body.codigo_producto);
          return res.status(409).json({
            error: 'Código duplicado',
            message: 'Ya existe un producto con este código'
          });
        }
      }

      // Validar años
      if (req.body.año_desde && req.body.año_hasta && req.body.año_desde > req.body.año_hasta) {
        console.error('❌ Años inválidos:', req.body.año_desde, '>', req.body.año_hasta);
        return res.status(400).json({
          error: 'Años inválidos',
          message: 'El año desde no puede ser mayor al año hasta'
        });
      }

      // Agregar la URL de la imagen si se subió una
      const productData = { ...req.body };
      if (req.file) {
        productData.imagen = req.file.url;
        console.log('📦 Imagen subida:', req.file.url);
      }

      console.log('📦 Datos del producto a crear:', productData);
      const product = await Product.create(productData);
      console.log('✅ Producto creado exitosamente:', product.id);

      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: product.toJSON()
      });

    } catch (error) {
      console.error('❌ Error detallado creando producto:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        stack: error.stack,
        body: req.body
      });
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'Código duplicado',
          message: 'Ya existe un producto con este código'
        });
      }

      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'Base de datos no inicializada',
          message: 'Las tablas de la base de datos no existen. Por favor, ejecute el script de inicialización.'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo crear el producto',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// PUT /api/products/:id - Actualizar producto (solo administradores)
router.put('/:id',
  verifyToken,
  verifyAdmin,
  requirePermission('update_products'),
  uploadProductImage, // Middleware para manejar nueva imagen
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    ...productValidation
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      console.log('✏️ PUT /api/products/:id - Actualizar producto');
      console.log('✏️ Product ID:', req.params.id);
      console.log('✏️ Body recibido:', req.body);
      console.log('✏️ File recibido:', req.file);
      console.log('✏️ Admin ID:', req.currentAdmin?.id);
      console.log('✏️ Admin Rol:', req.currentAdmin?.rol);

      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto solicitado no existe'
        });
      }

      // Verificar que la categoría existe si se proporciona
      if (req.body.categoria_id) {
        const category = await Category.findById(req.body.categoria_id);
        if (!category) {
          return res.status(400).json({
            error: 'Categoría inválida',
            message: 'La categoría especificada no existe'
          });
        }
      }

      // Verificar que el código de producto no existe si se cambia
      if (req.body.codigo_producto && req.body.codigo_producto !== product.codigo_producto) {
        const existingProduct = await Product.findByCode(req.body.codigo_producto);
        if (existingProduct) {
          return res.status(409).json({
            error: 'Código duplicado',
            message: 'Ya existe un producto con este código'
          });
        }
      }

      // Validar años
      const añoDesde = req.body.año_desde !== undefined ? req.body.año_desde : product.año_desde;
      const añoHasta = req.body.año_hasta !== undefined ? req.body.año_hasta : product.año_hasta;
      
      if (añoDesde && añoHasta && añoDesde > añoHasta) {
        return res.status(400).json({
          error: 'Años inválidos',
          message: 'El año desde no puede ser mayor al año hasta'
        });
      }

      // Preparar datos de actualización
      const updateData = { ...req.body };
      
      // Si se subió una nueva imagen
      if (req.file) {
        // Eliminar imagen anterior si existe
        if (product.imagen) {
          await deleteOldImage(product.imagen);
        }
        updateData.imagen = req.file.url;
      }

      console.log('✏️ Datos del producto a actualizar:', updateData);
      const updatedProduct = await product.update(updateData);
      console.log('✅ Producto actualizado exitosamente:', updatedProduct.id);

      res.json({
        message: 'Producto actualizado exitosamente',
        product: updatedProduct.toJSON()
      });

    } catch (error) {
      console.error('❌ Error detallado actualizando producto:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        stack: error.stack,
        body: req.body,
        productId: req.params.id
      });
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'Código duplicado',
          message: 'Ya existe un producto con este código'
        });
      }

      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'Base de datos no inicializada',
          message: 'Las tablas de la base de datos no existen. Por favor, ejecute el script de inicialización.'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo actualizar el producto',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// PATCH /api/products/:id/stock - Actualizar solo el stock
router.patch('/:id/stock',
  verifyToken,
  verifyAdmin,
  requirePermission('update_products'),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto solicitado no existe'
        });
      }

      await product.updateStock(req.body.stock);

      res.json({
        message: 'Stock actualizado exitosamente',
        product: {
          id: product.id,
          nombre: product.nombre,
          stock: product.stock,
          fecha_actualizacion: product.fecha_actualizacion
        }
      });

    } catch (error) {
      console.error('Error actualizando stock:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el stock'
      });
    }
  }
);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id',
  verifyToken,
  verifyAdmin,
  requirePermission('delete_products'),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('🗑️ DELETE /api/products/:id - Eliminar producto');
      console.log('🗑️ Product ID:', req.params.id);
      console.log('🗑️ Admin ID:', req.currentAdmin?.id);
      console.log('🗑️ Admin Rol:', req.currentAdmin?.rol);

      const product = await Product.findById(req.params.id);
      
      if (!product) {
        console.error('❌ Producto no encontrado:', req.params.id);
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto solicitado no existe'
        });
      }

      await product.deactivate();
      console.log('✅ Producto eliminado exitosamente:', product.id);

      res.json({
        message: 'Producto eliminado exitosamente',
        product_id: product.id
      });

    } catch (error) {
      console.error('❌ Error detallado eliminando producto:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        stack: error.stack,
        productId: req.params.id
      });
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'Base de datos no inicializada',
          message: 'Las tablas de la base de datos no existen. Por favor, ejecute el script de inicialización.'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo eliminar el producto',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// GET /api/products/reports/low-stock - Productos con stock bajo
router.get('/reports/low-stock',
  verifyToken,
  verifyAdmin,
  requirePermission('read_products'),
  [
    query('threshold').optional().isInt({ min: 1, max: 50 }).withMessage('El umbral debe estar entre 1 y 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold) || 5;
      const products = await Product.getLowStockProducts(threshold);

      res.json({
        message: `Productos con stock menor o igual a ${threshold}`,
        threshold,
        count: products.length,
        products: products.map(product => product.toJSON())
      });

    } catch (error) {
      console.error('Error obteniendo productos con stock bajo:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos con stock bajo'
      });
    }
  }
);

// GET /api/products/reports/out-of-stock - Productos sin stock
router.get('/reports/out-of-stock',
  verifyToken,
  verifyAdmin,
  requirePermission('read_products'),
  async (req, res) => {
    try {
      const products = await Product.getOutOfStockProducts();

      res.json({
        message: 'Productos sin stock',
        count: products.length,
        products: products.map(product => product.toJSON())
      });

    } catch (error) {
      console.error('Error obteniendo productos sin stock:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos sin stock'
      });
    }
  }
);

module.exports = router;