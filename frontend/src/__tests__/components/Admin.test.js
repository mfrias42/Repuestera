import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../../pages/Admin';
import { AuthContext } from '../../context/AuthContext';

jest.mock('../components/ProductManagement', () => {
  return function MockProductManagement() {
    return <div>Product Management</div>;
  };
});

jest.mock('../components/UserManagement', () => {
  return function MockUserManagement() {
    return <div>User Management</div>;
  };
});

const renderWithProviders = (user, isSuperAdmin = false) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{
        user: user,
        isSuperAdmin: () => isSuperAdmin
      }}>
        <Admin />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Admin Component', () => {
  const mockUser = {
    id: 1,
    nombre: 'Admin',
    apellido: 'User',
    email: 'admin@test.com'
  };

  it('debe renderizar el panel de administración', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText(/panel de administración/i)).toBeInTheDocument();
    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
  });

  it('debe mostrar el nombre del usuario', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText(/admin user/i)).toBeInTheDocument();
  });

  it('debe mostrar tab de Gestión de Productos', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText(/gestión de productos/i)).toBeInTheDocument();
  });

  it('debe mostrar tab de Gestión de Usuarios si es super admin', () => {
    renderWithProviders(mockUser, true);
    
    expect(screen.getByText(/gestión de usuarios/i)).toBeInTheDocument();
  });

  it('no debe mostrar tab de Gestión de Usuarios si no es super admin', () => {
    renderWithProviders(mockUser, false);
    
    expect(screen.queryByText(/gestión de usuarios/i)).not.toBeInTheDocument();
  });

  it('debe cambiar de tab cuando se hace clic', () => {
    renderWithProviders(mockUser, true);
    
    const userTab = screen.getByText(/gestión de usuarios/i);
    fireEvent.click(userTab);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('debe mostrar ProductManagement por defecto', () => {
    renderWithProviders(mockUser);
    
    expect(screen.getByText('Product Management')).toBeInTheDocument();
  });
});

