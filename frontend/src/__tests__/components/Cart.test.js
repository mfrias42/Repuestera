// Declarar mocks ANTES de los imports
const mockNavigate = jest.fn();
const mockUpdateQuantity = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockClearCart = jest.fn();

// Mock de react-router-dom usando factory function simple (igual que Login.test.js)
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element }) => element,
    Navigate: () => null,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockNavigate
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../pages/Cart';
import CartContext from '../../context/CartContext';

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
    // El total se muestra formateado como moneda ARS (ej: "$ 3.500,00" o "$3.500,00")
    // Buscar el texto que contiene el número del total en cualquier formato
    // El total está en el Paper del resumen del pedido
    const totalText = screen.getByText((content, element) => {
      // Buscar el texto que contiene el número del total (3500) en cualquier formato
      const hasTotal = content.includes('3500') || content.includes('3.500') || content.includes('3,500');
      // Verificar que está en el contexto del resumen del pedido (Paper con "Resumen")
      const paper = element?.closest('[class*="MuiPaper"]');
      const isInSummary = paper !== null && (
        paper.textContent?.includes('Resumen') || 
        paper.textContent?.includes('Total') ||
        element?.textContent?.includes('Total')
      );
      return hasTotal && isInSummary;
    });
    expect(totalText).toBeInTheDocument();
  });

  it('debe aumentar cantidad cuando se hace clic en +', async () => {
    renderWithProviders();
    
    // Buscar los IconButtons que contienen el icono Add
    const addIcons = screen.getAllByTestId('AddIcon');
    expect(addIcons.length).toBeGreaterThan(0);
    
    // Encontrar el IconButton padre que contiene el icono Add
    const addButton = addIcons[0].closest('button');
    expect(addButton).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('debe disminuir cantidad cuando se hace clic en -', async () => {
    renderWithProviders();
    
    // Buscar los IconButtons que contienen el icono Remove
    const removeIcons = screen.getAllByTestId('RemoveIcon');
    expect(removeIcons.length).toBeGreaterThan(0);
    
    // Encontrar el IconButton padre que contiene el icono Remove
    const removeButton = removeIcons[0].closest('button');
    expect(removeButton).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('debe eliminar item cuando se hace clic en eliminar', async () => {
    renderWithProviders();
    
    // Buscar los IconButtons que contienen el icono Delete
    // Hay múltiples DeleteIcon (uno por item en la lista y uno para vaciar carrito)
    const deleteIcons = screen.getAllByTestId('DeleteIcon');
    expect(deleteIcons.length).toBeGreaterThan(0);
    
    // El botón de eliminar item está en la columna derecha de cada item del carrito
    // Buscar el que está dentro de un Card (no el botón "Vaciar Carrito" que está en el header)
    const deleteButton = deleteIcons.find(icon => {
      const btn = icon.closest('button');
      const card = icon.closest('[class*="MuiCard"]');
      const isInCard = card !== null;
      // El botón de eliminar item está dentro de un Card y no tiene texto "Vaciar"
      return btn && isInCard && !btn.textContent?.includes('Vaciar') && !btn.textContent?.includes('Carrito');
    })?.closest('button');
    
    expect(deleteButton).toBeDefined();
    expect(deleteButton).not.toBeNull();
    if (deleteButton) {
      expect(deleteButton).not.toBeDisabled();
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      
      expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
    }
  });

  it('debe vaciar carrito cuando se hace clic en Vaciar Carrito', async () => {
    renderWithProviders();
    
    const clearButton = screen.getByText(/vaciar carrito/i);
    await act(async () => {
      fireEvent.click(clearButton);
    });
    
    expect(mockClearCart).toHaveBeenCalled();
  });

  it('debe navegar a productos cuando se hace clic en Seguir Comprando', async () => {
    renderWithProviders();
    
    // El texto es "Continuar Comprando", no "Seguir Comprando"
    const continueButton = screen.getByText(/continuar comprando/i);
    await act(async () => {
      fireEvent.click(continueButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('debe mostrar mensaje cuando se intenta agregar más cantidad que el stock disponible', async () => {
    const itemWithLowStock = [{
      id: 1,
      nombre: 'Producto',
      precio: 1000,
      stock: 2,
      quantity: 2,
      imagen_url: '/test.jpg'
    }];
    
    renderWithProviders(itemWithLowStock);
    
    // Buscar el IconButton que contiene el icono Add
    const addIcons = screen.getAllByTestId('AddIcon');
    expect(addIcons.length).toBeGreaterThan(0);
    
    // El botón debería estar deshabilitado cuando quantity >= stock
    const addButton = addIcons[0].closest('button');
    expect(addButton).not.toBeNull();
    expect(addButton).toBeDisabled();
    
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // No debería llamar a updateQuantity porque está deshabilitado
    expect(mockUpdateQuantity).not.toHaveBeenCalled();
  });

  it('debe actualizar cantidad cuando se cambia el input directamente', () => {
    renderWithProviders();
    
    const quantityInputs = screen.getAllByDisplayValue('2');
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 5);
  });

  it('debe eliminar item cuando la cantidad se reduce a 0', async () => {
    const singleItem = [{
      id: 1,
      nombre: 'Producto',
      precio: 1000,
      stock: 10,
      quantity: 1,
      imagen_url: '/test.jpg',
      codigo: 'TEST001'
    }];
    
    renderWithProviders(singleItem);
    
    // Buscar el IconButton que contiene el icono Remove
    const removeIcons = screen.getAllByTestId('RemoveIcon');
    expect(removeIcons.length).toBeGreaterThan(0);
    
    const removeButton = removeIcons[0].closest('button');
    expect(removeButton).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(removeButton);
    });
    
    // Cuando la cantidad se reduce a 0, debería llamar a removeFromCart
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
  });

  it('debe mostrar subtotal por producto', () => {
    renderWithProviders();
    
    const subtotal = mockItems[0].precio * mockItems[0].quantity; // 1500 * 2 = 3000
    // Buscar usando getAllByText para manejar múltiples elementos con el mismo número
    const subtotalTexts = screen.getAllByText((content, element) => {
      // Buscar el texto que contiene el número del subtotal (3000) en cualquier formato
      return content.includes('3000') || content.includes('3.000') || content.includes('3,500');
    });
    
    // Debe haber al menos un subtotal
    expect(subtotalTexts.length).toBeGreaterThan(0);
    
    // Verificar que al menos uno está en el contexto del resumen del pedido
    const subtotalInSummary = subtotalTexts.find(text => {
      const paper = text.closest('[class*="MuiPaper"]');
      return paper !== null && (paper.textContent?.includes('Resumen') || paper.textContent?.includes('Total'));
    });
    expect(subtotalInSummary).toBeDefined();
  });

  it('debe mostrar mensaje de checkout cuando se hace clic', async () => {
    renderWithProviders();
    
    // El botón dice "Proceder al Pago", no "Finalizar compra"
    const checkoutButton = screen.getByText(/proceder al pago/i);
    await act(async () => {
      fireEvent.click(checkoutButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/funcionalidad de checkout en desarrollo/i)).toBeInTheDocument();
    });
  });

  it('debe cerrar snackbar cuando se hace clic en cerrar', async () => {
    renderWithProviders();
    
    // Buscar el botón de eliminar item usando el icono Delete
    const deleteIcons = screen.getAllByTestId('DeleteIcon');
    const deleteButton = deleteIcons.find(icon => {
      const btn = icon.closest('button');
      return btn && !btn.textContent?.includes('Vaciar');
    })?.closest('button');
    
    expect(deleteButton).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Esperar a que aparezca el snackbar
    await waitFor(() => {
      // El snackbar de MUI tiene un botón de cerrar con aria-label
      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toBeInTheDocument();
    });
    
    await act(async () => {
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);
    });
    
    // Verificar que el snackbar se cerró
    await waitFor(() => {
      expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
    });
  });

  it('debe mostrar "Continuar Comprando" cuando hay items', () => {
    renderWithProviders();
    
    expect(screen.getByText(/continuar comprando/i)).toBeInTheDocument();
  });
});

