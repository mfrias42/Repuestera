import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';
import AuthContext from '../../context/AuthContext';
import { userService } from '../../services/api';

jest.mock('../../services/api', () => ({
  userService: {
    updateProfile: jest.fn()
  }
}));

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

  it('debe renderizar el perfil del usuario', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument();
  });

  it('debe mostrar error cuando no hay usuario', () => {
    renderWithProviders(null);
    
    expect(screen.getByText(/no se pudo cargar la información del usuario/i)).toBeInTheDocument();
  });

  it('debe activar modo edición cuando se hace clic en Editar', () => {
    renderWithProviders(mockUser);
    
    const editButton = screen.getByRole('button', { name: /editar/i });
    fireEvent.click(editButton);
    
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('debe actualizar campos cuando se edita', () => {
    renderWithProviders(mockUser);
    
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    
    expect(nombreInput.value).toBe('Pedro');
  });

  it('debe guardar cambios cuando se hace clic en Guardar', async () => {
    const updatedUser = { ...mockUser, nombre: 'Pedro' };
    userService.updateProfile.mockResolvedValue({
      success: true,
      usuario: updatedUser
    });
    
    renderWithProviders(mockUser);
    
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
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

  it('debe cancelar edición cuando se hace clic en Cancelar', () => {
    renderWithProviders(mockUser);
    
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    
    const nombreInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
    
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    
    expect(nombreInput.value).toBe('Juan');
  });

  it('debe mostrar error cuando falla la actualización', async () => {
    userService.updateProfile.mockRejectedValue({
      response: { data: { message: 'Error al actualizar' } }
    });
    
    renderWithProviders(mockUser);
    
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
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
    
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(saveButton);
    
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

