/**
 * Helper para crear mocks de autenticación
 * Útil para tests que requieren usuarios autenticados
 */

const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT de prueba
 * @param {Object} payload - Datos del usuario/admin
 * @param {String} type - Tipo de token ('user' o 'admin')
 * @returns {String} Token JWT
 */
function generateTestToken(payload = {}, type = 'user') {
  const defaultPayload = {
    id: 1,
    email: 'test@example.com',
    type: type,
    ...payload
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';
  return jwt.sign(defaultPayload, secret, { expiresIn: '1h' });
}

/**
 * Crea un objeto de request mockeado con autenticación
 * @param {Object} userData - Datos del usuario
 * @param {String} type - Tipo de usuario ('user' o 'admin')
 * @returns {Object} Request mockeado
 */
function createAuthenticatedRequest(userData = {}, type = 'user') {
  const token = generateTestToken(userData, type);
  
  return {
    headers: {
      authorization: `Bearer ${token}`
    },
    user: {
      id: userData.id || 1,
      email: userData.email || 'test@example.com',
      type: type,
      ...userData
    },
    token: token
  };
}

/**
 * Crea un objeto de request mockeado sin autenticación
 * @returns {Object} Request mockeado
 */
function createUnauthenticatedRequest() {
  return {
    headers: {},
    user: null,
    token: null
  };
}

module.exports = {
  generateTestToken,
  createAuthenticatedRequest,
  createUnauthenticatedRequest
};

