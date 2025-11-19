import React from 'react';
import { render } from '@testing-library/react';

// Mock de react-router-dom ANTES de importar App
// Usar funciones simples que retornan elementos React válidos
jest.mock('react-router-dom', () => {
  // Importar React aquí dentro del mock usando require
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element }) => React.createElement('div', { 'data-testid': 'route' }, element),
    Navigate: () => React.createElement('div', { 'data-testid': 'navigate' }),
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useNavigate: () => jest.fn()
  };
});

// Mock de contextos que App necesita
jest.mock('./context/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      user: null,
      admin: null,
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    })
  };
});

jest.mock('./context/CartContext', () => {
  const React = require('react');
  return {
    CartProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useCart: () => ({
      items: [],
      addItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      getTotal: () => 0
    })
  };
});

// Mock de componentes de páginas
jest.mock('./pages/Login', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'login-page' })
  };
});

jest.mock('./pages/Register', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'register-page' })
  };
});

jest.mock('./pages/Products', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'products-page' })
  };
});

jest.mock('./pages/Cart', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'cart-page' })
  };
});

jest.mock('./pages/Admin', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'admin-page' })
  };
});

jest.mock('./pages/Profile', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'profile-page' })
  };
});

jest.mock('./components/Navbar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'navbar' })
  };
});

jest.mock('./components/ProtectedRoute', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement(React.Fragment, null, children)
  };
});

// Mock de Material-UI
jest.mock('@mui/material/styles', () => {
  const React = require('react');
  return {
    ThemeProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    createTheme: () => ({})
  };
});

jest.mock('@mui/material', () => {
  const React = require('react');
  return {
    CssBaseline: () => null,
    Container: ({ children }) => React.createElement('div', { 'data-testid': 'container' }, children)
  };
});

import App from './App';

test('renders app without crashing', () => {
  // Test básico para verificar que la app se renderiza sin errores
  const { container } = render(<App />);
  expect(container).toBeDefined();
});
