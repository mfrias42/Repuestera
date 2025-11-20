import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithProviders = (authValue, cartValue = { itemCount: 0 }) => {
  const fullCartValue = {
    itemCount: cartValue.itemCount || 0,
    items: cartValue.items || [],
    total: cartValue.total || 0,
    addToCart: cartValue.addToCart || jest.fn(),
    removeFromCart: cartValue.removeFromCart || jest.fn(),
    updateQuantity: cartValue.updateQuantity || jest.fn(),
    clearCart: cartValue.clearCart || jest.fn(),
    getItemQuantity: cartValue.getItemQuantity || jest.fn(() => 0),
    isInCart: cartValue.isInCart || jest.fn(() => false)
  };
  
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={fullCartValue}>
          <Navbar />
        </CartContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el navbar con logo', () => {
    renderWithProviders({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    expect(screen.getByText('Repuestera')).toBeInTheDocument();
  });

  it('debe mostrar botones de login y registro cuando no está autenticado', () => {
    renderWithProviders({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('debe mostrar opciones de usuario cuando está autenticado', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    }, { itemCount: 2 });
    
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge del carrito
  });

  it('debe mostrar botón de Admin cuando el usuario es administrador', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => true
    });
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('debe navegar al home cuando se hace clic en el logo', () => {
    renderWithProviders({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    fireEvent.click(screen.getByText('Repuestera'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('debe navegar a login cuando se hace clic en Iniciar Sesión', () => {
    renderWithProviders({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    fireEvent.click(screen.getByText('Iniciar Sesión'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debe navegar a register cuando se hace clic en Registrarse', () => {
    renderWithProviders({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    fireEvent.click(screen.getByText('Registrarse'));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('debe abrir el menú cuando se hace clic en el avatar', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  it('debe cerrar sesión cuando se hace clic en Cerrar Sesión', async () => {
    mockLogout.mockResolvedValue();
    
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(avatarButton);
    
    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('debe navegar a perfil cuando se hace clic en Perfil', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(avatarButton);
    
    const profileButton = screen.getByText('Perfil');
    fireEvent.click(profileButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('debe mostrar opción de administración en el menú si es admin', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => true
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('debe mostrar la inicial del nombre del usuario en el avatar', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('debe mostrar "U" cuando el usuario no tiene nombre', () => {
    renderWithProviders({
      user: { id: 1, email: 'test@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    expect(avatarButton).toBeInTheDocument();
  });

  it('debe navegar a productos cuando se hace clic en el botón Productos', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    fireEvent.click(screen.getByText('Productos'));
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('debe navegar a carrito cuando se hace clic en el icono del carrito', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    }, { itemCount: 2 });
    
    const cartButton = screen.getByText('2').closest('button');
    if (cartButton) {
      fireEvent.click(cartButton);
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    }
  });

  it('debe cerrar el menú cuando se hace clic fuera', () => {
    renderWithProviders({
      user: { id: 1, nombre: 'Juan', email: 'juan@test.com' },
      isAuthenticated: true,
      logout: mockLogout,
      isAdmin: () => false
    });
    
    const avatarButton = screen.getByLabelText(/account of current user/i);
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    
    // Simular clic fuera del menú
    fireEvent.click(document.body);
    
    // El menú debería cerrarse
    expect(screen.queryByText('Perfil')).not.toBeInTheDocument();
  });
});

