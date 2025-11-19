/**
 * Tests unitarios para el componente Login
 * Patrón AAA: Arrange, Act, Assert
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../context/AuthContext';

// Mock del contexto de autenticación
const mockLogin = jest.fn();
const mockAuthContextValue = {
  user: null,
  admin: null,
  login: mockLogin,
  logout: jest.fn(),
  isAuthenticated: false
};

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Wrapper para proporcionar contexto
const LoginWithContext = () => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContextValue}>
      <Login />
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({});
  });

  test('debe renderizar el formulario de login', () => {
    // Arrange & Act
    render(<LoginWithContext />);

    // Assert
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
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
    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123'
        },
        false
      );
    });
  });

  test('debe navegar a /admin cuando es admin', async () => {
    // Arrange
    render(<LoginWithContext />);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const adminSwitch = screen.getByLabelText(/iniciar sesión como administrador/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(adminSwitch);
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.any(Object),
        true
      );
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('debe mostrar error cuando el login falla', async () => {
    // Arrange
    const errorMessage = 'Credenciales inválidas';
    mockLogin.mockRejectedValue({
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

  test('debe validar campos requeridos', () => {
    // Arrange
    render(<LoginWithContext />);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

