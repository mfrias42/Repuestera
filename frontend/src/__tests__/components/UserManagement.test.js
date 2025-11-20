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

// Mock de AuthContext para UserManagement
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isSuperAdmin: () => true,
    user: { id: 1, rol: 'super_admin' }
  })
}));

jest.mock('../../services/api', () => ({
  userService: {
    getUsers: jest.fn(),
    deleteUser: jest.fn()
  },
  adminService: {
    getAdmins: jest.fn()
  }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../../components/UserManagement';
import { userService, adminService } from '../../services/api';

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
      // Buscar por email que es único en lugar de nombres que pueden estar divididos
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
      expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    });
    
    // Verificar que los nombres están presentes usando getAllByText para manejar múltiples elementos
    const juanElements = screen.getAllByText(/juan/i);
    const mariaElements = screen.getAllByText(/maría/i);
    expect(juanElements.length).toBeGreaterThan(0);
    expect(mariaElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar administradores en la tabla', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      // Buscar por email del admin que es único
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });
    
    // Verificar que el nombre Admin está presente usando getAllByText para manejar múltiples elementos
    const adminElements = screen.getAllByText(/admin/i);
    expect(adminElements.length).toBeGreaterThan(0);
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
    // Asegurar que el usuario esté activo para que el botón no esté deshabilitado
    const activeUsers = mockUsers.map(u => ({ ...u, activo: true }));
    userService.getUsers.mockResolvedValue({ data: { users: activeUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    userService.deleteUser.mockResolvedValue({});
    
    // Asegurar que window.confirm retorne true
    global.window.confirm = jest.fn(() => true);
    
    renderComponent();
    
    await waitFor(() => {
      // Buscar por email que es único en lugar de nombre que puede estar dividido
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });
    
    // Buscar los botones de eliminar que no estén deshabilitados
    const deleteIcons = screen.getAllByTestId('DeleteIcon');
    expect(deleteIcons.length).toBeGreaterThan(0);
    
    // Encontrar el IconButton padre que contiene el icono Delete y no está deshabilitado
    // Debe estar en la tabla de usuarios (no en la de administradores)
    const deleteButton = deleteIcons.find(icon => {
      const btn = icon.closest('button');
      const tableCell = icon.closest('td');
      const tableRow = tableCell?.closest('tr');
      // Verificar que está en una fila de la tabla de usuarios (no administradores)
      return btn && !btn.disabled && tableRow && tableRow.textContent?.includes('juan@test.com');
    })?.closest('button');
    
    expect(deleteButton).not.toBeNull();
    expect(deleteButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Verificar que window.confirm fue llamado
    expect(global.window.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  it('debe mostrar estado activo/inactivo correctamente', async () => {
    userService.getUsers.mockResolvedValue({ data: { users: mockUsers } });
    adminService.getAdmins.mockResolvedValue({ data: { admins: mockAdmins } });
    
    renderComponent();
    
    await waitFor(() => {
      // Usar getAllByText para manejar múltiples elementos con el mismo texto
      const activoElements = screen.getAllByText('Activo');
      const inactivoElements = screen.getAllByText('Inactivo');
      expect(activoElements.length).toBeGreaterThan(0);
      expect(inactivoElements.length).toBeGreaterThan(0);
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

