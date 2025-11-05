/**
 * Tests unitarios para el modelo Category
 * Patrón AAA: Arrange, Act, Assert
 */

const Category = require('../../../models/Category');
const { executeQuery } = require('../../../config/database-mysql');

// Mock de executeQuery
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

describe('Modelo Category', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debería crear una instancia de Category con los datos proporcionados', () => {
      // Arrange
      const categoryData = {
        id: 1,
        nombre: 'Motor',
        descripcion: 'Repuestos para motor',
        activo: true,
        productos_count: 5
      };

      // Act
      const category = new Category(categoryData);

      // Assert
      expect(category.id).toBe(1);
      expect(category.nombre).toBe('Motor');
      expect(category.descripcion).toBe('Repuestos para motor');
      expect(category.productos_count).toBe(5);
      expect(category.activo).toBe(true);
    });
  });

  describe('Category.create()', () => {
    test('debería crear una nueva categoría exitosamente', async () => {
      // Arrange
      const categoryData = {
        nombre: 'Motor',
        descripcion: 'Repuestos para motor'
      };

      const insertId = 1;
      const createdCategory = {
        id: insertId,
        ...categoryData,
        activo: true,
        fecha_creacion: new Date(),
        productos_count: 0
      };

      executeQuery
        .mockResolvedValueOnce({ insertId })
        .mockResolvedValueOnce([createdCategory]);

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(category).toBeInstanceOf(Category);
      expect(category.id).toBe(insertId);
      expect(category.nombre).toBe(categoryData.nombre);
    });

    test('debería lanzar error si no se puede crear la categoría', async () => {
      // Arrange
      const categoryData = {
        nombre: 'Test',
        descripcion: 'Descripción'
      };

      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(Category.create(categoryData)).rejects.toThrow('Error al crear categoría');
    });
  });

  describe('Category.findById()', () => {
    test('debería encontrar una categoría por ID con conteo de productos', async () => {
      // Arrange
      const categoryId = 1;
      const categoryData = {
        id: categoryId,
        nombre: 'Motor',
        descripcion: 'Repuestos para motor',
        activo: true,
        productos_count: 5
      };

      executeQuery.mockResolvedValue([categoryData]);

      // Act
      const category = await Category.findById(categoryId);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*, COUNT(p.id) as productos_count'),
        [categoryId]
      );
      expect(category).toBeInstanceOf(Category);
      expect(category.id).toBe(categoryId);
      expect(category.productos_count).toBe(5);
    });

    test('debería retornar null si la categoría no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const category = await Category.findById(999);

      // Assert
      expect(category).toBeNull();
    });
  });

  describe('Category.findByName()', () => {
    test('debería encontrar una categoría por nombre', async () => {
      // Arrange
      const nombre = 'Motor';
      const categoryData = {
        id: 1,
        nombre: nombre,
        descripcion: 'Repuestos para motor',
        activo: true,
        productos_count: 5
      };

      executeQuery.mockResolvedValue([categoryData]);

      // Act
      const category = await Category.findByName(nombre);

      // Assert
      expect(category).toBeInstanceOf(Category);
      expect(category.nombre).toBe(nombre);
    });
  });

  describe('Category.findAll()', () => {
    test('debería obtener todas las categorías con conteo de productos', async () => {
      // Arrange
      const categoriesData = [
        { id: 1, nombre: 'Motor', productos_count: 5, activo: true },
        { id: 2, nombre: 'Frenos', productos_count: 3, activo: true }
      ];

      executeQuery.mockResolvedValue(categoriesData);

      // Act
      const categories = await Category.findAll(true);

      // Assert
      expect(categories).toHaveLength(2);
      expect(categories[0]).toBeInstanceOf(Category);
      expect(categories[0].productos_count).toBe(5);
    });

    test('debería obtener todas las categorías sin conteo de productos', async () => {
      // Arrange
      const categoriesData = [
        { id: 1, nombre: 'Motor', activo: true },
        { id: 2, nombre: 'Frenos', activo: true }
      ];

      executeQuery.mockResolvedValue(categoriesData);

      // Act
      const categories = await Category.findAll(false);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categorias')
      );
      expect(categories).toHaveLength(2);
    });
  });

  describe('category.update()', () => {
    test('debería actualizar campos permitidos de la categoría', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor Original',
        descripcion: 'Descripción original',
        activo: true
      });

      const updateData = {
        nombre: 'Motor Actualizado',
        descripcion: 'Nueva descripción'
      };

      const updatedCategoryData = {
        ...category,
        ...updateData,
        productos_count: 5
      };

      executeQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updatedCategoryData]);

      // Act
      const result = await category.update(updateData);

      // Assert
      expect(category.nombre).toBe(updateData.nombre);
      expect(category.descripcion).toBe(updateData.descripcion);
      expect(result).toBe(category);
    });

    test('debería lanzar error si no hay campos válidos para actualizar', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      const updateData = {
        activo: false // Campo no permitido
      };

      // Act & Assert
      await expect(category.update(updateData)).rejects.toThrow('No hay campos válidos para actualizar');
    });
  });

  describe('category.deactivate()', () => {
    test('debería desactivar una categoría sin productos', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      executeQuery
        .mockResolvedValueOnce([{ total: 0 }]) // getProductCount
        .mockResolvedValueOnce([]); // UPDATE

      // Act
      const result = await category.deactivate();

      // Assert
      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(category.activo).toBe(false);
      expect(result).toBe(category);
    });

    test('debería lanzar error si la categoría tiene productos asociados', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      executeQuery.mockResolvedValueOnce([{ total: 5 }]); // getProductCount

      // Act & Assert
      await expect(category.deactivate()).rejects.toThrow(
        'No se puede desactivar una categoría que tiene productos asociados'
      );
    });
  });

  describe('category.activate()', () => {
    test('debería activar una categoría', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        activo: false
      });

      executeQuery.mockResolvedValue([]);

      // Act
      const result = await category.activate();

      // Assert
      expect(category.activo).toBe(true);
      expect(result).toBe(category);
    });
  });

  describe('category.getProducts()', () => {
    test('debería obtener productos de la categoría', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      const productsData = [
        { id: 1, nombre: 'Producto 1', categoria_id: 1, activo: true },
        { id: 2, nombre: 'Producto 2', categoria_id: 1, activo: true }
      ];

      executeQuery.mockResolvedValue(productsData);

      // Act
      const products = await category.getProducts();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.categoria_id = ?'),
        [category.id, 20, 0]
      );
      expect(products).toHaveLength(2);
    });
  });

  describe('category.getProductCount()', () => {
    test('debería contar productos de la categoría', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      const count = 5;
      executeQuery.mockResolvedValue([{ total: count }]);

      // Act
      const productCount = await category.getProductCount();

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = TRUE',
        [category.id]
      );
      expect(productCount).toBe(count);
    });
  });

  describe('category.getStats()', () => {
    test('debería obtener estadísticas de la categoría', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      const statsData = {
        total_productos: 10,
        total_stock: 50,
        precio_promedio: 25.50,
        precio_minimo: 10.00,
        precio_maximo: 50.00,
        productos_sin_stock: 2,
        productos_stock_bajo: 3
      };

      executeQuery.mockResolvedValue([statsData]);

      // Act
      const stats = await category.getStats();

      // Assert
      expect(stats).toHaveProperty('total_productos');
      expect(stats).toHaveProperty('precio_promedio');
      expect(stats).toHaveProperty('productos_sin_stock');
      expect(stats.total_productos).toBe(10);
      expect(stats.precio_promedio).toBe(25.50);
    });
  });

  describe('category.canDelete()', () => {
    test('debería retornar true si no tiene productos', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      executeQuery.mockResolvedValue([{ total: 0 }]);

      // Act
      const canDelete = await category.canDelete();

      // Assert
      expect(canDelete).toBe(true);
    });

    test('debería retornar false si tiene productos', async () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        activo: true
      });

      executeQuery.mockResolvedValue([{ total: 5 }]);

      // Act
      const canDelete = await category.canDelete();

      // Assert
      expect(canDelete).toBe(false);
    });
  });

  describe('Category.search()', () => {
    test('debería buscar categorías por término', async () => {
      // Arrange
      const searchTerm = 'motor';
      const categoriesData = [
        { id: 1, nombre: 'Motor', descripcion: 'Repuestos para motor', productos_count: 5, activo: true }
      ];

      executeQuery.mockResolvedValue(categoriesData);

      // Act
      const categories = await Category.search(searchTerm);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('nombre LIKE ?'),
        expect.arrayContaining([`%${searchTerm}%`])
      );
      expect(categories).toHaveLength(1);
      expect(categories[0]).toBeInstanceOf(Category);
    });
  });

  describe('category.toJSON()', () => {
    test('debería convertir a JSON con todos los campos necesarios', () => {
      // Arrange
      const category = new Category({
        id: 1,
        nombre: 'Motor',
        descripcion: 'Repuestos para motor',
        activo: true,
        fecha_creacion: new Date(),
        productos_count: 5
      });

      // Act
      const json = category.toJSON();

      // Assert
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('nombre');
      expect(json).toHaveProperty('descripcion');
      expect(json).toHaveProperty('productos_count');
      expect(json.productos_count).toBe(5);
    });
  });
});

