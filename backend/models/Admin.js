const { executeQuery } = require('../config/database-sqlite');
const bcrypt = require('bcryptjs');

class Admin {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.email = data.email;
    this.password = data.password;
    this.rol = data.rol;
    this.fecha_registro = data.fecha_registro;
    this.ultimo_acceso = data.ultimo_acceso;
    this.activo = data.activo;
  }

  // Crear nuevo administrador
  static async create(adminData) {
    const { nombre, apellido, email, password, rol = 'admin' } = adminData;
    
    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO administradores (nombre, apellido, email, password, rol)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [nombre, apellido, email, hashedPassword, rol]);
    
    if (result.insertId) {
      return await Admin.findById(result.insertId);
    }
    
    throw new Error('Error al crear administrador');
  }

  // Buscar administrador por ID
  static async findById(id) {
    const query = 'SELECT * FROM administradores WHERE id = ? AND activo = TRUE';
    const results = await executeQuery(query, [id]);
    
    if (results.length > 0) {
      return new Admin(results[0]);
    }
    
    return null;
  }

  // Buscar administrador por email
  static async findByEmail(email) {
    const query = 'SELECT * FROM administradores WHERE email = ? AND activo = TRUE';
    const results = await executeQuery(query, [email]);
    
    if (results.length > 0) {
      return new Admin(results[0]);
    }
    
    return null;
  }

  // Obtener todos los administradores
  static async findAll(limit = 50, offset = 0) {
    // Asegurar que limit y offset sean números enteros
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const query = `
      SELECT id, nombre, apellido, email, rol, fecha_registro, ultimo_acceso, activo
      FROM administradores 
      WHERE activo = TRUE 
      ORDER BY fecha_registro DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    
    const results = await executeQuery(query, []);
    return results.map(admin => new Admin(admin));
  }

  // Actualizar administrador
  async update(updateData) {
    const allowedFields = ['nombre', 'apellido', 'rol'];
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
    
    const query = `UPDATE administradores SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);
    
    // Recargar datos del administrador
    const updatedAdmin = await Admin.findById(this.id);
    Object.assign(this, updatedAdmin);
    
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
    
    const query = 'UPDATE administradores SET password = ? WHERE id = ?';
    await executeQuery(query, [hashedPassword, this.id]);
    
    this.password = hashedPassword;
    return true;
  }

  // Verificar password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Actualizar último acceso
  async updateLastAccess() {
    const query = 'UPDATE administradores SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.ultimo_acceso = new Date();
    return this;
  }

  // Desactivar administrador (soft delete)
  async deactivate() {
    const query = 'UPDATE administradores SET activo = FALSE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
    return this;
  }

  // Activar administrador
  async activate() {
    const query = 'UPDATE administradores SET activo = TRUE WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
    return this;
  }

  // Verificar si es super admin
  isSuperAdmin() {
    return this.rol === 'super_admin';
  }

  // Verificar si puede realizar acción administrativa
  canPerformAction(action) {
    const permissions = {
      'admin': ['read_products', 'create_products', 'update_products', 'delete_products', 'read_users'],
      'super_admin': ['read_products', 'create_products', 'update_products', 'delete_products', 
                     'read_users', 'create_users', 'update_users', 'delete_users',
                     'read_admins', 'create_admins', 'update_admins', 'delete_admins']
    };
    
    return permissions[this.rol]?.includes(action) || false;
  }

  // Contar total de administradores
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM administradores WHERE activo = TRUE';
    const results = await executeQuery(query);
    return results[0].total;
  }

  // Buscar administradores por término
  static async search(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT id, nombre, apellido, email, rol, fecha_registro, ultimo_acceso, activo
      FROM administradores 
      WHERE activo = TRUE 
      AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)
      ORDER BY fecha_registro DESC 
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const results = await executeQuery(query, [searchPattern, searchPattern, searchPattern, limit, offset]);
    return results.map(admin => new Admin(admin));
  }

  // Obtener estadísticas del administrador
  async getStats() {
    // Aquí podrías agregar consultas para obtener estadísticas específicas
    // como productos creados, última actividad, etc.
    return {
      id: this.id,
      nombre: `${this.nombre} ${this.apellido}`,
      rol: this.rol,
      ultimo_acceso: this.ultimo_acceso,
      fecha_registro: this.fecha_registro
    };
  }

  // Convertir a JSON (sin password)
  toJSON() {
    const { password, ...adminWithoutPassword } = this;
    return adminWithoutPassword;
  }
}

module.exports = Admin;