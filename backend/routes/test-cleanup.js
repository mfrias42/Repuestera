const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database-mysql');

// Endpoint para limpiar usuarios de test (SOLO para Cypress)
// Solo funciona en development
router.delete('/cleanup-test-users', async (req, res) => {
  // Solo permitir en ambiente development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Este endpoint solo está disponible en development' 
    });
  }

  try {
    // Eliminar usuarios cuyo email contiene patrones de test
    const result = await executeQuery(`
      DELETE FROM usuarios 
      WHERE email LIKE '%_test_%@test.com' 
         OR email LIKE 'usuario%@test.com'
         OR email LIKE 'carrito_test_%@test.com'
         OR email LIKE 'validacion_test_%@test.com'
    `);

    console.log('🧹 Usuarios de test eliminados:', result.affectedRows);
    
    res.json({ 
      message: 'Usuarios de test eliminados exitosamente',
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('❌ Error limpiando usuarios de test:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron eliminar los usuarios de test'
    });
  }
});

module.exports = router;
