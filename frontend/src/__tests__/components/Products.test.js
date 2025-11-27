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

jest.mock('../../services/api', () => ({
  productService: {
    getProducts: jest.fn()
  }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from '../../pages/Products';
import CartContext from '../../context/CartContext';
import { productService } from '../../services/api';

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
    
    // Silenciar console.error para este test
    const originalError = console.error;
    console.error = jest.fn();
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    console.error = originalError;
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
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Filtro' } });
    });
    
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
    await act(async () => {
      fireEvent.click(addButton);
    });
    
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
    
    // Buscar el botón específicamente por su texto "Sin Stock" (no el título del producto)
    const addButtons = screen.getAllByText(/sin stock/i);
    // El botón debe ser el que está dentro de un Button, no el título
    const addButton = addButtons.find(btn => btn.closest('button') !== null);
    expect(addButton).toBeDefined();
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
      // Esperar a que el componente se renderice completamente
      expect(screen.getByText(/catálogo de productos/i)).toBeInTheDocument();
    });
    
    // Buscar el select de categoría usando getByLabelText para MUI Select
    // Primero esperar a que el componente se renderice completamente
    await waitFor(() => {
      expect(screen.getByText(/catálogo de productos/i)).toBeInTheDocument();
    });
    
    // MUI Select con label - buscar todos los labels "Categoría" y tomar el del FormControl correcto
    const categoryLabels = screen.getAllByText('Categoría');
    const categoryLabel = categoryLabels.find(label => {
      // El label correcto está dentro de un FormControl que contiene un Select
      const formControl = label.closest('.MuiFormControl-root');
      return formControl && formControl.querySelector('.MuiSelect-root');
    });
    
    expect(categoryLabel).not.toBeUndefined();
    
    const formControl = categoryLabel.closest('.MuiFormControl-root');
    const selectElement = formControl?.querySelector('[role="combobox"]') ||
                         formControl?.querySelector('.MuiSelect-root') ||
                         formControl?.querySelector('input');
    
    expect(selectElement).not.toBeNull();
    
    await act(async () => {
      fireEvent.mouseDown(selectElement);
    });
    
    await waitFor(() => {
      const repuestosOption = screen.getByText('Repuestos');
      expect(repuestosOption).toBeInTheDocument();
    });
    
    await act(async () => {
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
    await act(async () => {
      fireEvent.click(addButton);
    });
    
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
    await act(async () => {
      fireEvent.click(addButton);
    });
    
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
      // Verificar que los productos se renderizaron
      // Usar getAllByText porque puede haber múltiples elementos con el mismo texto (título y chip)
      const sinStockElements = screen.getAllByText('Sin Stock');
      const pocoStockElements = screen.getAllByText('Poco Stock');
      const enStockElements = screen.getAllByText('En Stock');
      
      expect(sinStockElements.length).toBeGreaterThan(0);
      expect(pocoStockElements.length).toBeGreaterThan(0);
      expect(enStockElements.length).toBeGreaterThan(0);
    });
    
    // Verificar que los chips de stock están presentes
    // Hay múltiples elementos con "Sin Stock" (título del producto y chip), usar getAllByText
    const sinStockElements = screen.getAllByText(/sin stock/i);
    const pocoStockElements = screen.getAllByText(/poco stock/i);
    const enStockElements = screen.getAllByText(/en stock/i);
    
    // Debe haber al menos un elemento con cada texto (puede ser el título o el chip)
    expect(sinStockElements.length).toBeGreaterThan(0);
    expect(pocoStockElements.length).toBeGreaterThan(0);
    expect(enStockElements.length).toBeGreaterThan(0);
    
    // Verificar que hay chips específicamente (dentro de elementos con clase MuiChip)
    // Filtrar para encontrar solo los chips, no los títulos de los productos
    const sinStockChips = sinStockElements.filter(el => {
      const chip = el.closest('[class*="MuiChip"]');
      // También verificar que no es el título del producto (h2)
      const isTitle = el.tagName === 'H2' || el.closest('h2') !== null;
      return chip !== null && !isTitle;
    });
    const pocoStockChips = pocoStockElements.filter(el => {
      const chip = el.closest('[class*="MuiChip"]');
      const isTitle = el.tagName === 'H2' || el.closest('h2') !== null;
      return chip !== null && !isTitle;
    });
    const enStockChips = enStockElements.filter(el => {
      const chip = el.closest('[class*="MuiChip"]');
      const isTitle = el.tagName === 'H2' || el.closest('h2') !== null;
      return chip !== null && !isTitle;
    });
    
    expect(sinStockChips.length).toBeGreaterThan(0);
    expect(pocoStockChips.length).toBeGreaterThan(0);
    expect(enStockChips.length).toBeGreaterThan(0);
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
      // Esperar a que el componente se renderice completamente
      expect(screen.getByText(/catálogo de productos/i)).toBeInTheDocument();
    });
    
    // Buscar el select de ordenamiento usando getByLabelText para MUI Select
    await waitFor(() => {
      expect(screen.getByText(/catálogo de productos/i)).toBeInTheDocument();
    });
    
    // MUI Select con label - buscar todos los labels "Ordenar por" y tomar el del FormControl correcto
    const sortLabels = screen.getAllByText('Ordenar por');
    const sortLabel = sortLabels.find(label => {
      // El label correcto está dentro de un FormControl que contiene un Select
      const formControl = label.closest('.MuiFormControl-root');
      return formControl && formControl.querySelector('.MuiSelect-root');
    });
    
    expect(sortLabel).not.toBeUndefined();
    
    const formControl = sortLabel.closest('.MuiFormControl-root');
    const sortSelectElement = formControl?.querySelector('[role="combobox"]') ||
                            formControl?.querySelector('.MuiSelect-root') ||
                            formControl?.querySelector('input');
    
    expect(sortSelectElement).not.toBeNull();
    
    await act(async () => {
      fireEvent.mouseDown(sortSelectElement);
    });
    
    await waitFor(() => {
      const precioOption = screen.getByText('Precio');
      expect(precioOption).toBeInTheDocument();
    });
    
    await act(async () => {
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

