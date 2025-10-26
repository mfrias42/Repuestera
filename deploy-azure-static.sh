#!/bin/bash

# Script para desplegar Azure Static Web Apps
# TP05 - Ingeniería de Software 3

set -e

# Configuración
RESOURCE_GROUP="rg-repuestera-static"
LOCATION="East US"
TEMPLATE_FILE="azure-static-web-apps.json"
DEPLOYMENT_NAME="repuestera-static-deployment-$(date +%Y%m%d-%H%M%S)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Desplegando Azure Static Web Apps${NC}"
echo "============================================="

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

# Validar el template
echo -e "${YELLOW}🔍 Validando template de ARM...${NC}"
VALIDATION_RESULT=$(az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --query "error" -o tsv 2>/dev/null || echo "null")

if [ "$VALIDATION_RESULT" != "null" ] && [ "$VALIDATION_RESULT" != "" ]; then
    echo -e "${RED}❌ Error en la validación del template:${NC}"
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$TEMPLATE_FILE"
    exit 1
fi

echo -e "${GREEN}✅ Template validado correctamente${NC}"

# Desplegar la infraestructura
echo -e "${YELLOW}🚀 Desplegando Azure Static Web Apps...${NC}"
echo "Esto puede tomar varios minutos..."

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --verbose

# Verificar el resultado del despliegue
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Azure Static Web Apps desplegado exitosamente!${NC}"
    
    # Mostrar los outputs
    echo -e "${YELLOW}📋 Información de los recursos creados:${NC}"
    az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output table
        
    echo -e "${GREEN}✅ Despliegue completado${NC}"
    echo -e "${YELLOW}💡 Próximos pasos:${NC}"
    echo "1. Configurar GitHub Actions para despliegue automático"
    echo "2. Conectar repositorio GitHub"
    echo "3. Configurar variables de entorno"
    echo "4. Probar la aplicación"
    echo ""
    echo -e "${GREEN}🌐 URLs de acceso:${NC}"
    echo "Static Web App: https://repuestera-mfrias-static.azurestaticapps.net"
    echo ""
    echo -e "${YELLOW}🔧 Configuración adicional requerida:${NC}"
    echo "1. Ir a Azure Portal > Static Web Apps"
    echo "2. Configurar GitHub Actions"
    echo "3. Conectar repositorio"
    echo "4. Configurar variables de entorno"
else
    echo -e "${RED}❌ Error en el despliegue de la infraestructura${NC}"
    exit 1
fi
