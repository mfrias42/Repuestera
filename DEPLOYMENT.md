# Guía de Despliegue - Repuestera Backend

## Requisitos del Sistema

### Software Requerido
- **Node.js**: v16.0.0 o superior
- **MySQL**: v8.0 o superior
- **npm**: v7.0.0 o superior

### Recursos del Servidor
- **RAM**: Mínimo 1GB, recomendado 2GB
- **Almacenamiento**: Mínimo 5GB para la aplicación y base de datos
- **CPU**: 1 core mínimo, 2 cores recomendado

## Instalación en Desarrollo

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd repuestera-backend
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=repuestera_db
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=3000
```

### 4. Configurar Base de Datos
```bash
# Crear la base de datos e insertar datos de prueba
npm run init-db
```

### 5. Iniciar en Modo Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Instalación en Producción

### 1. Preparar el Servidor

#### Ubuntu/Debian
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

#### CentOS/RHEL
```bash
# Actualizar sistema
sudo yum update -y

# Instalar Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar MySQL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo mysql_secure_installation

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar MySQL
```sql
-- Conectar como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE repuestera_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER 'repuestera_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON repuestera_db.* TO 'repuestera_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar la Aplicación
```bash
# Clonar repositorio
git clone <repository-url> /var/www/repuestera-backend
cd /var/www/repuestera-backend

# Instalar dependencias de producción
npm ci --only=production

# Configurar variables de entorno
cp .env.example .env
nano .env
```

Configuración de producción en `.env`:
```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=repuestera_user
DB_PASSWORD=password_seguro
DB_NAME=repuestera_db
JWT_SECRET=jwt_secret_muy_seguro_y_largo_para_produccion
PORT=3000
```

### 4. Inicializar Base de Datos
```bash
npm run init-db
```

### 5. Configurar PM2
```bash
# Crear archivo de configuración PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'repuestera-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Configurar PM2 para inicio automático
pm2 startup
pm2 save
```

### 6. Configurar Nginx (Opcional)
```bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/repuestera-backend
```

Configuración de Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/repuestera-backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/repuestera-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Configuración SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## Monitoreo y Mantenimiento

### Comandos PM2 Útiles
```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs repuestera-backend

# Reiniciar aplicación
pm2 restart repuestera-backend

# Recargar aplicación sin downtime
pm2 reload repuestera-backend

# Detener aplicación
pm2 stop repuestera-backend

# Eliminar aplicación de PM2
pm2 delete repuestera-backend
```

### Backup de Base de Datos
```bash
# Crear script de backup
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/repuestera"
mkdir -p \$BACKUP_DIR

mysqldump -u repuestera_user -p repuestera_db > \$BACKUP_DIR/repuestera_\$DATE.sql
gzip \$BACKUP_DIR/repuestera_\$DATE.sql

# Mantener solo los últimos 7 backups
find \$BACKUP_DIR -name "repuestera_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Programar backup diario
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/repuestera-backend/backup.sh") | crontab -
```

### Monitoreo de Logs
```bash
# Ver logs de aplicación
tail -f logs/combined.log

# Ver logs de errores
tail -f logs/err.log

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Actualización de la Aplicación

```bash
# Detener aplicación
pm2 stop repuestera-backend

# Hacer backup
./backup.sh

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
npm ci --only=production

# Reiniciar aplicación
pm2 start repuestera-backend
```

## Solución de Problemas Comunes

### Error de Conexión a Base de Datos
1. Verificar que MySQL esté ejecutándose: `sudo systemctl status mysql`
2. Verificar credenciales en `.env`
3. Verificar permisos del usuario de base de datos

### Error de Permisos de Archivos
```bash
# Configurar permisos correctos
sudo chown -R www-data:www-data /var/www/repuestera-backend
sudo chmod -R 755 /var/www/repuestera-backend
sudo chmod -R 777 /var/www/repuestera-backend/uploads
```

### Aplicación No Responde
```bash
# Verificar estado de PM2
pm2 status

# Reiniciar aplicación
pm2 restart repuestera-backend

# Ver logs para errores
pm2 logs repuestera-backend --lines 50
```

### Problemas de Memoria
```bash
# Verificar uso de memoria
free -h
pm2 monit

# Reiniciar aplicación si es necesario
pm2 restart repuestera-backend
```

## Configuración de Firewall

```bash
# Configurar UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3306 # Solo si MySQL está en servidor separado
sudo ufw enable
```

## Variables de Entorno de Producción

Asegúrate de configurar estas variables en producción:

```env
NODE_ENV=production
JWT_SECRET=clave_jwt_muy_segura_y_larga_para_produccion
DB_PASSWORD=password_muy_seguro
CORS_ORIGIN=https://tu-dominio-frontend.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Contacto y Soporte

Para problemas de despliegue o configuración, contactar al equipo de desarrollo.