// Mock de react-router-dom ANTES de los imports
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element }) => element,
    Navigate: () => null,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn()
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import AuthContext from '../../context/AuthContext';

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (authValue) => {
  const fullAuthValue = {
    isAuthenticated: authValue.isAuthenticated || false,
    loading: authValue.loading || false,
    isAdmin: authValue.isAdmin || (() => false),
    isSuperAdmin: authValue.isSuperAdmin || (() => false),
    user: authValue.user || null,
    login: authValue.login || jest.fn(),
    register: authValue.register || jest.fn(),
    logout: authValue.logout || jest.fn(),
    checkAuthStatus: authValue.checkAuthStatus || jest.fn()
  };
  
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthContext.Provider value={fullAuthValue}>
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
    
    // Verificar que no se muestra el contenido protegido
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
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
          isSuperAdmin: () => false,
          user: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          checkAuthStatus: jest.fn()
        }}>
          <ProtectedRoute requireAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('debe mostrar el contenido cuando requiere admin y el usuario es admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => false,
          user: { id: 1, rol: 'admin' },
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          checkAuthStatus: jest.fn()
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
    render(
      <MemoryRouter initialEntries={['/super-admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => false,
          user: { id: 1, rol: 'admin' },
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          checkAuthStatus: jest.fn()
        }}>
          <ProtectedRoute requireSuperAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('debe mostrar el contenido cuando requiere super admin y el usuario es super admin', () => {
    render(
      <MemoryRouter initialEntries={['/super-admin']}>
        <AuthContext.Provider value={{
          isAuthenticated: true,
          loading: false,
          isAdmin: () => true,
          isSuperAdmin: () => true,
          user: { id: 1, rol: 'super_admin' },
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          checkAuthStatus: jest.fn()
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
