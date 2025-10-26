const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { 
  generateUserToken, 
  generateAdminToken, 
  verifyToken, 
  verifyUser, 
  verifyAdmin 
} = require('../middleware/auth');

const router = express.Router();

// Validaciones comunes
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono')
    .optional({ checkFalsy: true })
    .isMobilePhone('es-AR')
    .withMessage('Debe proporcionar un número de teléfono válido'),
  body('direccion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La dirección no puede exceder 500 caracteres')
];

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

// POST /api/auth/register - Registro de usuarios
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('📝 Iniciando registro de usuario:', req.body);
    const { email } = req.body;

    // Verificar si el email ya existe
    console.log('🔍 Verificando si el email ya existe:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Email ya registrado:', email);
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Verificar si el email existe en administradores
    console.log('🔍 Verificando si el email existe en administradores:', email);
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      console.log('❌ Email existe en administradores:', email);
      return res.status(409).json({
        error: 'Email no disponible',
        message: 'Este email no está disponible para registro'
      });
    }

    // Crear nuevo usuario
    console.log('👤 Creando nuevo usuario...');
    const user = await User.create(req.body);
    console.log('✅ Usuario creado exitosamente:', user.id);
    
    // Generar token
    console.log('🔑 Generando token...');
    const token = generateUserToken(user);

    console.log('✅ Registro completado exitosamente');
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: user.toJSON(),
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro'
    });
  }
});

// POST /api/auth/login - Login de usuarios
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = generateUserToken(user);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: user.toJSON(),
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// POST /api/auth/admin/login - Login de administradores
router.post('/admin/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Intento de login admin: ${email}`);

    // Buscar administrador
    console.log('📋 Buscando administrador en la base de datos...');
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      console.log(`❌ Admin no encontrado: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    console.log(`✅ Admin encontrado: ${admin.email}, ID: ${admin.id}, Activo: ${admin.activo}`);

    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    const isValidPassword = await admin.verifyPassword(password);
    console.log(`🔑 Resultado verificación contraseña: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Actualizar último acceso
    console.log('📅 Actualizando último acceso...');
    await admin.updateLastAccess();
    console.log('✅ Último acceso actualizado');

    // Generar token
    console.log('🎫 Generando token...');
    const token = generateAdminToken(admin);
    console.log('✅ Token generado exitosamente');

    console.log(`✅ Login admin exitoso: ${email}`);
    res.json({
      message: 'Inicio de sesión administrativo exitoso',
      admin: admin.toJSON(),
      token,
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('❌ Error detallado en login admin:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar el inicio de sesión'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (req.user.type === 'user') {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario asociado al token no existe'
        });
      }
      
      res.json({
        type: 'user',
        data: user.toJSON()
      });
    } else if (req.user.type === 'admin') {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({
          error: 'Administrador no encontrado',
          message: 'El administrador asociado al token no existe'
        });
      }
      
      res.json({
        type: 'admin',
        data: admin.toJSON()
      });
    } else {
      return res.status(400).json({
        error: 'Tipo de usuario inválido',
        message: 'El token contiene un tipo de usuario no válido'
      });
    }

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información del perfil'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil de usuario
router.put('/profile', verifyToken, verifyUser, async (req, res) => {
  try {
    const allowedFields = ['nombre', 'apellido', 'telefono', 'direccion'];
    const updateData = {};
    
    // Filtrar solo campos permitidos
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'No se proporcionaron campos válidos para actualizar'
      });
    }

    const updatedUser = await req.currentUser.update(updateData);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el perfil'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', 
  verifyToken,
  [
    body('currentPassword')
      .isLength({ min: 6 })
      .withMessage('Debe proporcionar la contraseña actual'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        return true;
      })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (req.user.type === 'user') {
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({
            error: 'Usuario no encontrado'
          });
        }
        
        await user.changePassword(currentPassword, newPassword);
      } else if (req.user.type === 'admin') {
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
          return res.status(404).json({
            error: 'Administrador no encontrado'
          });
        }
        
        await admin.changePassword(currentPassword, newPassword);
      }

      res.json({
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      if (error.message === 'Password actual incorrecto') {
        return res.status(400).json({
          error: 'Contraseña incorrecta',
          message: 'La contraseña actual es incorrecta'
        });
      }

      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo cambiar la contraseña'
      });
    }
  }
);

// POST /api/auth/logout - Cerrar sesión (placeholder para invalidar token en el cliente)
router.post('/logout', verifyToken, (req, res) => {
  // En una implementación más robusta, aquí podrías invalidar el token
  // agregándolo a una lista negra en Redis o base de datos
  res.json({
    message: 'Sesión cerrada exitosamente'
  });
});

// GET /api/auth/verify - Verificar si el token es válido
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      type: req.user.type
    }
  });
});

// Endpoint temporal para crear administrador (solo para debugging)
router.post('/create-admin-temp', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Verificar si ya existe el administrador
    const existingAdmin = await Admin.findByEmail('admin@repuestera.com');
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'El administrador ya existe',
        admin: { email: existingAdmin.email }
      });
    }

    // Crear el administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminData = {
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@repuestera.com',
      password: hashedPassword
    };

    const adminId = await Admin.create(adminData);
    
    res.json({
      success: true,
      message: 'Administrador creado exitosamente',
      adminId: adminId
    });
  } catch (error) {
    console.error('Error creando administrador:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint temporal para debug de base de datos
router.get('/debug-db', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database-sqlite');
    
    // Verificar si la tabla administradores existe
    const tableCheck = await executeQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='administradores'
    `);
    
    // Obtener todos los administradores
    const admins = await executeQuery('SELECT * FROM administradores');
    
    res.json({
      success: true,
      tableExists: tableCheck.length > 0,
      adminsCount: admins.length,
      admins: admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        activo: admin.activo
      }))
    });

  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint temporal para verificar y corregir contraseña del admin
router.post('/fix-admin-password', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database-sqlite');
    const bcrypt = require('bcryptjs');
    
    // Buscar el administrador
    const admin = await Admin.findByEmail('admin@repuestera.com');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    // Verificar si la contraseña actual funciona
    const currentPasswordWorks = await admin.verifyPassword('admin123');
    
    if (currentPasswordWorks) {
      return res.json({
        success: true,
        message: 'La contraseña ya funciona correctamente',
        passwordFixed: false
      });
    }

    // Si no funciona, actualizar la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await executeQuery(
      'UPDATE administradores SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@repuestera.com']
    );

    res.json({
      success: true,
      message: 'Contraseña del administrador actualizada',
      passwordFixed: true
    });

  } catch (error) {
    console.error('Error corrigiendo contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;