import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock de AuthContext para tests
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null
  })
}));

// Mock de CartContext
jest.mock('./context/CartContext', () => ({
  CartProvider: ({ children }) => <>{children}</>,
  useCart: () => ({
    cart: [],
    addToCart: jest.fn(),
    removeFromCart: jest.fn()
  })
}));

test('renders app without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Solo verificamos que la app se renderiza sin errores
  expect(document.body).toBeInTheDocument();
});
