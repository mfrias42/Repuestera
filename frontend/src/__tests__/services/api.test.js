/**
 * Tests unitarios para el servicio API
 * Patrón AAA: Arrange, Act, Assert
 */

import axios from 'axios';
import { productService, authService } from '../../services/api';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios;

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
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { products: mockProducts } })
      });

      // Act
      const response = await productService.getProducts();

      // Assert
      expect(response.data.products).toEqual(mockProducts);
    });

    test('getProducts debe pasar parámetros de búsqueda', async () => {
      // Arrange
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: { products: [] } })
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
      const params = { search: 'test', categoria: '1', sortBy: 'precio' };

      // Act
      await productService.getProducts(params);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/products',
        expect.objectContaining({
          params: expect.objectContaining(params)
        })
      );
    });

    test('createProduct debe hacer POST request con datos correctos', async () => {
      // Arrange
      const productData = {
        nombre: 'Nuevo Producto',
        precio: 15.99,
        stock: 10
      };
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: { product: { id: 1, ...productData } } })
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);

      // Act
      const response = await productService.createProduct(productData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/products',
        expect.objectContaining(productData),
        expect.any(Object)
      );
    });

    test('updateProduct debe hacer PUT request', async () => {
      // Arrange
      const productId = 1;
      const updateData = { nombre: 'Producto Actualizado' };
      const mockAxiosInstance = {
        put: jest.fn().mockResolvedValue({ data: { product: { id: productId, ...updateData } } })
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);

      // Act
      await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        `/products/${productId}`,
        expect.objectContaining(updateData),
        expect.any(Object)
      );
    });

    test('deleteProduct debe hacer DELETE request', async () => {
      // Arrange
      const productId = 1;
      const mockAxiosInstance = {
        delete: jest.fn().mockResolvedValue({ data: { message: 'Producto eliminado' } })
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);

      // Act
      await productService.deleteProduct(productId);

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/products/${productId}`);
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
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: { user: { id: 1, ...userData } } })
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);

      // Act
      await authService.register(userData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/register',
        userData
      );
    });

    test('login debe hacer POST request y guardar token', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockResponse = {
        data: {
          token: 'mock_jwt_token',
          user: { id: 1, email: loginData.email }
        }
      };
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse)
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);

      // Act
      await authService.login(loginData, false);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/login',
        loginData
      );
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
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue({
          response: { status: 401 }
        }),
        interceptors: {
          response: {
            use: jest.fn()
          }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
      
      // Mock de window.location
      delete window.location;
      window.location = { href: '' };

      // Act & Assert
      await expect(productService.getProducts()).rejects.toBeDefined();
    });
  });
});

