// Mock de react-router-dom ANTES de los imports
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element }) => element,
    Navigate: () => null,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn()
  };
});

jest.mock('../../services/api', () => ({
  userService: {
    updateProfile: jest.fn()
  }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';
import AuthContext from '../../context/AuthContext';
import { userService } from '../../services/api';

const mockUpdateUser = jest.fn();

const renderWithProviders = (user) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{
        user: user,
        updateUser: mockUpdateUser,
        isAuthenticated: !!user,
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAdmin: () => false,
        isSuperAdmin: () => false,
        checkAuthStatus: jest.fn()
      }}>
        <Profile />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@test.com',
    telefono: '1123456789',
    direccion: 'Calle Falsa 123',
    fecha_registro: '2024-01-01'
  };

  it('debe renderizar el perfil del usuario', async () => {
    renderWithProviders(mockUser);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
      expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando no hay usuario', () => {
    renderWithProviders(null);
    
    expect(screen.getByText(/no se pudo cargar la información del usuario/i)).toBeInTheDocument();
  });

  it('debe activar modo edición cuando se hace clic en Editar', async () => {
    renderWithProviders(mockUser);
    
    const editButton = screen.getByRole('button', { name: /editar/i });
    await act(async () => {
      fireEvent.click(editButton);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it('debe actualizar campos cuando se edita', async () => {
    renderWithProviders(mockUser);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    });
    
    await waitFor(() => {
      const nombreInput = screen.getByLabelText(/nombre/i);
      expect(nombreInput).toBeInTheDocument();
    });
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    await act(async () => {
      fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    });
    
    expect(nombreInput.value).toBe('Pedro');
  });

  it('debe guardar cambios cuando se hace clic en Guardar', async () => {
    const updatedUser = { ...mockUser, nombre: 'Pedro' };
    userService.updateProfile.mockResolvedValue({
      success: true,
      usuario: updatedUser
    });
    
    renderWithProviders(mockUser);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    });
    
    await waitFor(() => {
      const nombreInput = screen.getByLabelText(/nombre/i);
      expect(nombreInput).toBeInTheDocument();
    });
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    await act(async () => {
      fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    });
    
    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith({
        nombre: 'Pedro',
        apellido: 'Pérez',
        email: 'juan@test.com',
        telefono: '1123456789',
        direccion: 'Calle Falsa 123'
      });
    });
  });

  it('debe cancelar edición cuando se hace clic en Cancelar', async () => {
    renderWithProviders(mockUser);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    });
    
    await waitFor(() => {
      const nombreInput = screen.getByLabelText(/nombre/i);
      expect(nombreInput).toBeInTheDocument();
    });
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    await act(async () => {
      fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    });
    
    // Verificar que el valor cambió
    expect(nombreInput.value).toBe('Pedro');
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    });
    
    // Esperar a que el componente se actualice después de cancelar
    await waitFor(() => {
      // Después de cancelar, el campo debería volver a estar deshabilitado y mostrar el valor original
      const nombreInputAfterCancel = screen.getByLabelText(/nombre/i);
      expect(nombreInputAfterCancel.value).toBe('Juan');
    }, { timeout: 2000 });
  });

  it('debe mostrar error cuando falla la actualización', async () => {
    userService.updateProfile.mockRejectedValue({
      response: { data: { message: 'Error al actualizar' } }
    });
    
    renderWithProviders(mockUser);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/error al actualizar/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar información de fecha de registro', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText(/fecha de registro/i)).toBeInTheDocument();
  });

  it('debe deshabilitar botón guardar mientras se procesa', async () => {
    userService.updateProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(mockUser);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    });
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      expect(saveButton).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    expect(saveButton).toBeDisabled();
  });

  it('debe manejar campos vacíos correctamente', () => {
    const userWithEmptyFields = {
      id: 1,
      nombre: '',
      apellido: '',
      email: 'test@test.com',
      telefono: null,
      direccion: null
    };
    
    renderWithProviders(userWithEmptyFields);
    
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
  });
});

