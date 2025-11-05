/**
 * Tests unitarios para el modelo Product
 * Patrón AAA: Arrange, Act, Assert
 */

const Product = require('../../../models/Product');
const { executeQuery } = require('../../../config/database-mysql');

// Mock de executeQuery
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

describe('Modelo Product', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debería crear una instancia de Product con los datos proporcionados', () => {
      // Arrange
      const productData = {
        id: 1,
        nombre: 'Filtro de Aceite',
        descripcion: 'Filtro de aceite para motor',
        precio: 25.99,
        stock: 50,
        categoria_id: 1,
        categoria_nombre: 'Motor',
        codigo_producto: 'FO001',
        marca: 'Bosch',
        activo: true
      };

      // Act
      const product = new Product(productData);

      // Assert
      expect(product.id).toBe(1);
      expect(product.nombre).toBe('Filtro de Aceite');
      expect(product.precio).toBe(25.99);
      expect(product.stock).toBe(50);
      expect(product.categoria_id).toBe(1);
      expect(product.activo).toBe(true);
    });
  });

  describe('Product.create()', () => {
    test('debería crear un nuevo producto exitosamente', async () => {
      // Arrange
      const productData = {
        nombre: 'Filtro de Aceite',
        descripcion: 'Filtro de aceite para motor',
        precio: 25.99,
        stock: 50,
        categoria_id: 1,
        codigo_producto: 'FO001',
        marca: 'Bosch'
      };

      const insertId = 1;
      const createdProduct = {
        id: insertId,
        ...productData,
        categoria_nombre: 'Motor',
        activo: true,
        fecha_creacion: new Date()
      };

      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdProduct]);

      // Act
      const product = await Product.create(productData);

      // Assert
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(insertId);
      expect(product.nombre).toBe(productData.nombre);
      expect(product.precio).toBe(productData.precio);
    });

    test('debería manejar campos opcionales como null', async () => {
      // Arrange
      const productData = {
        nombre: 'Producto Test',
        precio: 10.00,
        stock: 0
      };

      const insertId = 2;
      const createdProduct = {
        id: insertId,
        ...productData,
        descripcion: null,
        imagen: null,
        categoria_id: null,
        codigo_producto: null,
        marca: null,
        modelo: null,
        año_desde: null,
        año_hasta: null,
        activo: true
      };

      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdProduct]);

      // Act
      const product = await Product.create(productData);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO productos'),
        expect.arrayContaining([null, null, null, null, null, null, null])
      );
    });

    test('debería lanzar error si no se puede crear el producto', async () => {
      // Arrange
      const productData = {
        nombre: 'Producto Test',
        precio: 10.00,
        stock: 0
      };

      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(Product.create(productData)).rejects.toThrow('Error al crear producto');
    });
  });

  describe('Product.findById()', () => {
    test('debería encontrar un producto por ID', async () => {
      // Arrange
      const productId = 1;
      const productData = {
        id: productId,
        nombre: 'Filtro de Aceite',
        precio: 25.99,
        stock: 50,
        categoria_id: 1,
        categoria_nombre: 'Motor',
        activo: true
      };

      executeQuery.mockResolvedValue([productData]);

      // Act
      const product = await Product.findById(productId);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.*, c.nombre as categoria_nombre'),
        [productId]
      );
      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(productId);
    });

    test('debería retornar null si el producto no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const product = await Product.findById(999);

      // Assert
      expect(product).toBeNull();
    });
  });

  describe('Product.findByCode()', () => {
    test('debería encontrar un producto por código', async () => {
      // Arrange
      const codigo = 'FO001';
      const productData = {
        id: 1,
        nombre: 'Filtro de Aceite',
        codigo_producto: codigo,
        activo: true
      };

      executeQuery.mockResolvedValue([productData]);

      // Act
      const product = await Product.findByCode(codigo);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('codigo_producto = ?'),
        [codigo]
      );
      expect(product).toBeInstanceOf(Product);
      expect(product.codigo_producto).toBe(codigo);
    });
  });

  describe('Product.findAll()', () => {
    test('debería obtener todos los productos con opciones por defecto', async () => {
      // Arrange
      const productsData = [
        { id: 1, nombre: 'Producto 1', precio: 10.00, stock: 5, activo: true },
        { id: 2, nombre: 'Producto 2', precio: 20.00, stock: 10, activo: true }
      ];

      executeQuery.mockResolvedValue(productsData);

      // Act
      const products = await Product.findAll();

      // Assert
      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
    });

    test('debería aplicar filtros correctamente', async () => {
      // Arrange
      const options = {
        categoria_id: 1,
        search: 'filtro',
        minPrice: 10,
        maxPrice: 50,
        inStock: true
      };

      executeQuery.mockResolvedValue([]);

      // Act
      await Product.findAll(options);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria_id = ?'),
        expect.arrayContaining([1, '%filtro%', 10, 50])
      );
    });
  });

  describe('product.update()', () => {
    test('debería actualizar campos permitidos del producto', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        nombre: 'Producto Original',
        precio: 10.00,
        stock: 5,
        activo: true
      });

      const updateData = {
        nombre: 'Producto Actualizado',
        precio: 15.00
      };

      const updatedProductData = {
        ...product,
        ...updateData
      };

      executeQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updatedProductData]);

      // Act
      const result = await product.update(updateData);

      // Assert
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(product.nombre).toBe(updateData.nombre);
      expect(product.precio).toBe(updateData.precio);
      expect(result).toBe(product);
    });

    test('debería lanzar error si no hay campos válidos para actualizar', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        nombre: 'Producto',
        activo: true
      });

      const updateData = {
        campo_invalido: 'valor'
      };

      // Act & Assert
      await expect(product.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('product.updateStock()', () => {
    test('debería actualizar el stock correctamente', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 10,
        activo: true
      });

      const newStock = 20;
      executeQuery.mockResolvedValue([]);

      // Act
      const result = await product.updateStock(newStock);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE productos SET stock = ?'),
        [newStock, product.id]
      );
      expect(product.stock).toBe(newStock);
      expect(result).toBe(product);
    });

    test('debería lanzar error si el stock es negativo', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 10,
        activo: true
      });

      // Act & Assert
      await expect(product.updateStock(-5)).rejects.toThrow('El stock no puede ser negativo');
    });
  });

  describe('product.reduceStock()', () => {
    test('debería reducir el stock correctamente', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 50,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      await product.reduceStock(10);

      // Assert
      expect(executeQuery).toHaveBeenCalled();
      expect(product.stock).toBe(40);
    });

    test('debería lanzar error si la cantidad es menor o igual a 0', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 50,
        activo: true
      });

      // Act & Assert
      await expect(product.reduceStock(0)).rejects.toThrow('La cantidad debe ser mayor a 0');
      await expect(product.reduceStock(-5)).rejects.toThrow('La cantidad debe ser mayor a 0');
    });

    test('debería lanzar error si no hay stock suficiente', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 5,
        activo: true
      });

      // Act & Assert
      await expect(product.reduceStock(10)).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('product.increaseStock()', () => {
    test('debería aumentar el stock correctamente', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 50,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      await product.increaseStock(10);

      // Assert
      expect(executeQuery).toHaveBeenCalled();
      expect(product.stock).toBe(60);
    });

    test('debería lanzar error si la cantidad es menor o igual a 0', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 50,
        activo: true
      });

      // Act & Assert
      await expect(product.increaseStock(0)).rejects.toThrow('La cantidad debe ser mayor a 0');
    });
  });

  describe('product.isInStock()', () => {
    test('debería retornar true si hay stock', () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 10,
        activo: true
      });

      // Act
      const inStock = product.isInStock();

      // Assert
      expect(inStock).toBe(true);
    });

    test('debería retornar false si no hay stock', () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 0,
        activo: true
      });

      // Act
      const inStock = product.isInStock();

      // Assert
      expect(inStock).toBe(false);
    });
  });

  describe('product.isLowStock()', () => {
    test('debería retornar true si el stock está bajo el umbral', () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 3,
        activo: true
      });

      // Act
      const isLow = product.isLowStock(5);

      // Assert
      expect(isLow).toBe(true);
    });

    test('debería retornar false si el stock está por encima del umbral', () => {
      // Arrange
      const product = new Product({
        id: 1,
        stock: 10,
        activo: true
      });

      // Act
      const isLow = product.isLowStock(5);

      // Assert
      expect(isLow).toBe(false);
    });
  });

  describe('product.deactivate()', () => {
    test('debería desactivar un producto', async () => {
      // Arrange
      const product = new Product({
        id: 1,
        activo: true
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await product.deactivate();

      // Assert
      expect(product.activo).toBe(false);
      expect(result).toBe(product);
    });
  });

  describe('Product.getLowStockProducts()', () => {
    test('debería obtener productos con stock bajo', async () => {
      // Arrange
      const productsData = [
        { id: 1, nombre: 'Producto 1', stock: 3, activo: true },
        { id: 2, nombre: 'Producto 2', stock: 2, activo: true }
      ];

      executeQuery.mockResolvedValue(productsData);

      // Act
      const products = await Product.getLowStockProducts(5);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('stock <= ?'),
        [5]
      );
      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
    });
  });

  describe('product.toJSON()', () => {
    test('debería convertir a JSON con todos los campos necesarios', () => {
      // Arrange
      const product = new Product({
        id: 1,
        nombre: 'Producto Test',
        descripcion: 'Descripción',
        precio: 25.99,
        stock: 10,
        categoria_id: 1,
        categoria_nombre: 'Motor',
        activo: true
      });

      // Act
      const json = product.toJSON();

      // Assert
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('nombre');
      expect(json).toHaveProperty('precio');
      expect(json).toHaveProperty('stock');
      expect(json).toHaveProperty('en_stock');
      expect(json).toHaveProperty('stock_bajo');
      expect(json.en_stock).toBe(true);
    });
  });
});

