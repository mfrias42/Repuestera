/**
 * Tests unitarios para el modelo Category
 * Patrón AAA: Arrange, Act, Assert
 */

// Mock de dependencias externas ANTES de importar los módulos
jest.mock('../../../config/database-mysql', () => ({
  executeQuery: jest.fn()
}));

const Category = require('../../../models/Category');
const { executeQuery } = require('../../../config/database-mysql');
const { mockData } = require('../../helpers/db-mock');

describe('Category Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debe crear una instancia de Category con los datos proporcionados', () => {
      // Arrange
      const categoryData = mockData.categories[0];

      // Act
      const category = new Category(categoryData);

      // Assert
      expect(category.id).toBe(categoryData.id);
      expect(category.nombre).toBe(categoryData.nombre);
      expect(category.activo).toBe(true);
    });

    test('debe inicializar productos_count en 0 si no se proporciona', () => {
      // Arrange
      const categoryData = {
        ...mockData.categories[0],
        productos_count: undefined
      };

      // Act
      const category = new Category(categoryData);

      // Assert
      expect(category.productos_count).toBe(0);
    });
  });

  describe('findById', () => {
    test('debe retornar una categoría cuando existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([{
        ...mockData.categories[0],
        productos_count: 5
      }]);

      // Act
      const category = await Category.findById(1);

      // Assert
      expect(category).toBeInstanceOf(Category);
      expect(category.id).toBe(1);
      expect(category.nombre).toBe('Motor');
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*'),
        [1]
      );
    });

    test('debe retornar null cuando la categoría no existe', async () => {
      // Arrange
      executeQuery.mockResolvedValue([]);

      // Act
      const category = await Category.findById(999);

      // Assert
      expect(category).toBeNull();
    });
  });

  describe('findByName', () => {
    test('debe retornar una categoría cuando el nombre existe', async () => {
      // Arrange
      const nombre = 'Motor';
      executeQuery.mockResolvedValue([{
        ...mockData.categories[0],
        productos_count: 3
      }]);

      // Act
      const category = await Category.findByName(nombre);

      // Assert
      expect(category).toBeInstanceOf(Category);
      expect(category.nombre).toBe(nombre);
    });
  });

  describe('create', () => {
    test('debe crear una nueva categoría correctamente', async () => {
      // Arrange
      const categoryData = {
        nombre: 'Nueva Categoría',
        descripcion: 'Descripción de la categoría'
      };
      
      executeQuery
        .mockResolvedValueOnce({ insertId: 2 })
        .mockResolvedValueOnce([{
          ...categoryData,
          id: 2,
          activo: true,
          fecha_creacion: new Date(),
          productos_count: 0
        }]);

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(category).toBeInstanceOf(Category);
      expect(category.nombre).toBe(categoryData.nombre);
    });

    test('debe lanzar error si no se puede crear la categoría', async () => {
      // Arrange
      const categoryData = {
        nombre: 'Categoría',
        descripcion: 'Descripción'
      };
      
      executeQuery.mockResolvedValueOnce({ insertId: null });

      // Act & Assert
      await expect(Category.create(categoryData)).rejects.toThrow('Error al crear categoría');
    });
  });

  describe('findAll', () => {
    test('debe retornar todas las categorías con conteo de productos', async () => {
      // Arrange
      executeQuery.mockResolvedValue([
        { ...mockData.categories[0], productos_count: 5 },
        { ...mockData.categories[0], id: 2, nombre: 'Frenos', productos_count: 3 }
      ]);

      // Act
      const categories = await Category.findAll(true);

      // Assert
      expect(categories).toHaveLength(2);
      expect(categories[0]).toBeInstanceOf(Category);
      expect(categories[0].productos_count).toBe(5);
    });

    test('debe retornar categorías sin conteo cuando includeProductCount es false', async () => {
      // Arrange
      executeQuery.mockResolvedValue([mockData.categories[0]]);

      // Act
      const categories = await Category.findAll(false);

      // Assert
      expect(categories).toHaveLength(1);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categorias')
      );
    });
  });

  describe('getProductCount', () => {
    test('debe retornar el número de productos de la categoría', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery.mockResolvedValue([{ total: 5 }]);

      // Act
      const count = await category.getProductCount();

      // Assert
      expect(count).toBe(5);
      expect(executeQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = TRUE',
        [category.id]
      );
    });
  });

  describe('canDelete', () => {
    test('debe retornar true cuando no hay productos asociados', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery.mockResolvedValue([{ total: 0 }]);

      // Act
      const canDelete = await category.canDelete();

      // Assert
      expect(canDelete).toBe(true);
    });

    test('debe retornar false cuando hay productos asociados', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery.mockResolvedValue([{ total: 3 }]);

      // Act
      const canDelete = await category.canDelete();

      // Assert
      expect(canDelete).toBe(false);
    });
  });

  describe('deactivate', () => {
    test('debe desactivar una categoría sin productos', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce({ affectedRows: 1 });

      // Act
      const result = await category.deactivate();

      // Assert
      expect(result.activo).toBe(false);
    });

    test('debe lanzar error si la categoría tiene productos', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery.mockResolvedValue([{ total: 5 }]);

      // Act & Assert
      await expect(category.deactivate()).rejects.toThrow(
        'No se puede desactivar una categoría que tiene productos asociados'
      );
    });
  });

  describe('getStats', () => {
    test('debe retornar estadísticas de la categoría', async () => {
      // Arrange
      const category = new Category(mockData.categories[0]);
      executeQuery.mockResolvedValue([{
        total_productos: 10,
        total_stock: 150,
        precio_promedio: 25.50,
        precio_minimo: 10.00,
        precio_maximo: 50.00,
        productos_sin_stock: 2,
        productos_stock_bajo: 3
      }]);

      // Act
      const stats = await category.getStats();

      // Assert
      expect(stats).toHaveProperty('total_productos');
      expect(stats).toHaveProperty('precio_promedio');
      expect(stats.total_productos).toBe(10);
      expect(stats.precio_promedio).toBe(25.50);
    });
  });

  describe('toJSON', () => {
    test('debe retornar objeto JSON con campos correctos', () => {
      // Arrange
      const category = new Category({
        ...mockData.categories[0],
        productos_count: 5
      });

      // Act
      const json = category.toJSON();

      // Assert
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('nombre');
      expect(json).toHaveProperty('productos_count');
      expect(json.productos_count).toBe(5);
    });
  });
});

