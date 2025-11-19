// Mock de react-router-dom ANTES de cualquier importación
jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element, path }) => React.createElement('div', { 'data-testid': `route-${path || 'default'}` }, element),
    Navigate: ({ to }) => React.createElement('div', { 'data-testid': `navigate-${to || 'default'}` }, 'Navigate'),
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
  return () => React.createElement('div', null, 'Login');
});

jest.mock('./pages/Register', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Register');
});

jest.mock('./pages/Products', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Products');
});

jest.mock('./pages/Cart', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Cart');
});

jest.mock('./pages/Admin', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Admin');
});

jest.mock('./pages/Profile', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Profile');
});

jest.mock('./components/Navbar', () => {
  const React = jest.requireActual('react');
  return () => React.createElement('div', null, 'Navbar');
});

jest.mock('./components/ProtectedRoute', () => {
  const React = jest.requireActual('react');
  return ({ children }) => React.createElement(React.Fragment, null, children);
});

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Test básico para verificar que la app se renderiza sin errores
  expect(document.body).toBeInTheDocument();
});
