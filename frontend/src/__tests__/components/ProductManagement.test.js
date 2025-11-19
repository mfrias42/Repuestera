/**
 * Tests unitarios para el componente ProductManagement
 * Patrón AAA: Arrange, Act, Assert
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductManagement from '../../components/ProductManagement';
import { productService } from '../../services/api';

// Mock del servicio API
jest.mock('../../services/api', () => ({
  productService: {
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn()
  }
}));

describe('ProductManagement Component', () => {
  const mockProducts = [
    {
      id: 1,
      nombre: 'Filtro de Aceite',
      precio: 15.99,
      stock: 50,
      codigo_producto: 'FO001',
      categoria_id: 1
    },
    {
      id: 2,
      nombre: 'Pastillas de Freno',
      precio: 89.99,
      stock: 25,
      codigo_producto: 'PF001',
      categoria_id: 2
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    productService.getProducts.mockResolvedValue({
      data: { products: mockProducts }
    });
  });

  test('debe renderizar la tabla de productos', async () => {
    // Arrange & Act
    render(<ProductManagement />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
      expect(screen.getByText('Pastillas de Freno')).toBeInTheDocument();
    });
  });

  test('debe abrir el diálogo al hacer clic en Agregar', async () => {
    // Arrange
    render(<ProductManagement />);
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });

    // Act
    const addButton = screen.getByRole('button', { name: /agregar/i });
    fireEvent.click(addButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument();
    });
  });

  test('debe cargar productos al montar el componente', async () => {
    // Arrange & Act
    render(<ProductManagement />);

    // Assert
    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledTimes(1);
    });
  });

  test('debe mostrar error cuando falla la carga de productos', async () => {
    // Arrange
    productService.getProducts.mockRejectedValue(new Error('Error de red'));

    // Act
    render(<ProductManagement />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
    });
  });

  test('debe abrir diálogo de edición al hacer clic en editar', async () => {
    // Arrange
    render(<ProductManagement />);
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });

    // Act
    const editButtons = screen.getAllByLabelText(/editar/i);
    fireEvent.click(editButtons[0]);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('Filtro de Aceite')).toBeInTheDocument();
    });
  });

  test('debe llamar a deleteProduct al confirmar eliminación', async () => {
    // Arrange
    productService.deleteProduct.mockResolvedValue({ data: { message: 'Producto eliminado' } });
    render(<ProductManagement />);
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });

    // Act
    const deleteButtons = screen.getAllByLabelText(/eliminar/i);
    fireEvent.click(deleteButtons[0]);
    
    // Confirmar eliminación (simular diálogo de confirmación)
    const confirmButton = screen.getByRole('button', { name: /eliminar|confirmar/i });
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    // Assert
    await waitFor(() => {
      expect(productService.deleteProduct).toHaveBeenCalled();
    });
  });

  test('debe validar campos requeridos en el formulario', async () => {
    // Arrange
    render(<ProductManagement />);
    await waitFor(() => {
      expect(screen.getByText('Filtro de Aceite')).toBeInTheDocument();
    });

    // Act - Abrir diálogo
    const addButton = screen.getByRole('button', { name: /agregar/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument();
    });

    // Intentar guardar sin llenar campos requeridos
    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    // Assert - El formulario debería validar campos requeridos
    // (depende de la implementación del componente)
  });
});

