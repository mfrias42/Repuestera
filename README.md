# Sistema de Gestión para Repuestera - Full Stack

Un sistema completo de gestión para una repuestera que incluye frontend en React y backend en Node.js con manejo de productos, categorías, usuarios, administradores y carrito de compras.

## 🚀 Características

### Frontend (React)
- **Interfaz moderna**: Material-UI con diseño responsive
- **Carrito de compras**: Funcionalidad completa con persistencia
- **Autenticación**: Login/registro con contexto global
- **Gestión de productos**: Visualización, filtros y búsqueda
- **Panel de administración**: Gestión completa del sistema

### Backend (Node.js/Express)
- **API RESTful**: Endpoints bien documentados
- **Gestión de Productos**: CRUD completo con imágenes
- **Sistema de Categorías**: Organización de productos
- **Autenticación JWT**: Seguridad robusta
- **Base de Datos**: MySQL con relaciones optimizadas
- **Seguridad**: Rate limiting, validaciones, CORS

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd repuestera
```

2. **Instalar dependencias para todo el proyecto**
```bash
npm install
npm run install:all
```

3. **Configurar variables de entorno del backend**
```bash
cd backend
cp .env.example .env
```

Editar el archivo `backend/.env` con tus configuraciones:
```env
# Configuración del servidor
PORT=8000
NODE_ENV=development

# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=repuestera_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# JWT Secret
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# Configuración de archivos
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
```

4. **Configurar la base de datos**
```bash
# Crear la base de datos
mysql -u root -p
CREATE DATABASE repuestera_db;

# Ejecutar el script de inicialización
cd backend
npm run init-db
```

5. **Iniciar el proyecto completo**
```bash
# Desde la raíz del proyecto
npm run dev  # Inicia backend y frontend simultáneamente
```

O iniciar por separado:
```bash
# Backend (puerto 8000)
npm run backend:dev

# Frontend (puerto 3000)
npm run frontend:dev
```

## 📁 Estructura del Proyecto

```
Repuestera/
├── config/
│   └── database.js          # Configuración de MySQL
├── frontend/                # Aplicación React.js
│   ├── public/              # Archivos públicos
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── context/         # Context API (AuthContext)
│   │   ├── services/        # Servicios API (Axios)
│   │   └── App.js           # Componente principal
│   ├── package.json         # Dependencias del frontend
│   └── README.md            # Documentación del frontend
├── middleware/
│   ├── auth.js              # Autenticación JWT
│   ├── upload.js            # Manejo de imágenes
│   └── validation.js        # Validaciones comunes
├── models/
│   ├── Admin.js             # Modelo de administradores
│   ├── Category.js          # Modelo de categorías
│   ├── Product.js           # Modelo de productos
│   └── User.js              # Modelo de usuarios
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── products.js          # Rutas de productos
│   └── users.js             # Rutas de usuarios y categorías
├── scripts/
│   └── initDatabase.js      # Script de inicialización de BD
├── uploads/                 # Directorio de imágenes (se crea automáticamente)
├── .env.example             # Plantilla de variables de entorno
├── package.json             # Dependencias del backend
└── server.js                # Punto de entrada del backend
```

## 🔗 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login de usuarios
- `POST /api/auth/admin/login` - Login de administradores
- `GET /api/auth/me` - Información del usuario autenticado
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/verify` - Verificar token

### Productos
- `GET /api/products` - Listar productos (con filtros y paginación)
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `PATCH /api/products/:id/stock` - Actualizar stock (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)
- `GET /api/products/reports/low-stock` - Reporte de stock bajo (admin)
- `GET /api/products/reports/out-of-stock` - Reporte sin stock (admin)

### Usuarios y Categorías
- `GET /api/users` - Listar usuarios (admin)
- `GET /api/users/:id` - Obtener usuario por ID (admin)
- `PUT /api/users/:id` - Actualizar usuario (super admin)
- `DELETE /api/users/:id` - Desactivar usuario (super admin)
- `GET /api/users/admins/list` - Listar administradores (super admin)
- `POST /api/users/admins` - Crear administrador (super admin)
- `GET /api/users/categories` - Listar categorías (público)
- `GET /api/users/categories/:id` - Obtener categoría por ID
- `POST /api/users/categories` - Crear categoría (admin)
- `PUT /api/users/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/users/categories/:id` - Eliminar categoría (admin)

## 🎨 Frontend React.js

El proyecto incluye una aplicación frontend completa desarrollada en React.js que consume todos los endpoints del backend.

### Características del Frontend
- **Autenticación**: Login y registro con manejo de tokens JWT
- **Catálogo de Productos**: Visualización, búsqueda y filtrado
- **Panel de Administración**: Gestión completa para administradores
- **Perfil de Usuario**: Edición de información personal
- **Diseño Responsivo**: Interfaz moderna con Material-UI
- **Rutas Protegidas**: Control de acceso basado en roles

### Páginas Principales
- `/` - Catálogo de productos (público)
- `/login` - Autenticación de usuarios
- `/register` - Registro de nuevos usuarios
- `/profile` - Perfil de usuario (protegido)
- `/admin` - Panel de administración (solo admins)

### Tecnologías Frontend
- React.js 18
- Material-UI (MUI) 5
- React Router DOM 6
- Axios para peticiones HTTP
- Context API para manejo de estado

Para más detalles sobre el frontend, consulta el [README del frontend](./frontend/README.md).

## 🔐 Sistema de Roles

### Usuarios
- Pueden registrarse y hacer login
- Acceso a productos públicos
- Gestión de su propio perfil

### Administradores
- **admin**: Gestión de productos y categorías
- **super_admin**: Gestión completa incluyendo usuarios y otros administradores

### Permisos
- `read_products`: Leer productos
- `create_products`: Crear productos
- `update_products`: Actualizar productos
- `delete_products`: Eliminar productos
- `read_users`: Leer usuarios
- `manage_admins`: Gestionar administradores

## 📊 Base de Datos

### Tablas Principales
- **usuarios**: Información de clientes
- **administradores**: Información de administradores
- **categorias**: Categorías de productos
- **productos**: Información de productos
- **sesiones**: Gestión de sesiones activas

## 🖼️ Manejo de Imágenes

- Formatos soportados: JPG, PNG, WebP, GIF
- Tamaño máximo: 5MB (configurable)
- Almacenamiento: Sistema de archivos local
- Nombres únicos generados automáticamente
- Eliminación automática de imágenes anteriores

## 🛡️ Seguridad

- **JWT**: Autenticación basada en tokens
- **Bcrypt**: Hash seguro de contraseñas
- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración de origen cruzado
- **Validación**: Sanitización y validación de entrada

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar servidor en desarrollo con nodemon
npm run init-db    # Inicializar base de datos con datos de ejemplo
```

## 🧪 Datos de Prueba

El script de inicialización crea:
- **Super Admin**: admin@repuestera.com / admin123
- **Categorías**: Motor, Frenos, Suspensión, Eléctrico, Carrocería
- **Productos de ejemplo** en cada categoría

## 🚨 Manejo de Errores

La API devuelve errores en formato JSON consistente:

```json
{
  "error": "Tipo de error",
  "message": "Descripción del error",
  "details": [] // Detalles adicionales si aplica
}
```

Códigos de estado HTTP utilizados:
- `200`: Éxito
- `201`: Creado
- `400`: Solicitud incorrecta
- `401`: No autorizado
- `403`: Prohibido
- `404`: No encontrado
- `409`: Conflicto
- `500`: Error interno del servidor

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

