import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    adminLogin: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn()
  }
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('debe inicializar con usuario no autenticado', async () => {
    authService.getMe.mockRejectedValue(new Error('No token'));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('debe autenticar usuario cuando hay token válido en localStorage', async () => {
    const userData = { id: 1, nombre: 'Juan', email: 'juan@test.com' };
    localStorage.setItem('token', 'valid_token');
    localStorage.setItem('user', JSON.stringify(userData));
    authService.getMe.mockResolvedValue({ data: userData });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(userData);
  });

  it('debe hacer logout cuando el token es inválido', async () => {
    const userData = { id: 1, nombre: 'Juan', email: 'juan@test.com' };
    localStorage.setItem('token', 'invalid_token');
    localStorage.setItem('user', JSON.stringify(userData));
    authService.getMe.mockRejectedValue(new Error('Invalid token'));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('debe hacer login correctamente', async () => {
    const credentials = { email: 'juan@test.com', password: 'password123' };
    const response = {
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      token: 'new_token'
    };
    authService.login.mockResolvedValue(response);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login(credentials);
    });
    
    expect(authService.login).toHaveBeenCalledWith(credentials);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(response.user);
  });

  it('debe hacer login de admin correctamente', async () => {
    const credentials = { email: 'admin@test.com', password: 'admin123' };
    const response = {
      admin: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' },
      token: 'admin_token'
    };
    authService.adminLogin.mockResolvedValue(response);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login(credentials, true);
    });
    
    expect(authService.adminLogin).toHaveBeenCalledWith(credentials);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(response.admin);
  });

  it('debe hacer register correctamente', async () => {
    const userData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      password: 'password123'
    };
    const response = {
      user: { id: 1, ...userData },
      token: 'new_token'
    };
    authService.register.mockResolvedValue(response);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.register(userData);
    });
    
    expect(authService.register).toHaveBeenCalledWith(userData);
  });

  it('debe hacer logout correctamente', async () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    authService.logout.mockResolvedValue();
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('debe identificar correctamente si el usuario es admin', async () => {
    const userData = { id: 1, nombre: 'Admin', rol: 'admin' };
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(userData));
    authService.getMe.mockResolvedValue({ data: userData });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAdmin()).toBe(true);
  });

  it('debe identificar correctamente si el usuario es super admin', async () => {
    const userData = { id: 1, nombre: 'Super Admin', rol: 'super_admin' };
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(userData));
    authService.getMe.mockResolvedValue({ data: userData });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isSuperAdmin()).toBe(true);
    expect(result.current.isAdmin()).toBe(true);
  });

  it('debe retornar false para isAdmin cuando el usuario no es admin', async () => {
    const userData = { id: 1, nombre: 'User', rol: 'user' };
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(userData));
    authService.getMe.mockResolvedValue({ data: userData });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAdmin()).toBe(false);
    expect(result.current.isSuperAdmin()).toBe(false);
  });
});

