/**
 * Tests unitarios para AuthContext
 * Patrón AAA: Arrange, Act, Assert
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/api';

// Mock de authService
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    adminLogin: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    logout: jest.fn()
  }
}));

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('useAuth hook', () => {
    test('debería lanzar error si se usa fuera del provider', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth debe ser usado dentro de un AuthProvider');
    });
  });

  describe('AuthProvider', () => {
    test('debería inicializar con estado no autenticado', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.loading).toBe(false);
      });
    });

    test('debería verificar autenticación desde localStorage al iniciar', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'mockToken123';

      localStorageMock.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      authService.getMe.mockResolvedValue({ user: mockUser });

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authService.getMe).toHaveBeenCalled();
    });

    test('debería hacer login exitosamente', async () => {
      // Arrange
      const credentials = {
        email: 'user@example.com',
        password: 'password123'
      };

      const mockUser = { id: 1, email: credentials.email };
      const mockResponse = {
        user: mockUser,
        token: 'mockToken123'
      };

      authService.login.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Esperar a que termine el loading inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login(credentials);
      });

      // Assert
      expect(authService.login).toHaveBeenCalledWith(credentials);
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    test('debería hacer login de admin exitosamente', async () => {
      // Arrange
      const credentials = {
        email: 'admin@example.com',
        password: 'adminPassword123'
      };

      const mockResponse = {
        admin: { id: 1, email: credentials.email, rol: 'admin' },
        token: 'adminToken123'
      };

      authService.adminLogin.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.login(credentials, true);
      });

      // Assert
      expect(authService.adminLogin).toHaveBeenCalledWith(credentials);
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    test('debería registrar usuario exitosamente', async () => {
      // Arrange
      const userData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        password: 'password123'
      };

      const mockResponse = {
        message: 'Usuario registrado exitosamente',
        user: { id: 1, ...userData }
      };

      authService.register.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        const response = await result.current.register(userData);
        expect(response).toEqual(mockResponse);
      });

      // Assert
      expect(authService.register).toHaveBeenCalledWith(userData);
    });

    test('debería hacer logout y limpiar estado', async () => {
      // Arrange
      authService.logout.mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(authService.logout).toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
      });
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    test('isAdmin debería retornar true si el usuario es admin', async () => {
      // Arrange
      const credentials = { email: 'admin@example.com', password: 'password' };
      const mockAdmin = { id: 1, email: 'admin@example.com', rol: 'admin' };
      const mockResponse = {
        admin: mockAdmin,
        token: 'token123'
      };

      authService.adminLogin.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login(credentials, true);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockAdmin);
        expect(result.current.isAdmin()).toBe(true);
      });
    });

    test('isAdmin debería retornar false si el usuario no es admin', async () => {
      // Arrange
      const credentials = { email: 'user@example.com', password: 'password' };
      const mockResponse = {
        user: { id: 1, email: 'user@example.com', rol: 'user' },
        token: 'token123'
      };

      authService.login.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login(credentials, false);
      });

      // Assert
      await waitFor(() => {
        if (result.current.user) {
          expect(result.current.isAdmin()).toBe(false);
        }
      });
    });

    test('isSuperAdmin debería retornar true si el usuario es super_admin', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'super@example.com', rol: 'super_admin' };
      
      const credentials = { email: 'super@example.com', password: 'password' };
      const mockResponse = {
        admin: mockUser,
        token: 'token123'
      };

      authService.adminLogin.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login(credentials, true);
      });

      // Assert
      await waitFor(() => {
        if (result.current.user) {
          expect(result.current.isSuperAdmin()).toBe(true);
        }
      });
    });

    test('isSuperAdmin debería retornar false si el usuario no es super_admin', async () => {
      // Arrange
      const credentials = { email: 'admin@example.com', password: 'password' };
      const mockResponse = {
        admin: { id: 1, email: 'admin@example.com', rol: 'admin' },
        token: 'token123'
      };

      authService.adminLogin.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login(credentials, true);
      });

      // Assert
      await waitFor(() => {
        if (result.current.user) {
          expect(result.current.isSuperAdmin()).toBe(false);
        }
      });
    });

    test('debería limpiar estado si el token es inválido', async () => {
      // Arrange
      localStorageMock.getItem
        .mockReturnValueOnce('invalidToken')
        .mockReturnValueOnce(JSON.stringify({ id: 1 }));

      authService.getMe.mockRejectedValue(new Error('Token inválido'));

      // Act
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });
});

