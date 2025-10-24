const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const { 
  verifyToken, 
  verifyAdmin, 
  requirePermission,
  requireSuperAdmin
} = require('../middleware/auth');

const router = express.Router();

// Función para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// ===== RUTAS DE USUARIOS =====

// GET /api/users - Obtener usuarios (solo administradores)
router.get('/',
  verifyToken,
  verifyAdmin,
  requirePermission('read_users'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede exceder 100 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search;

      let users, total;

      if (search) {
        users = await User.search(search, limit, offset);
        // Para el total en búsqueda, necesitaríamos implementar un método count en search
        total = users.length; // Simplificado
      } else {
        [users, total] = await Promise.all([
          User.findAll(limit, offset),
          User.count()
        ]);
      }

      const totalPages = Math.ceil(total / limit);

      res.json({
        users: users.map(user => user.toJSON()),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los usuarios'
      });
    }
  }
);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id',
  verifyToken,
  verifyAdmin,
  requirePermission('read_users'),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }

      res.json({
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el usuario'
      });
    }
  }
);

// PUT /api/users/:id - Actualizar usuario (solo super admin)
router.put('/:id',
  verifyToken,
  verifyAdmin,
  requireSuperAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('apellido').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
    body('telefono').optional().isMobilePhone('es-AR').withMessage('Debe proporcionar un número de teléfono válido'),
    body('direccion').optional().trim().isLength({ max: 500 }).withMessage('La dirección no puede exceder 500 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }

      const updatedUser = await user.update(req.body);

      res.json({
        message: 'Usuario actualizado exitosamente',
        user: updatedUser.toJSON()
      });

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el usuario'
      });
    }
  }
);

// DELETE /api/users/:id - Desactivar usuario (solo super admin)
router.delete('/:id',
  verifyToken,
  verifyAdmin,
  requireSuperAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }

      await user.deactivate();

      res.json({
        message: 'Usuario desactivado exitosamente',
        user_id: user.id
      });

    } catch (error) {
      console.error('Error desactivando usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo desactivar el usuario'
      });
    }
  }
);

// ===== RUTAS DE ADMINISTRADORES =====

// GET /api/users/admins - Obtener administradores (solo super admin)
router.get('/admins/list',
  verifyToken,
  verifyAdmin,
  requireSuperAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const [admins, total] = await Promise.all([
        Admin.findAll(limit, offset),
        Admin.count()
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        admins: admins.map(admin => admin.toJSON()),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Error obteniendo administradores:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los administradores'
      });
    }
  }
);

// POST /api/users/admins - Crear administrador (solo super admin)
router.post('/admins',
  verifyToken,
  verifyAdmin,
  requireSuperAdmin,
  [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('apellido').trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Debe proporcionar un email válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').optional().isIn(['admin', 'super_admin']).withMessage('El rol debe ser admin o super_admin')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      // Verificar si el email ya existe
      const [existingAdmin, existingUser] = await Promise.all([
        Admin.findByEmail(email),
        User.findByEmail(email)
      ]);

      if (existingAdmin || existingUser) {
        return res.status(409).json({
          error: 'Email ya registrado',
          message: 'Ya existe una cuenta con este email'
        });
      }

      const admin = await Admin.create(req.body);

      res.status(201).json({
        message: 'Administrador creado exitosamente',
        admin: admin.toJSON()
      });

    } catch (error) {
      console.error('Error creando administrador:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el administrador'
      });
    }
  }
);

// ===== RUTAS DE CATEGORÍAS =====

// GET /api/users/categories - Obtener categorías (público)
router.get('/categories', async (req, res) => {
  try {
    const includeProductCount = req.query.include_count !== 'false';
    const categories = await Category.findAll(includeProductCount);

    res.json({
      categories: categories.map(category => category.toJSON())
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las categorías'
    });
  }
});

// GET /api/users/categories/:id - Obtener categoría por ID
router.get('/categories/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          error: 'Categoría no encontrada',
          message: 'La categoría solicitada no existe'
        });
      }

      // Obtener estadísticas de la categoría
      const stats = await category.getStats();

      res.json({
        category: category.toJSON(),
        stats
      });

    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la categoría'
      });
    }
  }
);

// POST /api/users/categories - Crear categoría (solo administradores)
router.post('/categories',
  verifyToken,
  verifyAdmin,
  requirePermission('create_products'), // Usar el mismo permiso que productos
  [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Verificar si ya existe una categoría con ese nombre
      const existingCategory = await Category.findByName(req.body.nombre);
      if (existingCategory) {
        return res.status(409).json({
          error: 'Categoría duplicada',
          message: 'Ya existe una categoría con este nombre'
        });
      }

      const category = await Category.create(req.body);

      res.status(201).json({
        message: 'Categoría creada exitosamente',
        category: category.toJSON()
      });

    } catch (error) {
      console.error('Error creando categoría:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la categoría'
      });
    }
  }
);

// PUT /api/users/categories/:id - Actualizar categoría (solo administradores)
router.put('/categories/:id',
  verifyToken,
  verifyAdmin,
  requirePermission('update_products'),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido'),
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          error: 'Categoría no encontrada',
          message: 'La categoría solicitada no existe'
        });
      }

      // Verificar si el nuevo nombre ya existe (si se está cambiando)
      if (req.body.nombre && req.body.nombre !== category.nombre) {
        const existingCategory = await Category.findByName(req.body.nombre);
        if (existingCategory) {
          return res.status(409).json({
            error: 'Categoría duplicada',
            message: 'Ya existe una categoría con este nombre'
          });
        }
      }

      const updatedCategory = await category.update(req.body);

      res.json({
        message: 'Categoría actualizada exitosamente',
        category: updatedCategory.toJSON()
      });

    } catch (error) {
      console.error('Error actualizando categoría:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la categoría'
      });
    }
  }
);

// DELETE /api/users/categories/:id - Eliminar categoría (solo administradores)
router.delete('/categories/:id',
  verifyToken,
  verifyAdmin,
  requirePermission('delete_products'),
  [
    param('id').isInt({ min: 1 }).withMessage('El ID debe ser un número válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          error: 'Categoría no encontrada',
          message: 'La categoría solicitada no existe'
        });
      }

      // Verificar si se puede eliminar
      const canDelete = await category.canDelete();
      if (!canDelete) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'No se puede eliminar una categoría que tiene productos asociados'
        });
      }

      await category.deactivate();

      res.json({
        message: 'Categoría eliminada exitosamente',
        category_id: category.id
      });

    } catch (error) {
      console.error('Error eliminando categoría:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la categoría'
      });
    }
  }
);

module.exports = router;