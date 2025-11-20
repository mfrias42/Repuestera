import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

// Mock de los componentes de páginas para simplificar los tests
jest.mock('../pages/Login', () => {
  return function MockLogin() {
    return <div>Login Page</div>;
  };
});

jest.mock('../pages/Register', () => {
  return function MockRegister() {
    return <div>Register Page</div>;
  };
});

jest.mock('../pages/Products', () => {
  return function MockProducts() {
    return <div>Products Page</div>;
  };
});

jest.mock('../pages/Cart', () => {
  return function MockCart() {
    return <div>Cart Page</div>;
  };
});

jest.mock('../pages/Admin', () => {
  return function MockAdmin() {
    return <div>Admin Page</div>;
  };
});

jest.mock('../pages/Profile', () => {
  return function MockProfile() {
    return <div>Profile Page</div>;
  };
});

jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <nav>Navbar</nav>;
  };
});

const renderApp = (initialEntries = ['/']) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{
        user: null,
        isAuthenticated: false,
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        isAdmin: () => false,
        isSuperAdmin: () => false
      }}>
        <CartContext.Provider value={{
          items: [],
          itemCount: 0,
          addToCart: jest.fn(),
          removeFromCart: jest.fn(),
          updateQuantity: jest.fn(),
          clearCart: jest.fn(),
          getItemQuantity: jest.fn(() => 0)
        }}>
          <App />
        </CartContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('App Component', () => {
  it('debe renderizar el componente App', () => {
    renderApp();
    expect(screen.getByText('Navbar')).toBeInTheDocument();
  });

  it('debe renderizar Products en la ruta raíz', () => {
    renderApp(['/']);
    expect(screen.getByText('Products Page')).toBeInTheDocument();
  });

  it('debe renderizar Products en la ruta /products', () => {
    renderApp(['/products']);
    expect(screen.getByText('Products Page')).toBeInTheDocument();
  });

  it('debe renderizar Login en la ruta /login', () => {
    renderApp(['/login']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('debe renderizar Register en la ruta /register', () => {
    renderApp(['/register']);
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  it('debe renderizar Cart en la ruta /cart', () => {
    renderApp(['/cart']);
    expect(screen.getByText('Cart Page')).toBeInTheDocument();
  });
});

