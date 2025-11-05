/**
 * Helper para mockear middleware de autenticación en tests
 */

/**
 * Mockea el middleware verifyToken para permitir requests autenticados
 * @param {Object} userData - Datos del usuario para incluir en req.user
 * @returns {Function} Middleware mockeado
 */
function mockVerifyToken(userData = {}) {
  return (req, res, next) => {
    req.user = {
      id: userData.id || 1,
      email: userData.email || 'test@example.com',
      type: userData.type || 'user',
      ...userData
    };
    req.token = 'mockToken123';
    next();
  };
}

/**
 * Mockea el middleware verifyUser
 * @param {Object} userData - Datos del usuario
 * @returns {Function} Middleware mockeado
 */
function mockVerifyUser(userData = {}) {
  return (req, res, next) => {
    req.currentUser = {
      id: userData.id || 1,
      email: userData.email || 'test@example.com',
      nombre: userData.nombre || 'Test',
      apellido: userData.apellido || 'User',
      activo: userData.activo !== undefined ? userData.activo : true,
      ...userData
    };
    next();
  };
}

/**
 * Mockea el middleware verifyAdmin
 * @param {Object} adminData - Datos del administrador
 * @returns {Function} Middleware mockeado
 */
function mockVerifyAdmin(adminData = {}) {
  return (req, res, next) => {
    req.currentAdmin = {
      id: adminData.id || 1,
      email: adminData.email || 'admin@example.com',
      nombre: adminData.nombre || 'Admin',
      apellido: adminData.apellido || 'Test',
      rol: adminData.rol || 'admin',
      activo: adminData.activo !== undefined ? adminData.activo : true,
      canPerformAction: (action) => {
        const permissions = {
          'admin': ['read_products', 'create_products', 'update_products', 'delete_products', 'read_users'],
          'super_admin': ['read_products', 'create_products', 'update_products', 'delete_products',
                         'read_users', 'create_users', 'update_users', 'delete_users',
                         'read_admins', 'create_admins', 'update_admins', 'delete_admins']
        };
        return permissions[adminData.rol || 'admin']?.includes(action) || false;
      },
      isSuperAdmin: () => (adminData.rol || 'admin') === 'super_admin',
      ...adminData
    };
    next();
  };
}

/**
 * Mockea el middleware requirePermission
 * @param {String} permission - Permiso requerido
 * @returns {Function} Middleware mockeado
 */
function mockRequirePermission(permission) {
  return (req, res, next) => {
    if (req.currentAdmin && req.currentAdmin.canPerformAction(permission)) {
      return next();
    }
    return res.status(403).json({
      error: 'Permisos insuficientes',
      message: `No tiene permisos para realizar la acción: ${permission}`
    });
  };
}

/**
 * Mockea el middleware requireSuperAdmin
 * @returns {Function} Middleware mockeado
 */
function mockRequireSuperAdmin() {
  return (req, res, next) => {
    if (req.currentAdmin && req.currentAdmin.isSuperAdmin()) {
      return next();
    }
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de super administrador'
    });
  };
}

module.exports = {
  mockVerifyToken,
  mockVerifyUser,
  mockVerifyAdmin,
  mockRequirePermission,
  mockRequireSuperAdmin
};

