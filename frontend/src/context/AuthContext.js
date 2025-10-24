import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        
        // Verificar si el token sigue siendo válido
        try {
          await authService.getMe();
        } catch (error) {
          // Token inválido, limpiar datos
          logout();
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, isAdmin = false) => {
    try {
      const response = isAdmin 
        ? await authService.adminLogin(credentials)
        : await authService.login(credentials);
      
      setUser(response.user || response.admin);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 AuthContext: Iniciando registro con datos:', userData);
      const response = await authService.register(userData);
      console.log('✅ AuthContext: Registro exitoso:', response);
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Error en registro:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const isAdmin = () => {
    return user && (user.rol === 'admin' || user.rol === 'super_admin');
  };

  const isSuperAdmin = () => {
    return user && user.rol === 'super_admin';
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isSuperAdmin,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
