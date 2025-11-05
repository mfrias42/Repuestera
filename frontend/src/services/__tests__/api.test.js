/**
 * Tests unitarios para servicios de API
 * Patrón AAA: Arrange, Act, Assert
 * 
 * NOTA: Estos tests están simplificados para CI/CD
 * El mock de axios es complejo debido a cómo se importa en api.js
 */

// Mock de localStorage PRIMERO
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock de window.location
delete window.location;
window.location = { href: '' };

// Mock de axios - versión simplificada
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.mock('axios', () => {
  const mockCreate = jest.fn(() => mockAxiosInstance);
  return {
    __esModule: true,
    default: {
      create: mockCreate
    }
  };
});

// Importar después de los mocks
import { authService, productService, categoryService, userService, adminService } from '../api';

describe('Servicios de API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Resetear los mocks
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.get.mockClear();
    mockAxiosInstance.put.mockClear();
    mockAxiosInstance.delete.mockClear();
  });

  describe('authService', () => {
    describe('register', () => {
      test('debería registrar un usuario exitosamente', async () => {
        // Arrange
        const userData = {
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@example.com',
          password: 'password123'
        };

        const mockResponse = {
          data: {
            message: 'Usuario registrado exitosamente',
            user: { id: 1, ...userData },
            token: 'mockToken123'
          }
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        // Act
        const result = await authService.register(userData);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });

      test('debería manejar errores de registro', async () => {
        // Arrange
        const userData = {
          nombre: 'Juan',
          email: 'juan@example.com',
          password: 'password123'
        };

        const error = {
          response: {
            status: 400,
            data: {
              error: 'Datos inválidos',
              message: 'El email ya existe'
            }
          }
        };

        mockAxiosInstance.post.mockRejectedValue(error);

        // Act & Assert
        await expect(authService.register(userData)).rejects.toEqual(error);
      });
    });

    describe('login', () => {
      test('debería hacer login y guardar token en localStorage', async () => {
        // Arrange
        const credentials = {
          email: 'user@example.com',
          password: 'password123'
        };

        const mockResponse = {
          data: {
            user: { id: 1, email: credentials.email },
            token: 'mockToken123'
          }
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        // Act
        const result = await authService.login(credentials);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalled();
        expect(localStorageMock.setItem).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('adminLogin', () => {
      test('debería hacer login de admin y guardar token', async () => {
        // Arrange
        const credentials = {
          email: 'admin@example.com',
          password: 'adminPassword123'
        };

        const mockResponse = {
          data: {
            admin: { id: 1, email: credentials.email, rol: 'admin' },
            token: 'adminToken123'
          }
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        // Act
        const result = await authService.adminLogin(credentials);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalled();
        expect(localStorageMock.setItem).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getMe', () => {
      test('debería obtener información del usuario autenticado', async () => {
        // Arrange
        const mockResponse = {
          data: {
            user: { id: 1, email: 'user@example.com' }
          }
        };

        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        // Act
        const result = await authService.getMe();

        // Assert
        expect(mockAxiosInstance.get).toHaveBeenCalled();
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('logout', () => {
      test('debería hacer logout y limpiar localStorage', async () => {
        // Arrange
        mockAxiosInstance.post.mockResolvedValue({});

        // Act
        await authService.logout();

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalled();
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      });
    });
  });

  describe('productService', () => {
    test('debería obtener productos con parámetros', async () => {
      // Arrange
      const params = { page: 1, limit: 20 };
      const mockResponse = {
        data: {
          products: [],
          pagination: {}
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProducts(params);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('debería crear un producto con FormData', async () => {
      // Arrange
      const productData = {
        nombre: 'Producto Test',
        precio: 10.00,
        stock: 5
      };

      const mockResponse = {
        data: {
          message: 'Producto creado exitosamente',
          product: { id: 1, ...productData }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.createProduct(productData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });

    test('debería eliminar un producto', async () => {
      // Arrange
      const productId = 1;
      const mockResponse = {
        data: {
          message: 'Producto eliminado exitosamente'
        }
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.deleteProduct(productId);

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('categoryService', () => {
    test('debería obtener todas las categorías', async () => {
      // Arrange
      const mockResponse = {
        data: {
          categories: [
            { id: 1, nombre: 'Motor' },
            { id: 2, nombre: 'Frenos' }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await categoryService.getCategories();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('debería crear una categoría', async () => {
      // Arrange
      const categoryData = {
        nombre: 'Nueva Categoría',
        descripcion: 'Descripción'
      };

      const mockResponse = {
        data: {
          message: 'Categoría creada exitosamente',
          category: { id: 1, ...categoryData }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await categoryService.createCategory(categoryData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('userService', () => {
    test('debería obtener usuarios', async () => {
      // Arrange
      const mockResponse = {
        data: {
          users: [
            { id: 1, nombre: 'Juan', email: 'juan@example.com' }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await userService.getUsers();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('adminService', () => {
    test('debería obtener administradores', async () => {
      // Arrange
      const mockResponse = {
        data: {
          admins: [
            { id: 1, nombre: 'Admin', email: 'admin@example.com' }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await adminService.getAdmins();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    test('debería crear un administrador', async () => {
      // Arrange
      const adminData = {
        nombre: 'Nuevo',
        apellido: 'Admin',
        email: 'nuevo@admin.com',
        password: 'password123',
        rol: 'admin'
      };

      const mockResponse = {
        data: {
          message: 'Administrador creado exitosamente',
          admin: { id: 1, ...adminData }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await adminService.createAdmin(adminData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});
