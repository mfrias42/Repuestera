# API Documentation - Repuestera Backend

## Información General

- **Base URL**: `http://localhost:3000/api`
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Bearer Token
- **Content-Type**: `application/json` (excepto para uploads: `multipart/form-data`)

## Autenticación

### Registro de Usuario
**POST** `/auth/register`

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123",
  "telefono": "+541234567890",
  "direccion": "Av. Corrientes 1234, CABA"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+541234567890",
    "direccion": "Av. Corrientes 1234, CABA",
    "activo": true,
    "fecha_registro": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login de Usuario
**POST** `/auth/login`

```json
{
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

### Login de Administrador
**POST** `/auth/admin/login`

```json
{
  "email": "admin@repuestera.com",
  "password": "admin123"
}
```

### Obtener Información del Usuario Autenticado
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "user": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "tipo": "usuario"
  }
}
```

## Productos

### Listar Productos
**GET** `/products`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20, max: 100)
- `categoria_id` (opcional): Filtrar por categoría
- `search` (opcional): Búsqueda por nombre o descripción
- `min_price` (opcional): Precio mínimo
- `max_price` (opcional): Precio máximo
- `in_stock` (opcional): Solo productos en stock (true/false)
- `order_by` (opcional): Campo de ordenamiento (nombre, precio, stock, fecha_creacion)
- `order_direction` (opcional): Dirección (ASC/DESC)

**Ejemplo:**
```
GET /products?page=1&limit=10&categoria_id=1&search=filtro&min_price=100&max_price=500&in_stock=true&order_by=precio&order_direction=ASC
```

**Respuesta:**
```json
{
  "products": [
    {
      "id": 1,
      "nombre": "Filtro de Aceite",
      "descripcion": "Filtro de aceite para motor",
      "precio": 250.00,
      "stock": 15,
      "imagen": "/uploads/products/product_1642234567890_abc123.jpg",
      "categoria_id": 1,
      "categoria_nombre": "Motor",
      "codigo_producto": "FO001",
      "marca": "Bosch",
      "modelo": "Universal",
      "año_desde": 2010,
      "año_hasta": 2023,
      "activo": true,
      "fecha_creacion": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

### Obtener Producto por ID
**GET** `/products/:id`

**Respuesta:**
```json
{
  "product": {
    "id": 1,
    "nombre": "Filtro de Aceite",
    "descripcion": "Filtro de aceite para motor",
    "precio": 250.00,
    "stock": 15,
    "imagen": "/uploads/products/product_1642234567890_abc123.jpg",
    "categoria_id": 1,
    "categoria_nombre": "Motor",
    "codigo_producto": "FO001",
    "marca": "Bosch",
    "modelo": "Universal",
    "año_desde": 2010,
    "año_hasta": 2023,
    "activo": true,
    "fecha_creacion": "2024-01-15T10:30:00.000Z"
  }
}
```

### Crear Producto (Admin)
**POST** `/products`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
nombre: Filtro de Aceite Premium
descripcion: Filtro de aceite de alta calidad
precio: 350.50
stock: 25
categoria_id: 1
codigo_producto: FOP001
marca: Bosch
modelo: Premium
año_desde: 2015
año_hasta: 2024
imagen: [archivo de imagen]
```

**Respuesta (201):**
```json
{
  "message": "Producto creado exitosamente",
  "product": {
    "id": 2,
    "nombre": "Filtro de Aceite Premium",
    "precio": 350.50,
    "stock": 25,
    "imagen": "/uploads/products/product_1642234567890_def456.jpg",
    // ... otros campos
  }
}
```

### Actualizar Producto (Admin)
**PUT** `/products/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### Actualizar Solo Stock (Admin)
**PATCH** `/products/:id/stock`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "stock": 50
}
```

### Eliminar Producto (Admin)
**DELETE** `/products/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Respuesta:**
```json
{
  "message": "Producto eliminado exitosamente",
  "product_id": 1
}
```

### Reportes de Stock (Admin)

#### Productos con Stock Bajo
**GET** `/products/reports/low-stock?threshold=5`

#### Productos Sin Stock
**GET** `/products/reports/out-of-stock`

## Categorías

### Listar Categorías (Público)
**GET** `/users/categories`

**Respuesta:**
```json
{
  "categories": [
    {
      "id": 1,
      "nombre": "Motor",
      "descripcion": "Repuestos para motor",
      "activo": true,
      "productos_count": 15,
      "fecha_creacion": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Crear Categoría (Admin)
**POST** `/users/categories`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Transmisión",
  "descripcion": "Repuestos para sistema de transmisión"
}
```

## Usuarios (Admin)

### Listar Usuarios
**GET** `/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`, `limit`, `search` (similares a productos)

### Obtener Usuario por ID
**GET** `/users/:id`

### Actualizar Usuario (Super Admin)
**PUT** `/users/:id`

### Desactivar Usuario (Super Admin)
**DELETE** `/users/:id`

## Administradores (Super Admin)

### Listar Administradores
**GET** `/users/admins/list`

### Crear Administrador
**POST** `/users/admins`

**Body:**
```json
{
  "nombre": "Ana",
  "apellido": "García",
  "email": "ana@repuestera.com",
  "password": "admin123",
  "rol": "admin"
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Solicitud incorrecta |
| 401 | No autorizado |
| 403 | Prohibido |
| 404 | No encontrado |
| 409 | Conflicto |
| 500 | Error interno del servidor |

## Formato de Errores

```json
{
  "error": "Tipo de error",
  "message": "Descripción del error",
  "details": [
    {
      "field": "email",
      "message": "El email debe ser válido",
      "value": "email-invalido"
    }
  ]
}
```

## Ejemplos de Uso con cURL

### Registro de usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@ejemplo.com",
    "password": "password123",
    "telefono": "+541234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "password123"
  }'
```

### Obtener productos
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Crear producto con imagen
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <admin_token>" \
  -F "nombre=Filtro de Aceite" \
  -F "descripcion=Filtro de alta calidad" \
  -F "precio=250.50" \
  -F "stock=20" \
  -F "categoria_id=1" \
  -F "imagen=@/path/to/image.jpg"
```

## Rate Limiting

- **Límite general**: 100 requests por 15 minutos por IP
- **Login**: 5 intentos por 15 minutos por IP
- **Registro**: 3 registros por hora por IP

## Notas Importantes

1. **Tokens JWT**: Expiran en 24 horas por defecto
2. **Imágenes**: Máximo 5MB, formatos JPG, PNG, WebP, GIF
3. **Paginación**: Máximo 100 elementos por página
4. **Búsqueda**: Mínimo 2 caracteres, máximo 100
5. **Soft Delete**: Los productos se marcan como inactivos, no se eliminan físicamente