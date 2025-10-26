const { executeQuery } = require('../config/database-sqlite');

class Category {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.activo = data.activo;
    this.fecha_creacion = data.fecha_creacion;
    this.productos_count = data.productos_count || 0;
  }

  // Crear nueva categoría
  static async create(categoryData) {
    const { nombre, descripcion } = categoryData;
    
    const query = `
      INSERT INTO categorias (nombre, descripcion)
      VALUES (?, ?)
    `;
    
    const result = await executeQuery(query, [nombre, descripcion]);
    
    if (result.insertId) {
      return await Category.findById(result.insertId);
    }
    
    throw new Error('Error al crear categoría');
  }

  // Buscar categoría por ID
  static async findById(id) {
    const query = `
      SELECT c.*, COUNT(p.id) as productos_count
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
      WHERE c.id = ? AND c.activo = TRUE
      GROUP BY c.id
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length > 0) {
      return new Category(results[0]);
    }
    
    return null;
  }

  // Buscar categoría por nombre
  static async findByName(nombre) {
    const query = `
      SELECT c.*, COUNT(p.id) as productos_count
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
      WHERE c.nombre = ? AND c.activo = TRUE
      GROUP BY c.id
    `;
    
    const results = await executeQuery(query, [nombre]);
    
    if (results.length > 0) {
      return new Category(results[0]);
    }
    
    return null;
  }

  // Obtener todas las categorías
  static async findAll(includeProductCount = true) {
    let query;
    
    if (includeProductCount) {
      query = `
        SELECT c.*, COUNT(p.id) as productos_count
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
        WHERE c.activo = TRUE
        GROUP BY c.id
        ORDER BY c.nombre ASC
      `;
    } else {
      query = `
        SELECT * FROM categorias 
        WHERE activo = TRUE 
        ORDER BY nombre ASC
      `;
    }
    
    const results = await executeQuery(query);
    return results.map(category => new Category(category));
  }

  // Obtener categorías con productos
  static async findWithProducts() {
    const query = `
      SELECT c.*, COUNT(p.id) as productos_count
      FROM categorias c
      INNER JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
      WHERE c.activo = TRUE
      GROUP BY c.id
      HAVING productos_count > 0
      ORDER BY c.nombre ASC
    `;
    
    const results = await executeQuery(query);
    return results.map(category => new Category(results));
  }

  // Actualizar categoría
  async update(updateData) {
    const allowedFields = ['nombre', 'descripcion'];
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }
    
    values.push(this.id);
    
    const query = `UPDATE categorias SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);
    
    // Recargar datos de la categoría
    const updatedCategory = await Category.findById(this.id);
    Object.assign(this, updatedCategory);
    
    return this;
  }

  // Desactivar categoría (soft delete)
  async deactivate() {
    // Verificar si tiene productos asociados
    const productCount = await this.getProductCount();
    if (productCount > 0) {
      throw new Error('No se puede desactivar una categoría que tiene productos asociados');
    }
    
    const query = 'UPDATE categorias SET activo = FALSE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
    return this;
  }

  // Activar categoría
  async activate() {
    const query = 'UPDATE categorias SET activo = TRUE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
    return this;
  }

  // Obtener productos de la categoría
  async getProducts(options = {}) {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'nombre',
      orderDirection = 'ASC'
    } = options;

    const allowedOrderBy = ['nombre', 'precio', 'stock', 'fecha_creacion'];
    const allowedDirection = ['ASC', 'DESC'];
    
    let orderClause = 'ORDER BY p.nombre ASC';
    if (allowedOrderBy.includes(orderBy) && allowedDirection.includes(orderDirection.toUpperCase())) {
      orderClause = `ORDER BY p.${orderBy} ${orderDirection.toUpperCase()}`;
    }

    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.categoria_id = ? AND p.activo = TRUE
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const results = await executeQuery(query, [this.id, limit, offset]);
    
    // Importar Product aquí para evitar dependencias circulares
    const Product = require('./Product');
    return results.map(product => new Product(product));
  }

  // Contar productos de la categoría
  async getProductCount() {
    const query = 'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = TRUE';
    const results = await executeQuery(query, [this.id]);
    return results[0].total;
  }

  // Obtener estadísticas de la categoría
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(stock) as total_stock,
        AVG(precio) as precio_promedio,
        MIN(precio) as precio_minimo,
        MAX(precio) as precio_maximo,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
        SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END) as productos_stock_bajo
      FROM productos 
      WHERE categoria_id = ? AND activo = TRUE
    `;
    
    const results = await executeQuery(query, [this.id]);
    const stats = results[0];
    
    return {
      id: this.id,
      nombre: this.nombre,
      total_productos: stats.total_productos || 0,
      total_stock: stats.total_stock || 0,
      precio_promedio: parseFloat(stats.precio_promedio) || 0,
      precio_minimo: parseFloat(stats.precio_minimo) || 0,
      precio_maximo: parseFloat(stats.precio_maximo) || 0,
      productos_sin_stock: stats.productos_sin_stock || 0,
      productos_stock_bajo: stats.productos_stock_bajo || 0
    };
  }

  // Contar total de categorías
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM categorias WHERE activo = TRUE';
    const results = await executeQuery(query);
    return results[0].total;
  }

  // Buscar categorías por término
  static async search(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT c.*, COUNT(p.id) as productos_count
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
      WHERE c.activo = TRUE 
      AND (c.nombre LIKE ? OR c.descripcion LIKE ?)
      GROUP BY c.id
      ORDER BY c.nombre ASC
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const results = await executeQuery(query, [searchPattern, searchPattern, limit, offset]);
    return results.map(category => new Category(category));
  }

  // Verificar si se puede eliminar
  async canDelete() {
    const productCount = await this.getProductCount();
    return productCount === 0;
  }

  // Convertir a JSON
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      activo: this.activo,
      fecha_creacion: this.fecha_creacion,
      productos_count: this.productos_count
    };
  }
}

module.exports = Category;