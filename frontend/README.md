# Frontend Repostería - React.js

Este es el frontend desarrollado en React.js para consumir los endpoints del backend de la aplicación de repostería.

## Características

- **Autenticación**: Login y registro de usuarios y administradores
- **Gestión de Productos**: Visualización, búsqueda y filtrado de productos
- **Panel de Administración**: Gestión completa de productos y usuarios (solo para administradores)
- **Perfil de Usuario**: Edición de información personal
- **Diseño Responsivo**: Interfaz moderna con Material-UI
- **Rutas Protegidas**: Control de acceso basado en roles

## Tecnologías Utilizadas

- React.js 18
- Material-UI (MUI) 5
- React Router DOM 6
- Axios para peticiones HTTP
- Context API para manejo de estado

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Navbar.js       # Barra de navegación
│   ├── ProtectedRoute.js # Rutas protegidas
│   ├── ProductManagement.js # Gestión de productos
│   └── UserManagement.js    # Gestión de usuarios
├── pages/              # Páginas principales
│   ├── Login.js        # Página de login
│   ├── Register.js     # Página de registro
│   ├── Products.js     # Catálogo de productos
│   ├── Admin.js        # Panel de administración
│   └── Profile.js      # Perfil de usuario
├── context/            # Context API
│   └── AuthContext.js  # Contexto de autenticación
├── services/           # Servicios API
│   └── api.js          # Configuración de Axios y servicios
└── App.js              # Componente principal
```

## Instalación y Configuración

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar la URL del backend**:
   Edita el archivo `src/services/api.js` y actualiza la `baseURL`:
   ```javascript
   const api = axios.create({
     baseURL: 'http://localhost:3000/api', // Cambia por la URL de tu backend
     timeout: 10000,
   });
   ```

3. **Ejecutar la aplicación**:
   ```bash
   npm start
   ```

   La aplicación estará disponible en `http://localhost:3000`

## Funcionalidades por Rol

### Usuarios Públicos
- Ver catálogo de productos
- Buscar y filtrar productos
- Registrarse en la plataforma
- Iniciar sesión

### Usuarios Registrados
- Todas las funcionalidades públicas
- Editar perfil personal
- Acceso a información de cuenta

### Administradores
- Todas las funcionalidades de usuarios registrados
- Gestión completa de productos (crear, editar, eliminar)
- Ver lista de usuarios registrados

### Super Administradores
- Todas las funcionalidades de administradores
- Gestión de usuarios (desactivar cuentas)
- Gestión de otros administradores

## Páginas Principales

### 1. Catálogo de Productos (`/` o `/products`)
- Lista todos los productos disponibles
- Funciones de búsqueda por nombre
- Filtrado por categoría
- Ordenamiento por precio y nombre
- Información de stock y precios

### 2. Login (`/login`)
- Formulario de autenticación
- Opción para login como administrador
- Redirección automática después del login

### 3. Registro (`/register`)
- Formulario de registro de usuarios
- Validación de campos
- Confirmación de contraseña

### 4. Panel de Administración (`/admin`)
- Gestión de productos (crear, editar, eliminar)
- Gestión de usuarios (solo super admin)
- Interfaz con pestañas para organizar funcionalidades

### 5. Perfil (`/profile`)
- Visualización de información personal
- Edición de datos de perfil
- Información de cuenta y estado

## Configuración del Backend

Asegúrate de que el backend esté ejecutándose y configurado correctamente:

1. El backend debe estar en `http://localhost:3000` (o actualiza la URL en `api.js`)
2. La base de datos debe estar configurada y las tablas creadas
3. Las variables de entorno del backend deben estar configuradas

## Características Técnicas

### Autenticación
- JWT tokens almacenados en localStorage
- Interceptores de Axios para manejo automático de tokens
- Renovación automática de tokens
- Logout automático en caso de tokens expirados

### Manejo de Errores
- Interceptores globales para errores de API
- Mensajes de error amigables al usuario
- Manejo de errores de red y timeouts

### Diseño Responsivo
- Interfaz adaptable a diferentes tamaños de pantalla
- Componentes optimizados para móviles y desktop
- Tema personalizado con colores apropiados para repostería

## Scripts Disponibles

- `npm start`: Ejecuta la aplicación en modo desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm test`: Ejecuta las pruebas
- `npm run eject`: Expone la configuración de webpack (irreversible)

## Notas Importantes

1. **CORS**: Asegúrate de que el backend tenga configurado CORS para permitir peticiones desde `http://localhost:3000`

2. **Variables de Entorno**: Para producción, considera usar variables de entorno para la URL del backend

3. **Seguridad**: Los tokens JWT se almacenan en localStorage. Para mayor seguridad en producción, considera usar httpOnly cookies

4. **Imágenes**: El sistema está preparado para manejar URLs de imágenes de productos

## Próximas Mejoras

- Implementación de carrito de compras
- Sistema de favoritos
- Paginación en el catálogo de productos
- Filtros avanzados
- Notificaciones push
- Modo oscuro
