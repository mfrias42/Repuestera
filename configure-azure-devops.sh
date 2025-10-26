#!/bin/bash

# Script para configurar Azure DevOps con MySQL Flexible Server
# TP05 - Ingeniería de Software 3

set -e

# Configuración
ORGANIZATION="tu-organizacion"  # Cambiar por tu organización
PROJECT="tu-proyecto"           # Cambiar por tu proyecto
RESOURCE_GROUP="rg-repuestera-qa"
MYSQL_SERVER="manufrias"
MYSQL_USER="A"
MYSQL_PASSWORD="4286Pka1#"
DATABASE_NAME="repuestera_db"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Configurando Azure DevOps para MySQL Flexible Server${NC}"
echo "=================================================="

# Verificar que Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI no está instalado${NC}"
    exit 1
fi

# Verificar que Azure DevOps CLI está instalado
if ! command -v az devops &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Azure DevOps CLI...${NC}"
    az extension add --name azure-devops
fi

# Configurar Azure DevOps
echo -e "${YELLOW}🔐 Configurando Azure DevOps...${NC}"
az devops configure --defaults organization=https://dev.azure.com/$ORGANIZATION project=$PROJECT

# Crear variables de entorno para QA
echo -e "${YELLOW}📋 Configurando variables de entorno para QA...${NC}"

# Variables para QA Backend
az pipelines variable create --name "DB_TYPE" --value "mysql" --pipeline-id 1
az pipelines variable create --name "DB_HOST" --value "$MYSQL_SERVER.mysql.database.azure.com" --pipeline-id 1
az pipelines variable create --name "DB_USER" --value "$MYSQL_USER" --pipeline-id 1
az pipelines variable create --name "DB_PASSWORD" --value "$MYSQL_PASSWORD" --pipeline-id 1 --secret
az pipelines variable create --name "DB_NAME" --value "$DATABASE_NAME" --pipeline-id 1
az pipelines variable create --name "DB_PORT" --value "3306" --pipeline-id 1

# Variables para QA Frontend
az pipelines variable create --name "REACT_APP_API_URL" --value "https://repuestera-api.azurewebsites.net/api" --pipeline-id 1

# Variables para Producción Backend
az pipelines variable create --name "PROD_DB_TYPE" --value "mysql" --pipeline-id 1
az pipelines variable create --name "PROD_DB_HOST" --value "$MYSQL_SERVER.mysql.database.azure.com" --pipeline-id 1
az pipelines variable create --name "PROD_DB_USER" --value "$MYSQL_USER" --pipeline-id 1
az pipelines variable create --name "PROD_DB_PASSWORD" --value "$MYSQL_PASSWORD" --pipeline-id 1 --secret
az pipelines variable create --name "PROD_DB_NAME" --value "$DATABASE_NAME" --pipeline-id 1
az pipelines variable create --name "PROD_DB_PORT" --value "3306" --pipeline-id 1

# Variables para Producción Frontend
az pipelines variable create --name "PROD_REACT_APP_API_URL" --value "https://repuestera-api.azurewebsites.net/api" --pipeline-id 1

echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"

# Mostrar información de configuración
echo -e "${GREEN}🎉 Configuración de Azure DevOps completada${NC}"
echo ""
echo -e "${YELLOW}📋 Información de configuración:${NC}"
echo "  - Organización: $ORGANIZATION"
echo "  - Proyecto: $PROJECT"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - MySQL Server: $MYSQL_SERVER.mysql.database.azure.com"
echo "  - Database: $DATABASE_NAME"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. Verificar que las variables se crearon correctamente"
echo "2. Configurar los ambientes en Azure DevOps"
echo "3. Hacer push al repositorio para activar el pipeline"
echo ""
echo -e "${GREEN}🔧 Comandos útiles:${NC}"
echo "  - Ver variables: az pipelines variable list --pipeline-id 1"
echo "  - Ver ambientes: az pipelines environment list"
echo "  - Ejecutar pipeline: az pipelines run --name 'tu-pipeline-name'"
