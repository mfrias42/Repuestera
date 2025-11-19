// Mock de react-router-dom ANTES de cualquier importación
// Usar jest.requireActual para evitar problemas de resolución en CI/CD
jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element }) => React.createElement('div', { 'data-testid': 'route' }, element),
    Navigate: () => React.createElement('div', { 'data-testid': 'navigate' }, null),
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useNavigate: () => jest.fn()
  };
});

// Mock de contextos que App necesita
jest.mock('./context/AuthContext', () => {
  const React = jest.requireActual('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children)
  };
});

jest.mock('./context/CartContext', () => {
  const React = jest.requireActual('react');
  return {
    CartProvider: ({ children }) => React.createElement(React.Fragment, null, children)
  };
});

// Mock de componentes de páginas
jest.mock('./pages/Login', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'login-page' }, null);
});

jest.mock('./pages/Register', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'register-page' }, null);
});

jest.mock('./pages/Products', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'products-page' }, null);
});

jest.mock('./pages/Cart', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'cart-page' }, null);
});

jest.mock('./pages/Admin', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'admin-page' }, null);
});

jest.mock('./pages/Profile', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'profile-page' }, null);
});

jest.mock('./components/Navbar', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', { 'data-testid': 'navbar' }, null);
});

jest.mock('./components/ProtectedRoute', () => {
  const React = jest.requireActual('react');
  return ({ children }) => React.createElement(React.Fragment, null, children);
});

// Mock de Material-UI
jest.mock('@mui/material/styles', () => {
  const React = jest.requireActual('react');
  return {
    ThemeProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    createTheme: () => ({})
  };
});

jest.mock('@mui/material', () => {
  const React = jest.requireActual('react');
  return {
    CssBaseline: () => null,
    Container: ({ children }) => React.createElement('div', { 'data-testid': 'container' }, children)
  };
});

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  // Test básico para verificar que la app se renderiza sin errores
  const { container } = render(<App />);
  expect(container).toBeDefined();
});
