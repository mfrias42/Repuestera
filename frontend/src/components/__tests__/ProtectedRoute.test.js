/**
 * Tests unitarios para componente ProtectedRoute
 * Patrón AAA: Arrange, Act, Assert
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// Mock de AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <>{children}</>
}));

// Mock de Material-UI
jest.mock('@mui/material', () => ({
  CircularProgress: () => <div data-testid="loading">Loading...</div>,
  Box: ({ children, ...props }) => <div {...props}>{children}</div>
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería mostrar loading cuando está cargando', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('debería redirigir a login si no está autenticado', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });

    // Act
    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    // Navigate component redirige, verificamos que no hay contenido protegido
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('debería mostrar contenido si está autenticado', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('debería redirigir si requiere admin y no es admin', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => false,
      isSuperAdmin: () => false
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  test('debería mostrar contenido si requiere admin y es admin', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => true,
      isSuperAdmin: () => false
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  test('debería redirigir si requiere super admin y no es super admin', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => true,
      isSuperAdmin: () => false
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute requireSuperAdmin={true}>
          <div>Super Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryByText('Super Admin Content')).not.toBeInTheDocument();
  });

  test('debería mostrar contenido si requiere super admin y es super admin', () => {
    // Arrange
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      isAdmin: () => true,
      isSuperAdmin: () => true
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute requireSuperAdmin={true}>
          <div>Super Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
  });
});

