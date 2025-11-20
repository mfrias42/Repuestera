import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (authValue, initialEntries = ['/protected']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute Component', () => {
  it('debe mostrar loading cuando está cargando', () => {
    renderWithRouter({
      isAuthenticated: false,
      loading: true,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('debe redirigir a login cuando no está autenticado', () => {
    const { container } = renderWithRouter({
      isAuthenticated: false,
      loading: false,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });
    
    // Verificar que se renderiza Navigate (redirección)
    expect(container.querySelector('div')).toBeNull();
  });

  it('debe mostrar el contenido cuando está autenticado', () => {
    renderWithRouter({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('debe redirigir cuando requiere admin y el usuario no es admin', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => false,
          isSuperAdmin: () => false
        }}>
          <ProtectedRoute requireAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(container.querySelector('div')).toBeNull();
  });

  it('debe mostrar el contenido cuando requiere admin y el usuario es admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => false
        }}>
          <ProtectedRoute requireAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('debe redirigir cuando requiere super admin y el usuario no es super admin', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/super-admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => false
        }}>
          <ProtectedRoute requireSuperAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(container.querySelector('div')).toBeNull();
  });

  it('debe mostrar el contenido cuando requiere super admin y el usuario es super admin', () => {
    render(
      <MemoryRouter initialEntries={['/super-admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => true
        }}>
          <ProtectedRoute requireSuperAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

