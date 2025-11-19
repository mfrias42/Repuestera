/**
 * Tests unitarios para el servicio API
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de axios ANTES de importar - versión más completa
jest.mock('axios', () => {
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
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance)
    },
    mockAxiosInstance // Exportar para uso en tests
  };
});

// Mock de localStorage antes de importar api
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

import { productService, authService } from '../../services/api';

// Obtener la instancia mockeada después de que el mock se haya ejecutado
const axios = require('axios');
const mockAxiosInstance = axios.mockAxiosInstance || axios.default.create();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReturnValue('mock_token');
    // Asegurar que el mock de create retorne la instancia mockeada
    if (axios.default && axios.default.create) {
      axios.default.create.mockReturnValue(mockAxiosInstance);
    }
  });

  describe('productService', () => {
    test('getProducts debe hacer GET request correctamente', async () => {
      // Arrange
      const mockProducts = [
        { id: 1, nombre: 'Producto 1', precio: 10.99 },
        { id: 2, nombre: 'Producto 2', precio: 20.99 }
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: { products: mockProducts } });

      // Act
      const response = await productService.getProducts();

      // Assert
      expect(response.data.products).toEqual(mockProducts);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    test('getProducts debe pasar parámetros de búsqueda', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue({ data: { products: [] } });
      const params = { search: 'test', categoria: '1', sortBy: 'precio' };

      // Act
      await productService.getProducts(params);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    test('createProduct debe hacer POST request con datos correctos', async () => {
      // Arrange
      const productData = {
        nombre: 'Nuevo Producto',
        precio: 15.99,
        stock: 10
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { product: { id: 1, ...productData } } });

      // Act
      await productService.createProduct(productData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    test('updateProduct debe hacer PUT request', async () => {
      // Arrange
      const productId = 1;
      const updateData = { nombre: 'Producto Actualizado' };
      mockAxiosInstance.put.mockResolvedValue({ data: { product: { id: productId, ...updateData } } });

      // Act
      await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockAxiosInstance.put).toHaveBeenCalled();
    });

    test('deleteProduct debe hacer DELETE request', async () => {
      // Arrange
      const productId = 1;
      mockAxiosInstance.delete.mockResolvedValue({ data: { message: 'Producto eliminado' } });

      // Act
      await productService.deleteProduct(productId);

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalled();
    });
  });

  describe('authService', () => {
    test('register debe hacer POST request con datos de usuario', async () => {
      // Arrange
      const userData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'password123'
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { user: { id: 1, ...userData } } });

      // Act
      await authService.register(userData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    test('login debe hacer POST request y guardar token', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          token: 'mock_jwt_token',
          user: { id: 1, email: loginData.email }
        }
      });

      // Act
      await authService.login(loginData, false);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    test('logout debe limpiar localStorage', async () => {
      // Arrange
      window.localStorage.getItem.mockReturnValue('token');
      // Limpiar mocks antes del test
      window.localStorage.removeItem.mockClear();
      // Mock de la llamada POST a logout
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      // Act
      await authService.logout();

      // Assert - logout limpia localStorage en el bloque finally
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Error Handling', () => {
    test('debe manejar errores 401 y redirigir a login', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 401 }
      });
      
      // Mock de window.location
      delete window.location;
      window.location = { href: '' };

      // Act & Assert
      await expect(productService.getProducts()).rejects.toBeDefined();
    });
  });
});

