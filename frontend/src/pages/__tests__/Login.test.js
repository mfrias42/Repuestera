import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';

// Mock de useAuth para controlar el login
let mockLogin;
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('navega a /products en login exitoso de usuario', async () => {
    mockLogin = jest.fn().mockResolvedValue({ user: { email: 'u@test.com' } });

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'u@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ email: 'u@test.com', password: 'secret' }, false)
    );
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('navega a /admin en login exitoso de admin', async () => {
    mockLogin = jest.fn().mockResolvedValue({ admin: { email: 'a@test.com', rol: 'admin' } });

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } });
    // activar switch de administrador
    fireEvent.click(screen.getByLabelText(/iniciar como administrador/i));
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ email: 'a@test.com', password: 'secret' }, true)
    );
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('muestra mensaje de error y desactiva loading en login fallido', async () => {
    mockLogin = jest.fn().mockRejectedValue({
      response: { data: { message: 'Credenciales inválidas' } },
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'x@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // durante la petición el botón muestra "Iniciando..." y está deshabilitado
    expect(screen.getByRole('button', { name: /iniciando/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).not.toBeDisabled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});


