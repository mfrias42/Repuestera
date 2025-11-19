/**
 * Tests unitarios para el modelo Product
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de dependencias externas ANTES de importar los módulos
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

const Product = require('../../../models/Product');
const { executeQuery } = require('../../../config/database-mysql');
const { mockData } = require('../../helpers/db-mock');

describe('Product Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debe crear una instancia de Product con los datos proporcionados', () => {
      // Arrange
      const productData = mockData.products[0];

      // Act
      const product = new Product(productData);

      // Assert
      expect(product.id).toBe(productData.id);
      expect(product.nombre).toBe(productData.nombre);
      expect(product.precio).toBe(productData.precio);
      expect(product.stock).toBe(productData.stock);
    });
  });

  describe('findById', () => {
    test('debe retornar un producto cuando existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const product = await Product.findById(1);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(1);
      expect(product.nombre).toBe('Filtro de Aceite');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.*'),
        [1]
      );
    });

    test('debe retornar null cuando el producto no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const product = await Product.findById(999);

      // Assert
      expect(product).toBeNull();
    });
  });

  describe('findByCode', () => {
    test('debe retornar un producto cuando el código existe', async () => {
      // Arrange
      const codigo = 'FO001';
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const product = await Product.findByCode(codigo);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.codigo_producto).toBe(codigo);
    });

    test('debe retornar null cuando el código no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const product = await Product.findByCode('INVALID');

      // Assert
      expect(product).toBeNull();
    });
  });

  describe('create', () => {
    test('debe crear un nuevo producto correctamente', async () => {
      // Arrange
      const productData = {
        nombre: 'Nuevo Producto',
        descripcion: 'Descripción del producto',
        precio: 29.99,
        stock: 10,
        categoria_id: 1,
        codigo_producto: 'NP001',
        marca: 'Test',
        modelo: 'Model X',
        año_desde: 2020,
        año_hasta: 2024
      };
      
      executeQuery
        .mockResolvedValueOnce({ insertId: 2 })
        .mockResolvedValueOnce([{
          ...productData,
          id: 2,
          activo: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date()
        }]);

      // Act
      const product = await Product.create(productData);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(product.nombre).toBe(productData.nombre);
      expect(product.precio).toBe(productData.precio);
    });

    test('debe manejar valores null/undefined correctamente', async () => {
      // Arrange
      const productData = {
        nombre: 'Producto Simple',
        precio: 19.99,
        stock: 5
        // Sin campos opcionales
      };
      
      executeQuery
        .mockResolvedValueOnce({ insertId: 3 })
        .mockResolvedValueOnce([{
          ...productData,
          id: 3,
          descripcion: null,
          imagen: null,
          categoria_id: null,
          codigo_producto: null,
          marca: null,
          modelo: null,
          año_desde: null,
          año_hasta: null,
          activo: true
        }]);

      // Act
      const product = await Product.create(productData);

      // Assert
      expect(product).toBeInstanceOf(Product);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO productos'),
        expect.arrayContaining([null, null, null])
      );
    });

    test('debe lanzar error si no se puede crear el producto', async () => {
      // Arrange
      const productData = {
        nombre: 'Producto',
        precio: 10.00,
        stock: 1
      };
      
      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(Product.create(productData)).rejects.toThrow('Error al crear producto');
    });
  });

  describe('deactivate', () => {
    test('debe desactivar un producto correctamente', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await product.deactivate();

      // Assert
      expect(result.activo).toBe(false);
      expect(executeQuery).toHaveBeenCalledWith(
        'UPDATE productos SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
        [product.id]
      );
    });
  });

  describe('update', () => {
    test('debe actualizar campos permitidos correctamente', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);
      const updateData = {
        nombre: 'Producto Actualizado',
        precio: 25.99,
        stock: 100
      };
      
      executeQuery
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([{
          ...mockData.products[0],
          ...updateData
        }]);

      // Act
      const updatedProduct = await product.update(updateData);

      // Assert
      expect(updatedProduct.nombre).toBe(updateData.nombre);
      expect(updatedProduct.precio).toBe(updateData.precio);
    });
  });

  describe('getLowStockProducts', () => {
    test('debe retornar productos con stock bajo', async () => {
      // Arrange
      const threshold = 10;
      const lowStockProducts = [
        { ...mockData.products[0], stock: 5 }
      ];
      executeQuery.mockResolvedValue(lowStockProducts);

      // Act
      const products = await Product.getLowStockProducts(threshold);

      // Assert
      expect(products).toBeInstanceOf(Array);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('stock <= ?'),
        [threshold]
      );
    });
  });
});

