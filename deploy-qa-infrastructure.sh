#!/bin/bash

# Script para desplegar infraestructura de QA
# TP05 - Ingeniería de Software 3

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Desplegando infraestructura de QA...${NC}"

# Variables
RESOURCE_GROUP="rg-repuestera-qa"
LOCATION="Brazil South"
BACKEND_APP_NAME="repuestera-api-qa"
FRONTEND_APP_NAME="repuestera-web-qa"
APP_SERVICE_PLAN="asp-repuestera-qa"

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Backend App: $BACKEND_APP_NAME"
echo "  Frontend App: $FRONTEND_APP_NAME"
echo "  App Service Plan: $APP_SERVICE_PLAN"

# Crear resource group si no existe
echo -e "${BLUE}📦 Creando resource group...${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --output table

# Crear App Service Plan
echo -e "${BLUE}🏗️  Creando App Service Plan...${NC}"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux \
  --output table

# Crear Backend App Service
echo -e "${BLUE}🔧 Creando Backend App Service...${NC}"
az webapp create \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts" \
  --output table

# Configurar variables de entorno para Backend
echo -e "${BLUE}⚙️  Configurando variables de entorno para Backend...${NC}"
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    DB_TYPE=mysql \
    DB_HOST=manufrias.mysql.database.azure.com \
    DB_USER=A \
    DB_PASSWORD=4286Pka1# \
    DB_NAME=repuestera_db \
    DB_PORT=3306 \
    JWT_SECRET=repuestera-jwt-secret-key-2024 \
    JWT_EXPIRES_IN=24h \
  --output table

# Crear Frontend App Service
echo -e "${BLUE}🌐 Creando Frontend App Service...${NC}"
az webapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts" \
  --output table

# Configurar variables de entorno para Frontend
echo -e "${BLUE}⚙️  Configurando variables de entorno para Frontend...${NC}"
az webapp config appsettings set \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    REACT_APP_API_URL=https://$BACKEND_APP_NAME.azurewebsites.net/api \
  --output table

echo -e "${GREEN}✅ Infraestructura de QA desplegada exitosamente${NC}"
echo -e "${YELLOW}📋 URLs:${NC}"
echo "  Backend: https://$BACKEND_APP_NAME.azurewebsites.net"
echo "  Frontend: https://$FRONTEND_APP_NAME.azurewebsites.net"
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "  1. Ejecutar el pipeline de Azure DevOps"
echo "  2. Verificar que los recursos se crearon correctamente"
