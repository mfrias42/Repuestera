const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.email = data.email;
    this.password = data.password;
    this.telefono = data.telefono;
    this.direccion = data.direccion;
    this.fecha_registro = data.fecha_registro;
    this.activo = data.activo;
  }

  // Crear nuevo usuario
  static async create(userData) {
    const { nombre, apellido, email, password, telefono, direccion } = userData;
    
    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    // Convertir undefined a null para la base de datos
    const result = await executeQuery(query, [
      nombre, 
      apellido, 
      email, 
      hashedPassword, 
      telefono || null, 
      direccion || null
    ]);
    
    if (result.insertId) {
      return await User.findById(result.insertId);
    }
    
    throw new Error('Error al crear usuario');
  }

  // Buscar usuario por ID
  static async findById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE';
    const results = await executeQuery(query, [id]);
    
    if (results.length > 0) {
      return new User(results[0]);
    }
    
    return null;
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE';
    const results = await executeQuery(query, [email]);
    
    if (results.length > 0) {
      return new User(results[0]);
    }
    
    return null;
  }

  // Obtener todos los usuarios
  static async findAll(limit = 50, offset = 0) {
    // Asegurar que limit y offset sean números enteros
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const query = `
      SELECT id, nombre, apellido, email, telefono, direccion, fecha_registro, activo
      FROM usuarios 
      WHERE activo = TRUE 
      ORDER BY fecha_registro DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    
    const results = await executeQuery(query, []);
    return results.map(user => new User(user));
  }

  // Actualizar usuario
  async update(updateData) {
    const allowedFields = ['nombre', 'apellido', 'telefono', 'direccion'];
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
    
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);
    
    // Recargar datos del usuario
    const updatedUser = await User.findById(this.id);
    Object.assign(this, updatedUser);
    
    return this;
  }

  // Cambiar password
  async changePassword(currentPassword, newPassword) {
    // Verificar password actual
    const isValid = await bcrypt.compare(currentPassword, this.password);
    if (!isValid) {
      throw new Error('Password actual incorrecto');
    }
    
    // Hashear nuevo password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const query = 'UPDATE usuarios SET password = ? WHERE id = ?';
    await executeQuery(query, [hashedPassword, this.id]);
    
    this.password = hashedPassword;
    return true;
  }

  // Verificar password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Desactivar usuario (soft delete)
  async deactivate() {
    const query = 'UPDATE usuarios SET activo = FALSE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
    return this;
  }

  // Activar usuario
  async activate() {
    const query = 'UPDATE usuarios SET activo = TRUE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
    return this;
  }

  // Contar total de usuarios
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE';
    const results = await executeQuery(query);
    return results[0].total;
  }

  // Buscar usuarios por término
  static async search(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT id, nombre, apellido, email, telefono, direccion, fecha_registro, activo
      FROM usuarios 
      WHERE activo = TRUE 
      AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)
      ORDER BY fecha_registro DESC 
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const results = await executeQuery(query, [searchPattern, searchPattern, searchPattern, limit, offset]);
    return results.map(user => new User(user));
  }

  // Convertir a JSON (sin password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;