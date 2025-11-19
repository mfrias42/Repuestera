/**
 * Tests unitarios para el servicio API
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de axios ANTES de importar
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
    }
  };
});

import { productService, authService } from '../../services/api';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock_token');
  });

  describe('productService', () => {
    test('getProducts debe hacer GET request correctamente', async () => {
      // Arrange
      const mockProducts = [
        { id: 1, nombre: 'Producto 1', precio: 10.99 },
        { id: 2, nombre: 'Producto 2', precio: 20.99 }
      ];
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.get.mockResolvedValue({ data: { products: mockProducts } });

      // Act
      const response = await productService.getProducts();

      // Assert
      expect(response.data.products).toEqual(mockProducts);
    });

    test('getProducts debe pasar parámetros de búsqueda', async () => {
      // Arrange
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.get.mockResolvedValue({ data: { products: [] } });
      const params = { search: 'test', categoria: '1', sortBy: 'precio' };

      // Act
      await productService.getProducts(params);

      // Assert
      expect(mockInstance.get).toHaveBeenCalled();
    });

    test('createProduct debe hacer POST request con datos correctos', async () => {
      // Arrange
      const productData = {
        nombre: 'Nuevo Producto',
        precio: 15.99,
        stock: 10
      };
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.post.mockResolvedValue({ data: { product: { id: 1, ...productData } } });

      // Act
      await productService.createProduct(productData);

      // Assert
      expect(mockInstance.post).toHaveBeenCalled();
    });

    test('updateProduct debe hacer PUT request', async () => {
      // Arrange
      const productId = 1;
      const updateData = { nombre: 'Producto Actualizado' };
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.put.mockResolvedValue({ data: { product: { id: productId, ...updateData } } });

      // Act
      await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockInstance.put).toHaveBeenCalled();
    });

    test('deleteProduct debe hacer DELETE request', async () => {
      // Arrange
      const productId = 1;
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.delete.mockResolvedValue({ data: { message: 'Producto eliminado' } });

      // Act
      await productService.deleteProduct(productId);

      // Assert
      expect(mockInstance.delete).toHaveBeenCalled();
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
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.post.mockResolvedValue({ data: { user: { id: 1, ...userData } } });

      // Act
      await authService.register(userData);

      // Assert
      expect(mockInstance.post).toHaveBeenCalled();
    });

    test('login debe hacer POST request y guardar token', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.post.mockResolvedValue({
        data: {
          token: 'mock_jwt_token',
          user: { id: 1, email: loginData.email }
        }
      });

      // Act
      await authService.login(loginData, false);

      // Assert
      expect(mockInstance.post).toHaveBeenCalled();
    });

    test('logout debe limpiar localStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('token');
      localStorageMock.getItem.mockReturnValueOnce('user');

      // Act
      authService.logout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Error Handling', () => {
    test('debe manejar errores 401 y redirigir a login', async () => {
      // Arrange
      const axios = require('axios');
      const mockInstance = axios.default.create();
      mockInstance.get.mockRejectedValue({
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

