import { render, screen } from '@testing-library/react';
import App from './App';

// Mock de react-router-dom para evitar errores
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => <div>{element}</div>,
  Navigate: () => <div>Navigate</div>
}));

test('renders app without crashing', () => {
  render(<App />);
  // Test básico para verificar que la app se renderiza sin errores
  expect(document.body).toBeInTheDocument();
});
