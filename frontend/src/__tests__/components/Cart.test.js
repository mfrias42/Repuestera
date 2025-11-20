import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../pages/Cart';
import CartContext from '../../context/CartContext';

const mockNavigate = jest.fn();
const mockUpdateQuantity = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockClearCart = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockItems = [
  {
    id: 1,
    nombre: 'Filtro de Aceite',
    precio: 1500,
    stock: 10,
    quantity: 2,
    imagen_url: '/test.jpg'
  },
  {
    id: 2,
    nombre: 'Bujía',
    precio: 500,
    stock: 5,
    quantity: 1,
    imagen_url: '/test2.jpg'
  }
];

const renderWithProviders = (items = mockItems) => {
  const total = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return render(
    <BrowserRouter>
      <CartContext.Provider value={{
        items: items,
        total: total,
        itemCount: itemCount,
        updateQuantity: mockUpdateQuantity,
        removeFromCart: mockRemoveFromCart,
        clearCart: mockClearCart,
        getItemQuantity: jest.fn((id) => {
          const item = items.find(i => i.id === id);
          return item ? item.quantity : 0;
        }),
        addToCart: jest.fn(),
        isInCart: jest.fn((id) => items.some(i => i.id === id))
      }}>
        <Cart />
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe mostrar mensaje cuando el carrito está vacío', () => {
    renderWithProviders([]);
    
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('debe mostrar productos cuando hay items en el carrito', () => {
    renderWithProviders();
    
    expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    expect(screen.getByText('Bujía')).toBeInTheDocument();
  });

  it('debe mostrar el total correcto', () => {
    renderWithProviders();
    
    const total = mockItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    expect(screen.getByText(new RegExp(total.toString()))).toBeInTheDocument();
  });

  it('debe aumentar cantidad cuando se hace clic en +', () => {
    renderWithProviders();
    
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    fireEvent.click(addButtons[0]);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('debe disminuir cantidad cuando se hace clic en -', () => {
    renderWithProviders();
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('debe eliminar item cuando se hace clic en eliminar', () => {
    renderWithProviders();
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
  });

  it('debe vaciar carrito cuando se hace clic en Vaciar Carrito', () => {
    renderWithProviders();
    
    const clearButton = screen.getByText(/vaciar carrito/i);
    fireEvent.click(clearButton);
    
    expect(mockClearCart).toHaveBeenCalled();
  });

  it('debe navegar a productos cuando se hace clic en Seguir Comprando', () => {
    renderWithProviders();
    
    const continueButton = screen.getByText(/seguir comprando/i);
    fireEvent.click(continueButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('debe mostrar mensaje cuando se intenta agregar más cantidad que el stock disponible', () => {
    const itemWithLowStock = [{
      id: 1,
      nombre: 'Producto',
      precio: 1000,
      stock: 2,
      quantity: 2
    }];
    
    renderWithProviders(itemWithLowStock);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    
    expect(mockUpdateQuantity).not.toHaveBeenCalled();
  });

  it('debe actualizar cantidad cuando se cambia el input directamente', () => {
    renderWithProviders();
    
    const quantityInputs = screen.getAllByDisplayValue('2');
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 5);
  });

  it('debe eliminar item cuando la cantidad se reduce a 0', () => {
    const singleItem = [{
      id: 1,
      nombre: 'Producto',
      precio: 1000,
      stock: 10,
      quantity: 1
    }];
    
    renderWithProviders(singleItem);
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
  });

  it('debe mostrar subtotal por producto', () => {
    renderWithProviders();
    
    const subtotal = mockItems[0].precio * mockItems[0].quantity;
    expect(screen.getByText(new RegExp(subtotal.toString()))).toBeInTheDocument();
  });

  it('debe mostrar mensaje de checkout cuando se hace clic', () => {
    renderWithProviders();
    
    const checkoutButton = screen.getByText(/finalizar compra/i);
    fireEvent.click(checkoutButton);
    
    expect(screen.getByText(/funcionalidad de checkout en desarrollo/i)).toBeInTheDocument();
  });

  it('debe cerrar snackbar cuando se hace clic en cerrar', async () => {
    renderWithProviders();
    
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
    });
  });

  it('debe mostrar "Continuar Comprando" cuando hay items', () => {
    renderWithProviders();
    
    expect(screen.getByText(/continuar comprando/i)).toBeInTheDocument();
  });
});

