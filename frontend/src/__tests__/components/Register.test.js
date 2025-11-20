import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import { AuthContext } from '../../context/AuthContext';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ 
        register: mockRegister,
        user: null,
        isAuthenticated: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        isAdmin: () => false,
        isSuperAdmin: () => false
      }}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockResolvedValue({});
  });

  it('debe renderizar el formulario de registro', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('debe actualizar los campos del formulario cuando el usuario escribe', () => {
    renderWithProviders(<Register />);
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    
    fireEvent.change(nombreInput, { target: { value: 'Juan' } });
    fireEvent.change(emailInput, { target: { value: 'juan@test.com' } });
    
    expect(nombreInput.value).toBe('Juan');
    expect(emailInput.value).toBe('juan@test.com');
  });

  it('debe mostrar error cuando las contraseñas no coinciden', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole('button', { name: /registrarse/i });
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando la contraseña es muy corta', async () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole('button', { name: /registrarse/i });
    
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a register cuando el formulario es válido', async () => {
    renderWithProviders(<Register />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /registrarse/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
        telefono: '',
        direccion: ''
      });
    });
  });

  it('debe mostrar mensaje de éxito después de registro exitoso', async () => {
    mockRegister.mockResolvedValue({});
    jest.useFakeTimers();
    
    renderWithProviders(<Register />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/usuario registrado exitosamente/i)).toBeInTheDocument();
    });
    
    jest.advanceTimersByTime(2000);
    jest.useRealTimers();
  });

  it('debe mostrar campos opcionales (teléfono y dirección)', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
  });

  it('debe incluir campos opcionales en el registro', async () => {
    mockRegister.mockResolvedValue({});
    
    renderWithProviders(<Register />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '1123456789' } });
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle Falsa 123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
        telefono: '1123456789',
        direccion: 'Calle Falsa 123'
      });
    });
  });

  it('debe mostrar error cuando el registro falla', async () => {
    const errorMessage = 'Error al registrar usuario';
    mockRegister.mockRejectedValue({ response: { data: { message: errorMessage } } });
    
    renderWithProviders(<Register />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('debe deshabilitar el botón mientras se procesa el registro', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(<Register />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /registrarse/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/registrando/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

