/**
 * Mock helper para simular la base de datos
 * Utiliza jest.fn() para crear funciones mock que pueden ser espiadas
 */

// Mock de executeQuery
const mockExecuteQuery = jest.fn();

// Datos mock para diferentes escenarios
const mockData = {
  users: [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: '$2a$12$hashedpassword',
      telefono: '123456789',
      direccion: 'Calle 123',
      fecha_registro: new Date('2024-01-01'),
      activo: true
    },
    {
      id: 2,
      nombre: 'María',
      apellido: 'González',
      email: 'maria@example.com',
      password: '$2a$12$hashedpassword',
      telefono: '987654321',
      direccion: 'Avenida 456',
      fecha_registro: new Date('2024-01-02'),
      activo: true
    }
  ],
  admins: [
    {
      id: 1,
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@repuestera.com',
      password: '$2a$12$hashedpassword',
      rol: 'super_admin',
      fecha_registro: new Date('2024-01-01'),
      ultimo_acceso: null,
      activo: true
    }
  ],
  products: [
    {
      id: 1,
      nombre: 'Filtro de Aceite',
      descripcion: 'Filtro de aceite universal',
      precio: 15.99,
      stock: 50,
      categoria_id: 1,
      codigo_producto: 'FO001',
      marca: 'Mann',
      modelo: 'Universal',
      año_desde: 2010,
      año_hasta: 2024,
      imagen: null,
      activo: true,
      fecha_creacion: new Date('2024-01-01'),
      fecha_actualizacion: new Date('2024-01-01')
    }
  ],
  categories: [
    {
      id: 1,
      nombre: 'Motor',
      descripcion: 'Repuestos para motor',
      activo: true,
      fecha_creacion: new Date('2024-01-01')
    }
  ]
};

// Helper para configurar respuestas mock
const setupMockResponse = (scenario) => {
  mockExecuteQuery.mockReset();
  
  switch (scenario) {
    case 'user_found':
      mockExecuteQuery.mockResolvedValue([mockData.users[0]]);
      break;
    case 'user_not_found':
      mockExecuteQuery.mockResolvedValue([]);
      break;
    case 'users_list':
      mockExecuteQuery.mockResolvedValue(mockData.users);
      break;
    case 'user_created':
      mockExecuteQuery
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([mockData.users[0]]);
      break;
    case 'admin_found':
      mockExecuteQuery.mockResolvedValue([mockData.admins[0]]);
      break;
    case 'admin_not_found':
      mockExecuteQuery.mockResolvedValue([]);
      break;
    case 'admin_created':
      mockExecuteQuery
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([mockData.admins[0]]);
      break;
    case 'product_found':
      mockExecuteQuery.mockResolvedValue([mockData.products[0]]);
      break;
    case 'category_found':
      mockExecuteQuery.mockResolvedValue([mockData.categories[0]]);
      break;
    case 'count':
      mockExecuteQuery.mockResolvedValue([{ total: 2 }]);
      break;
    case 'update_success':
      mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
      break;
    case 'database_error':
      mockExecuteQuery.mockRejectedValue(new Error('Database connection error'));
      break;
    default:
      mockExecuteQuery.mockResolvedValue([]);
  }
};

module.exports = {
  mockExecuteQuery,
  mockData,
  setupMockResponse
};

