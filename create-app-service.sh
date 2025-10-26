#!/bin/bash

# Script para crear App Service y conectar a MySQL Flexible Server
# TP05 - Ingeniería de Software 3

set -e

# Configuración
RESOURCE_GROUP="rg-repuestera-qa"
LOCATION="Brazil South"
MYSQL_SERVER="manufrias"
MYSQL_USER="A"
MYSQL_PASSWORD="4286Pka1#"
DATABASE_NAME="repuestera_db"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creando App Service y configurando conexión a MySQL${NC}"
echo "=================================================="

# Verificar que el usuario está logueado en Azure
echo -e "${YELLOW}📋 Verificando autenticación de Azure...${NC}"
if ! az account show > /dev/null 2>&1; then
    echo -e "${RED}❌ No estás logueado en Azure. Ejecuta 'az login' primero.${NC}"
    exit 1
fi

# Mostrar la suscripción actual
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Conectado a Azure - Suscripción: ${SUBSCRIPTION}${NC}"

# Crear App Service Plan
echo -e "${YELLOW}📦 Creando App Service Plan...${NC}"
az appservice plan create \
    --resource-group "$RESOURCE_GROUP" \
    --name "repuestera-plan" \
    --location "$LOCATION" \
    --sku F1 \
    --is-linux

echo -e "${GREEN}✅ App Service Plan creado${NC}"

# Crear App Service para Backend
echo -e "${YELLOW}🔧 Creando App Service para Backend...${NC}"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "repuestera-plan" \
    --name "repuestera-api" \
    --runtime "NODE:20-lts"

# Configurar variables de entorno para Backend
echo -e "${YELLOW}⚙️  Configurando variables de entorno para Backend...${NC}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "repuestera-api" \
    --settings \
        NODE_ENV=production \
        PORT=8000 \
        DB_TYPE=mysql \
        DB_HOST="$MYSQL_SERVER.mysql.database.azure.com" \
        DB_USER="$MYSQL_USER" \
        DB_PASSWORD="$MYSQL_PASSWORD" \
        DB_NAME="$DATABASE_NAME" \
        DB_PORT=3306 \
        JWT_SECRET="mysql_flexible_jwt_secret_2024" \
        JWT_REFRESH_SECRET="mysql_flexible_jwt_refresh_secret_2024"

echo -e "${GREEN}✅ Variables de entorno configuradas para Backend${NC}"

# Crear App Service para Frontend
echo -e "${YELLOW}🔧 Creando App Service para Frontend...${NC}"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "repuestera-plan" \
    --name "repuestera-web" \
    --runtime "NODE:20-lts"

# Configurar variables de entorno para Frontend
echo -e "${YELLOW}⚙️  Configurando variables de entorno para Frontend...${NC}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "repuestera-web" \
    --settings \
        PORT=8080 \
        REACT_APP_API_URL="https://repuestera-api.azurewebsites.net/api"

echo -e "${GREEN}✅ Variables de entorno configuradas para Frontend${NC}"

# Mostrar información de los recursos creados
echo -e "${GREEN}🎉 App Services creados exitosamente${NC}"
echo ""
echo -e "${YELLOW}📋 Información de los recursos:${NC}"
echo "  - App Service Plan: repuestera-plan"
echo "  - Backend API: repuestera-api"
echo "  - Frontend Web: repuestera-web"
echo "  - MySQL Server: $MYSQL_SERVER.mysql.database.azure.com"
echo "  - Database: $DATABASE_NAME"
echo ""
echo -e "${GREEN}🌐 URLs de acceso:${NC}"
echo "  - Backend: https://repuestera-api.azurewebsites.net"
echo "  - Frontend: https://repuestera-web.azurewebsites.net"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. Desplegar el código de la aplicación"
echo "2. Configurar el pipeline de Azure DevOps"
echo "3. Probar la conexión a MySQL"
echo "4. Verificar que la aplicación funciona correctamente"
