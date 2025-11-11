import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  // Registro de usuario
  register: async (userData) => {
    console.log('🌐 API Service: Enviando petición de registro a:', `${API_BASE_URL}/auth/register`);
    console.log('📤 API Service: Datos a enviar:', userData);
    try {
      const response = await api.post('/auth/register', userData);
      console.log('✅ API Service: Respuesta exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Service: Error en petición:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Login de usuario
  login: async (credentials) => {
    console.log('🌐 [API] Enviando petición de login:', { email: credentials.email });
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ [API] Login response:', response.status, response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ [API] Token guardado en localStorage');
      }
      return response.data;
    } catch (error) {
      console.error('❌ [API] Error en login:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Login de administrador
  adminLogin: async (credentials) => {
    console.log('🌐 [API] Enviando petición de admin login:', { email: credentials.email });
    try {
      const response = await api.post('/auth/admin/login', credentials);
      console.log('✅ [API] Admin login response:', response.status, response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.admin));
        console.log('✅ [API] Admin token guardado en localStorage');
      }
      return response.data;
    } catch (error) {
      console.error('❌ [API] Error en admin login:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Obtener información del usuario autenticado
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

// Servicios de productos
export const productService = {
  // Obtener todos los productos
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response;
  },

  // Obtener producto por ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response;
  },

  // Crear producto (admin)
  createProduct: async (productData) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Actualizar producto (admin)
  updateProduct: async (id, productData) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Eliminar producto (admin)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export default api;

// Servicios para categorías
export const categoryService = {
  getCategories: () => api.get('/users/categories'),
  createCategory: (data) => api.post('/users/categories', data),
  updateCategory: (id, data) => api.put(`/users/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/users/categories/${id}`)
};

// Servicios para usuarios
export const userService = {
  getUsers: () => api.get('/users'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Servicios para administradores
export const adminService = {
  getAdmins: () => api.get('/users/admins/list'),
  createAdmin: (data) => api.post('/users/admins', data),
  updateAdmin: (id, data) => api.put(`/users/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/users/admins/${id}`)
};
