// Mock de react-router-dom ANTES de importar App (que lo necesita)
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: () => null,
  Link: ({ children }) => children,
  useNavigate: () => jest.fn()
}));

// Mock de contextos que App necesita
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children
}));

jest.mock('./context/CartContext', () => ({
  CartProvider: ({ children }) => children
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

// Ahora sí importar App después de todos los mocks
import App from './App';

test('App component can be imported', () => {
  // Verificar que el componente existe y es una función
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
