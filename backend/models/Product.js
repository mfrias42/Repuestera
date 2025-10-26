const { executeQuery } = require('../config/database-mysql');

class Product {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.precio = data.precio;
    this.stock = data.stock;
    this.imagen = data.imagen;
    this.categoria_id = data.categoria_id;
    this.categoria_nombre = data.categoria_nombre;
    this.codigo_producto = data.codigo_producto;
    this.marca = data.marca;
    this.modelo = data.modelo;
    this.año_desde = data.año_desde;
    this.año_hasta = data.año_hasta;
    this.activo = data.activo;
    this.fecha_creacion = data.fecha_creacion;
    this.fecha_actualizacion = data.fecha_actualizacion;
  }

  // Crear nuevo producto
  static async create(productData) {
    const {
      nombre, descripcion, precio, stock, imagen, categoria_id,
      codigo_producto, marca, modelo, año_desde, año_hasta
    } = productData;
    
    const query = `
      INSERT INTO productos 
      (nombre, descripcion, precio, stock, imagen, categoria_id, codigo_producto, marca, modelo, año_desde, año_hasta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Convertir undefined a null para evitar errores de MySQL
    const result = await executeQuery(query, [
      nombre, 
      descripcion || null, 
      precio, 
      stock, 
      imagen || null, 
      categoria_id || null,
      codigo_producto || null, 
      marca || null, 
      modelo || null, 
      año_desde || null, 
      año_hasta || null
    ]);
    
    if (result.insertId) {
      return await Product.findById(result.insertId);
    }
    
    throw new Error('Error al crear producto');
  }

  // Buscar producto por ID
  static async findById(id) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.activo = TRUE
    `;
    
    const results = await executeQuery(query, [id]);
    
    if (results.length > 0) {
      return new Product(results[0]);
    }
    
    return null;
  }

  // Buscar producto por código
  static async findByCode(codigo) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.codigo_producto = ? AND p.activo = TRUE
    `;
    
    const results = await executeQuery(query, [codigo]);
    
    if (results.length > 0) {
      return new Product(results[0]);
    }
    
    return null;
  }

  // Obtener todos los productos con paginación
  static async findAll(options = {}) {
    const {
      limit = 20,
      offset = 0,
      categoria_id = null,
      search = null,
      orderBy = 'fecha_creacion',
      orderDirection = 'DESC',
      minPrice = null,
      maxPrice = null,
      inStock = null
    } = options;

    let query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = TRUE
    `;
    
    const params = [];

    // Filtros
    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR p.codigo_producto LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (minPrice !== null) {
      query += ' AND p.precio >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== null) {
      query += ' AND p.precio <= ?';
      params.push(maxPrice);
    }

    if (inStock === true) {
      query += ' AND p.stock > 0';
    } else if (inStock === false) {
      query += ' AND p.stock = 0';
    }

    // Ordenamiento
    const allowedOrderBy = ['nombre', 'precio', 'stock', 'fecha_creacion', 'fecha_actualizacion'];
    const allowedDirection = ['ASC', 'DESC'];
    
    if (allowedOrderBy.includes(orderBy) && allowedDirection.includes(orderDirection.toUpperCase())) {
      query += ` ORDER BY p.${orderBy} ${orderDirection.toUpperCase()}`;
    }

    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const results = await executeQuery(query, params);
    return results.map(product => new Product(product));
  }

  // Contar productos con filtros
  static async count(options = {}) {
    const {
      categoria_id = null,
      search = null,
      minPrice = null,
      maxPrice = null,
      inStock = null
    } = options;

    let query = 'SELECT COUNT(*) as total FROM productos p WHERE p.activo = TRUE';
    const params = [];

    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (search) {
      query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR p.codigo_producto LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (minPrice !== null) {
      query += ' AND p.precio >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== null) {
      query += ' AND p.precio <= ?';
      params.push(maxPrice);
    }

    if (inStock === true) {
      query += ' AND p.stock > 0';
    } else if (inStock === false) {
      query += ' AND p.stock = 0';
    }

    const results = await executeQuery(query, params);
    return results[0].total;
  }

  // Actualizar producto
  async update(updateData) {
    const allowedFields = [
      'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'categoria_id',
      'codigo_producto', 'marca', 'modelo', 'año_desde', 'año_hasta'
    ];
    
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
    
    const query = `UPDATE productos SET ${updates.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;
    await executeQuery(query, values);
    
    // Recargar datos del producto
    const updatedProduct = await Product.findById(this.id);
    Object.assign(this, updatedProduct);
    
    return this;
  }

  // Actualizar stock
  async updateStock(newStock) {
    if (newStock < 0) {
      throw new Error('El stock no puede ser negativo');
    }
    
    const query = 'UPDATE productos SET stock = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(query, [newStock, this.id]);
    
    this.stock = newStock;
    this.fecha_actualizacion = new Date();
    
    return this;
  }

  // Reducir stock (para ventas)
  async reduceStock(quantity) {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    
    if (this.stock < quantity) {
      throw new Error('Stock insuficiente');
    }
    
    const newStock = this.stock - quantity;
    return await this.updateStock(newStock);
  }

  // Aumentar stock (para reposición)
  async increaseStock(quantity) {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    
    const newStock = this.stock + quantity;
    return await this.updateStock(newStock);
  }

  // Desactivar producto (soft delete)
  async deactivate() {
    const query = 'UPDATE productos SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
    return this;
  }

  // Activar producto
  async activate() {
    const query = 'UPDATE productos SET activo = TRUE, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
    return this;
  }

  // Verificar si está en stock
  isInStock() {
    return this.stock > 0;
  }

  // Verificar si el stock está bajo (menos de 5 unidades)
  isLowStock(threshold = 5) {
    return this.stock <= threshold && this.stock > 0;
  }

  // Obtener productos relacionados (misma categoría)
  async getRelatedProducts(limit = 5) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.categoria_id = ? AND p.id != ? AND p.activo = TRUE
      ORDER BY RAND()
      LIMIT ?
    `;
    
    const results = await executeQuery(query, [this.categoria_id, this.id, limit]);
    return results.map(product => new Product(product));
  }

  // Obtener productos con stock bajo
  static async getLowStockProducts(threshold = 5) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.stock <= ? AND p.stock > 0 AND p.activo = TRUE
      ORDER BY p.stock ASC
    `;
    
    const results = await executeQuery(query, [threshold]);
    return results.map(product => new Product(product));
  }

  // Obtener productos sin stock
  static async getOutOfStockProducts() {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.stock = 0 AND p.activo = TRUE
      ORDER BY p.fecha_actualizacion DESC
    `;
    
    const results = await executeQuery(query);
    return results.map(product => new Product(product));
  }

  // Convertir a JSON
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: parseFloat(this.precio),
      stock: this.stock,
      imagen: this.imagen,
      categoria_id: this.categoria_id,
      categoria_nombre: this.categoria_nombre,
      codigo_producto: this.codigo_producto,
      marca: this.marca,
      modelo: this.modelo,
      año_desde: this.año_desde,
      año_hasta: this.año_hasta,
      activo: this.activo,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion,
      en_stock: this.isInStock(),
      stock_bajo: this.isLowStock()
    };
  }
}

module.exports = Product;