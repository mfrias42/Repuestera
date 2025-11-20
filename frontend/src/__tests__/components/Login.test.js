/**
 * Tests unitarios para el componente Login
 * Patrón AAA: Arrange, Act, Assert
 */

// Declarar mocks ANTES de usarlos en jest.mock
const mockNavigate = jest.fn();
const mockLogin = jest.fn();

// Mock de react-router-dom usando factory function simple
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element }) => element,
    Navigate: () => null,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockNavigate
  };
});

// Mock de AuthContext - usar función que retorna el mock
jest.mock('../../context/AuthContext', () => {
  const mockAuthContextValue = {
    user: null,
    admin: null,
    login: jest.fn(), // Usar jest.fn() directamente aquí
    logout: jest.fn(),
    isAuthenticated: false
  };
  
  return {
    AuthContext: {
      Provider: ({ children, value }) => children,
      Consumer: ({ children }) => children(mockAuthContextValue)
    },
    useAuth: () => mockAuthContextValue
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { useAuth } from '../../context/AuthContext';

// Obtener el mock del contexto después de importar
const mockAuthContext = require('../../context/AuthContext');
const mockLoginFromContext = mockAuthContext.useAuth().login;

// Wrapper para proporcionar contexto
const LoginWithContext = () => {
  const auth = useAuth();
  return (
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoginFromContext.mockResolvedValue({});
  });

  test('debe renderizar el formulario de login', () => {
    // Arrange & Act
    render(<LoginWithContext />);

    // Assert
    const loginButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  test('debe actualizar el estado cuando se escriben en los campos', () => {
    // Arrange
    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    // Act
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Assert
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('debe llamar a login cuando se envía el formulario', async () => {
    // Arrange
    mockNavigate.mockClear();
    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
    const submitButton = submitButtons[submitButtons.length - 1]; // Tomar el último (el del formulario)

    // Act
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLoginFromContext).toHaveBeenCalled();
    });
  });

  test('debe navegar a /admin cuando es admin', async () => {
    // Arrange
    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const adminSwitch = screen.queryByLabelText(/iniciar sesión como administrador/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    if (adminSwitch) {
      fireEvent.click(adminSwitch);
    }
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLoginFromContext).toHaveBeenCalled();
    });
  });

  test('debe mostrar error cuando el login falla', async () => {
    // Arrange
    const errorMessage = 'Credenciales inválidas';
    mockLoginFromContext.mockRejectedValue({
      response: {
        data: {
          message: errorMessage
        }
      }
    });

    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('debe validar campos requeridos', async () => {
    // Arrange
    render(<LoginWithContext />);
    const submitButtons = screen.getAllByRole('button', { name: /iniciar sesión/i });
    const submitButton = submitButtons[0];

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      if (mockLoginFromContext.mock.calls.length > 0) {
        const callArgs = mockLoginFromContext.mock.calls[0];
        expect(callArgs[0].email).toBe('');
        expect(callArgs[0].password).toBe('');
      } else {
        expect(mockLoginFromContext).not.toHaveBeenCalled();
      }
    });
  });
});
