import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from '../../pages/Products';
import { CartContext } from '../../context/CartContext';
import { productService } from '../../services/api';

jest.mock('../../services/api', () => ({
  productService: {
    getProducts: jest.fn()
  }
}));

const mockAddToCart = jest.fn();
const mockGetItemQuantity = jest.fn(() => 0);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <CartContext.Provider value={{
        addToCart: mockAddToCart,
        getItemQuantity: mockGetItemQuantity,
        items: [],
        total: 0,
        itemCount: 0,
        removeFromCart: jest.fn(),
        updateQuantity: jest.fn(),
        clearCart: jest.fn(),
        isInCart: jest.fn(() => false)
      }}>
        {component}
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemQuantity.mockReturnValue(0);
  });

  it('debe mostrar loading mientras carga productos', () => {
    productService.getProducts.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<Products />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('debe mostrar productos cuando se cargan correctamente', async () => {
    const mockProducts = [
      {
        id: 1,
        nombre: 'Filtro de Aceite',
        precio: 1500,
        stock: 10,
        codigo: 'FIL001',
        descripcion: 'Filtro de aceite para motor',
        categoria: 'Repuestos'
      },
      {
        id: 2,
        nombre: 'Bujía',
        precio: 500,
        stock: 5,
        codigo: 'BUJ001',
        descripcion: 'Bujía de encendido',
        categoria: 'Repuestos'
      }
    ];
    
    productService.getProducts.mockResolvedValue({
      data: { products: mockProducts }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
      expect(screen.getByText('Bujía')).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay productos', async () => {
    productService.getProducts.mockResolvedValue({
      data: { products: [] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/no se encontraron productos/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga de productos', async () => {
    productService.getProducts.mockRejectedValue(new Error('Error de red'));
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
    });
  });

  it('debe filtrar productos por búsqueda', async () => {
    const mockProducts = [
      { id: 1, nombre: 'Filtro', precio: 1500, stock: 10, codigo: 'FIL001', descripcion: 'Test' }
    ];
    
    productService.getProducts.mockResolvedValue({
      data: { products: mockProducts }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Filtro')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/buscar productos/i);
    fireEvent.change(searchInput, { target: { value: 'Filtro' } });
    
    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Filtro' })
      );
    });
  });

  it('debe agregar producto al carrito cuando se hace clic en el botón', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Filtro de Aceite',
      precio: 1500,
      stock: 10,
      codigo: 'FIL001',
      descripcion: 'Test'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText(/agregar al carrito/i);
    fireEvent.click(addButton);
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('debe deshabilitar botón cuando el producto no tiene stock', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Producto Sin Stock',
      precio: 1500,
      stock: 0,
      codigo: 'OUT001',
      descripcion: 'Test'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Producto Sin Stock')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText(/sin stock/i);
    expect(addButton).toBeDisabled();
  });

  it('debe mostrar precio formateado correctamente', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Producto',
      precio: 1500.50,
      stock: 10,
      codigo: 'PROD001',
      descripcion: 'Test'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/1.500/i)).toBeInTheDocument();
    });
  });

  it('debe cambiar filtro de categoría', async () => {
    productService.getProducts.mockResolvedValue({
      data: { products: [] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      const categorySelect = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categorySelect);
    });
    
    await waitFor(() => {
      const repuestosOption = screen.getByText('Repuestos');
      fireEvent.click(repuestosOption);
    });
    
    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ categoria: 'repuestos' })
      );
    });
  });

  it('debe mostrar snackbar cuando se agrega producto al carrito', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Filtro de Aceite',
      precio: 1500,
      stock: 10,
      codigo: 'FIL001',
      descripcion: 'Test'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText(/agregar al carrito/i);
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/agregado al carrito/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla agregar al carrito', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Producto',
      precio: 1500,
      stock: 10,
      codigo: 'PROD001',
      descripcion: 'Test'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    mockAddToCart.mockImplementation(() => {
      throw new Error('Error al agregar');
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Producto')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText(/agregar al carrito/i);
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar chips de stock con colores correctos', async () => {
    const mockProducts = [
      { id: 1, nombre: 'Sin Stock', precio: 1000, stock: 0, codigo: 'OUT001', descripcion: 'Test' },
      { id: 2, nombre: 'Poco Stock', precio: 1000, stock: 3, codigo: 'LOW001', descripcion: 'Test' },
      { id: 3, nombre: 'En Stock', precio: 1000, stock: 10, codigo: 'OK001', descripcion: 'Test' }
    ];
    
    productService.getProducts.mockResolvedValue({
      data: { products: mockProducts }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/sin stock/i)).toBeInTheDocument();
      expect(screen.getByText(/poco stock/i)).toBeInTheDocument();
      expect(screen.getByText(/en stock/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar categoría del producto si existe', async () => {
    const mockProduct = {
      id: 1,
      nombre: 'Producto',
      precio: 1500,
      stock: 10,
      codigo: 'PROD001',
      descripcion: 'Test',
      categoria: 'Repuestos'
    };
    
    productService.getProducts.mockResolvedValue({
      data: { products: [mockProduct] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('Repuestos')).toBeInTheDocument();
    });
  });

  it('debe cambiar ordenamiento', async () => {
    productService.getProducts.mockResolvedValue({
      data: { products: [] }
    });
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/ordenar por/i);
      fireEvent.mouseDown(sortSelect);
    });
    
    await waitFor(() => {
      const precioOption = screen.getByText('Precio');
      fireEvent.click(precioOption);
    });
    
    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'precio' })
      );
    });
  });
});

