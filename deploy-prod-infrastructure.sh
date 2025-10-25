#!/bin/bash

# Script para desplegar infraestructura de Producción en Azure
# TP05 - Ingeniería de Software 3

set -e

# Configuración
RESOURCE_GROUP="rg-repuestera"
LOCATION="Brazil South"
TEMPLATE_FILE="azure-infrastructure.json"
DEPLOYMENT_NAME="repuestera-prod-deployment-$(date +%Y%m%d-%H%M%S)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Desplegando infraestructura de Producción de Repuestera${NC}"
echo "========================================================"

# Verificar que el usuario está logueado en Azure
echo -e "${YELLOW}📋 Verificando autenticación de Azure...${NC}"
if ! az account show > /dev/null 2>&1; then
    echo -e "${RED}❌ No estás logueado en Azure. Ejecuta 'az login' primero.${NC}"
    exit 1
fi

# Mostrar la suscripción actual
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Conectado a Azure - Suscripción: ${SUBSCRIPTION}${NC}"

# Verificar que existe el template
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ No se encontró el archivo de template: $TEMPLATE_FILE${NC}"
    exit 1
fi

# Crear el resource group si no existe
echo -e "${YELLOW}📦 Verificando Resource Group...${NC}"
if ! az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Creando Resource Group: $RESOURCE_GROUP${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo -e "${GREEN}✅ Resource Group creado${NC}"
else
    echo -e "${GREEN}✅ Resource Group ya existe${NC}"
fi

# Solicitar contraseña de MySQL
echo -e "${YELLOW}🔐 Configuración de MySQL${NC}"
read -s -p "Ingresa la contraseña para el administrador de MySQL (mínimo 8 caracteres): " MYSQL_PASSWORD
echo

# Validar contraseña
if [ ${#MYSQL_PASSWORD} -lt 8 ]; then
    echo -e "${RED}❌ La contraseña debe tener al menos 8 caracteres${NC}"
    exit 1
fi

# Confirmar despliegue de producción
echo -e "${RED}⚠️  ATENCIÓN: Estás a punto de desplegar en PRODUCCIÓN${NC}"
echo -e "${YELLOW}🔍 Recursos que se crearán:${NC}"
echo "  - App Service Plan: repuestera-mfrias-plan"
echo "  - Backend API: repuestera-mfrias-api"
echo "  - Frontend Web: repuestera-mfrias-web"
echo "  - MySQL Server: repuestera-mfrias-server"
echo "  - MySQL Database: repuestera"
echo "  - Application Insights: repuestera-mfrias-insights"
echo ""
read -p "¿Estás seguro de continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo -e "${YELLOW}❌ Despliegue cancelado${NC}"
    exit 0
fi

# Validar el template
echo -e "${YELLOW}🔍 Validando template de ARM...${NC}"
VALIDATION_RESULT=$(az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters mysqlAdminPassword="$MYSQL_PASSWORD" \
    --query "error" -o tsv 2>/dev/null || echo "null")

if [ "$VALIDATION_RESULT" != "null" ] && [ "$VALIDATION_RESULT" != "" ]; then
    echo -e "${RED}❌ Error en la validación del template:${NC}"
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$TEMPLATE_FILE" \
        --parameters mysqlAdminPassword="$MYSQL_PASSWORD"
    exit 1
fi

echo -e "${GREEN}✅ Template validado correctamente${NC}"

# Desplegar la infraestructura
echo -e "${YELLOW}🚀 Desplegando infraestructura de Producción...${NC}"
echo "Esto puede tomar varios minutos..."

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --parameters mysqlAdminPassword="$MYSQL_PASSWORD" \
    --verbose

# Verificar el resultado del despliegue
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Infraestructura de Producción desplegada exitosamente!${NC}"
    
    # Mostrar los outputs
    echo -e "${YELLOW}📋 Información de los recursos creados:${NC}"
    az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output table
        
    echo -e "${GREEN}✅ Despliegue completado${NC}"
    echo -e "${YELLOW}💡 Próximos pasos:${NC}"
    echo "1. Ejecutar el pipeline de Azure DevOps"
    echo "2. Verificar que las aplicaciones se despliegan correctamente"
    echo "3. Probar la funcionalidad en el ambiente de Producción"
    echo "4. Configurar monitoreo y alertas"
else
    echo -e "${RED}❌ Error en el despliegue de la infraestructura${NC}"
    exit 1
fi