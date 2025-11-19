// Mock de react-router-dom usando factory function
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element }) => element,
    Navigate: () => null,
    Link: ({ children, to }) => children,
    useNavigate: () => jest.fn()
  };
});

// Mock de contextos
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children
}));

jest.mock('./context/CartContext', () => ({
  CartProvider: ({ children }) => children
}));

// Mock de componentes de páginas
jest.mock('./pages/Login', () => () => null);
jest.mock('./pages/Register', () => () => null);
jest.mock('./pages/Products', () => () => null);
jest.mock('./pages/Cart', () => () => null);
jest.mock('./pages/Admin', () => () => null);
jest.mock('./pages/Profile', () => () => null);
jest.mock('./components/Navbar', () => () => null);
jest.mock('./components/ProtectedRoute', () => ({ children }) => children);

// Mock de Material-UI
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }) => children,
  createTheme: () => ({})
}));

jest.mock('@mui/material', () => ({
  CssBaseline: () => null,
  Container: ({ children }) => children
}));

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  // Test básico para verificar que la app se renderiza sin errores
  const { container } = render(<App />);
  expect(container).toBeDefined();
});
