import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../../components/UserManagement';
import { userService, adminService } from '../../services/api';

jest.mock('../../services/api', () => ({
  userService: {
    getUsers: jest.fn(),
    deleteUser: jest.fn()
  },
  adminService: {
    getAdmins: jest.fn()
  }
}));

// Mock window.confirm
global.window.confirm = jest.fn(() => true);

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UserManagement />
    </BrowserRouter>
  );
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsers = [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '1123456789',
      fecha_registro: '2024-01-01',
      activo: true
    },
    {
      id: 2,
      nombre: 'María',
      apellido: 'García',
      email: 'maria@test.com',
      telefono: null,
      fecha_registro: '2024-01-02',
      activo: false
    }
  ];

  const mockAdmins = [
    {
      id: 1,
      nombre: 'Admin',
      apellido: 'User',
      email: 'admin@test.com',
      rol: 'super_admin',
      fecha_registro: '2024-01-01'
    }
  ];

  it('debe cargar usuarios al montar el componente', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(userService.getUsers).toHaveBeenCalled();
      expect(adminService.getAdmins).toHaveBeenCalled();
    });
  });

  it('debe mostrar usuarios en la tabla', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('María')).toBeInTheDocument();
    });
  });

  it('debe mostrar administradores en la tabla', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga de usuarios', async () => {
    userService.getUsers.mockRejectedValue(new Error('Error de red'));
    adminService.getAdmins.mockResolvedValue({ data: { admins: [] } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/error al cargar usuarios/i)).toBeInTheDocument();
    });
  });

  it('debe desactivar usuario cuando se confirma', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    userService.deleteUser.mockResolvedValue({});
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  it('debe mostrar estado activo/inactivo correctamente', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  it('debe mostrar N/A cuando no hay teléfono', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});

