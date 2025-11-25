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

      // Assert - MODIFICADO PARA FALLAR INTENCIONALMENTE
      expect(product.id).toBe(99999); // ID incorrecto para forzar el fallo
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

  describe('findAll', () => {
    test('debe retornar productos con paginación básica', async () => {
      // Arrange
      executeQuery.mockResolvedValue(mockData.products);

      // Act
      const products = await Product.findAll({ limit: 10, offset: 0 });

      // Assert
      expect(products).toBeInstanceOf(Array);
      expect(products[0]).toBeInstanceOf(Product);
    });

    test('debe filtrar por categoría', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const products = await Product.findAll({ categoria_id: 1, limit: 10, offset: 0 });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria_id = ?'),
        expect.arrayContaining([1])
      );
    });

    test('debe filtrar por búsqueda', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const products = await Product.findAll({ search: 'filtro', limit: 10, offset: 0 });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIKE ?'),
        expect.any(Array)
      );
    });

    test('debe filtrar por precio mínimo y máximo', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const products = await Product.findAll({ minPrice: 10, maxPrice: 50, limit: 10, offset: 0 });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('precio >= ?'),
        expect.arrayContaining([10, 50])
      );
    });

    test('debe filtrar por stock disponible', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.products[0]]);

      // Act
      const products = await Product.findAll({ inStock: true, limit: 10, offset: 0 });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('stock > 0'),
        expect.any(Array)
      );
    });

    test('debe ordenar por nombre ASC', async () => {
      // Arrange
      executeQuery.mockResolvedValue(mockData.products);

      // Act
      const products = await Product.findAll({ orderBy: 'nombre', orderDirection: 'ASC', limit: 10, offset: 0 });

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY p.nombre ASC'),
        expect.any(Array)
      );
    });
  });

  describe('count', () => {
    test('debe contar todos los productos activos', async () => {
      // Arrange
      executeQuery.mockResolvedValue([{ total: 10 }]);

      // Act
      const count = await Product.count();

      // Assert
      expect(count).toBe(10);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        []
      );
    });

    test('debe contar productos con filtros', async () => {
      // Arrange
      executeQuery.mockResolvedValue([{ total: 5 }]);

      // Act
      const count = await Product.count({ categoria_id: 1, search: 'filtro' });

      // Assert
      expect(count).toBe(5);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria_id = ?'),
        expect.any(Array)
      );
    });
  });

  describe('updateStock', () => {
    test('debe actualizar el stock correctamente', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await product.updateStock(50);

      // Assert
      expect(result.stock).toBe(50);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE productos SET stock = ?'),
        [50, product.id]
      );
    });

    test('debe rechazar stock negativo', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);

      // Act & Assert
      await expect(product.updateStock(-1)).rejects.toThrow('El stock no puede ser negativo');
    });
  });

  describe('reduceStock', () => {
    test('debe reducir el stock correctamente', async () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 10 });
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await product.reduceStock(5);

      // Assert
      expect(result.stock).toBe(5);
    });

    test('debe rechazar cantidad inválida', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);

      // Act & Assert
      await expect(product.reduceStock(0)).rejects.toThrow('La cantidad debe ser mayor a 0');
      await expect(product.reduceStock(-1)).rejects.toThrow('La cantidad debe ser mayor a 0');
    });

    test('debe rechazar si no hay stock suficiente', async () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 5 });

      // Act & Assert
      await expect(product.reduceStock(10)).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('increaseStock', () => {
    test('debe aumentar el stock correctamente', async () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 10 });
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await product.increaseStock(5);

      // Assert
      expect(result.stock).toBe(15);
    });

    test('debe rechazar cantidad inválida', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);

      // Act & Assert
      await expect(product.increaseStock(0)).rejects.toThrow('La cantidad debe ser mayor a 0');
    });
  });

  describe('activate', () => {
    test('debe activar un producto correctamente', async () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], activo: false });
      executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await product.activate();

      // Assert
      expect(result.activo).toBe(true);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('activo = TRUE'),
        [product.id]
      );
    });
  });

  describe('isInStock', () => {
    test('debe retornar true si hay stock', () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 10 });

      // Act & Assert
      expect(product.isInStock()).toBe(true);
    });

    test('debe retornar false si no hay stock', () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 0 });

      // Act & Assert
      expect(product.isInStock()).toBe(false);
    });
  });

  describe('isLowStock', () => {
    test('debe retornar true si el stock está bajo', () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 3 });

      // Act & Assert
      expect(product.isLowStock(5)).toBe(true);
    });

    test('debe retornar false si el stock no está bajo', () => {
      // Arrange
      const product = new Product({ ...mockData.products[0], stock: 10 });

      // Act & Assert
      expect(product.isLowStock(5)).toBe(false);
    });
  });

  describe('getRelatedProducts', () => {
    test('debe retornar productos relacionados', async () => {
      // Arrange
      const productData = { ...mockData.products[0], categoria_id: 1 };
      const product = new Product(productData);
      const relatedProducts = [{ ...mockData.products[1], categoria_id: 1 }];
      executeQuery.mockResolvedValue(relatedProducts);

      // Act
      const products = await product.getRelatedProducts(5);

      // Assert
      expect(products).toBeInstanceOf(Array);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria_id = ?'),
        expect.arrayContaining([product.categoria_id])
      );
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

  describe('getOutOfStockProducts', () => {
    test('debe retornar productos sin stock', async () => {
      // Arrange
      const outOfStockProducts = [
        { ...mockData.products[0], stock: 0 }
      ];
      executeQuery.mockResolvedValue(outOfStockProducts);

      // Act
      const products = await Product.getOutOfStockProducts();

      // Assert
      expect(products).toBeInstanceOf(Array);
      // La query contiene "stock = 0" en algún lugar
      expect(executeQuery).toHaveBeenCalled();
      const callArgs = executeQuery.mock.calls[0];
      expect(callArgs[0]).toMatch(/stock\s*=\s*0/i);
    });
  });

  describe('update', () => {
    test('debe rechazar actualización sin campos válidos', async () => {
      // Arrange
      const product = new Product(mockData.products[0]);

      // Act & Assert
      await expect(product.update({ campo_invalido: 'valor' })).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });
});

