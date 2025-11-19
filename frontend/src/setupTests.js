// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mocks globales para todos los tests - se ejecutan ANTES de cualquier test
// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: () => null,
  Link: ({ children }) => children,
  useNavigate: () => jest.fn()
}));

// Mock de contextos
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: null,
    admin: null,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: false
  })
}));

jest.mock('./context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: () => ({
    items: [],
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    getTotal: () => 0
  })
}));

// Mock de componentes de páginas
jest.mock('./pages/Login', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./pages/Register', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./pages/Products', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./pages/Cart', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./pages/Admin', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./pages/Profile', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./components/Navbar', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => children
}));

// Mock de Material-UI
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }) => children,
  createTheme: () => ({})
}));

jest.mock('@mui/material', () => ({
  CssBaseline: () => null,
  Container: ({ children }) => children
}));
