#!/bin/bash

# Script para desplegar ambos ambientes (QA y Producción)
# TP05 - Ingeniería de Software 3

set -e

# Configuración
RESOURCE_GROUP_QA="rg-repuestera-qa"
RESOURCE_GROUP_PROD="rg-repuestera-prod"
LOCATION="Brazil South"
TEMPLATE_QA="azure-infrastructure-qa.json"
TEMPLATE_PROD="azure-infrastructure.json"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Desplegando ambos ambientes de Repuestera${NC}"
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

# Función para desplegar ambiente
deploy_environment() {
    local env_name=$1
    local resource_group=$2
    local template_file=$3
    
    echo -e "${YELLOW}📦 Desplegando ambiente: ${env_name}${NC}"
    
    # Crear el resource group si no existe
    if ! az group show --name "$resource_group" > /dev/null 2>&1; then
        echo -e "${YELLOW}📦 Creando Resource Group: $resource_group${NC}"
        az group create --name "$resource_group" --location "$LOCATION"
        echo -e "${GREEN}✅ Resource Group creado${NC}"
    else
        echo -e "${GREEN}✅ Resource Group ya existe${NC}"
    fi

    # Validar el template
    echo -e "${YELLOW}🔍 Validando template de ARM...${NC}"
    VALIDATION_RESULT=$(az deployment group validate \
        --resource-group "$resource_group" \
        --template-file "$template_file" \
        --query "error" -o tsv 2>/dev/null || echo "null")

    if [ "$VALIDATION_RESULT" != "null" ] && [ "$VALIDATION_RESULT" != "" ]; then
        echo -e "${RED}❌ Error en la validación del template:${NC}"
        az deployment group validate \
            --resource-group "$resource_group" \
            --template-file "$template_file"
        return 1
    fi

    echo -e "${GREEN}✅ Template validado correctamente${NC}"

    # Desplegar la infraestructura
    echo -e "${YELLOW}🚀 Desplegando infraestructura ${env_name}...${NC}"
    echo "Esto puede tomar varios minutos..."

    az deployment group create \
        --resource-group "$resource_group" \
        --name "repuestera-${env_name}-deployment-$(date +%Y%m%d-%H%M%S)" \
        --template-file "$template_file" \
        --verbose

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡Ambiente ${env_name} desplegado exitosamente!${NC}"
        
        # Mostrar los outputs
        echo -e "${YELLOW}📋 Información de los recursos creados para ${env_name}:${NC}"
        az deployment group show \
            --resource-group "$resource_group" \
            --name "repuestera-${env_name}-deployment-$(date +%Y%m%d-%H%M%S)" \
            --query "properties.outputs" \
            --output table
    else
        echo -e "${RED}❌ Error en el despliegue del ambiente ${env_name}${NC}"
        return 1
    fi
}

# Desplegar QA
echo -e "${GREEN}🧪 Desplegando ambiente QA...${NC}"
deploy_environment "qa" "$RESOURCE_GROUP_QA" "$TEMPLATE_QA"

echo ""

# Desplegar Producción
echo -e "${GREEN}🚀 Desplegando ambiente Producción...${NC}"
deploy_environment "prod" "$RESOURCE_GROUP_PROD" "$TEMPLATE_PROD"

echo -e "${GREEN}🎉 ¡Ambos ambientes desplegados exitosamente!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. El pipeline de Azure DevOps se ejecutará automáticamente."
echo "2. Verificar que las aplicaciones se despliegan correctamente."
echo "3. Probar la funcionalidad en ambos ambientes."
echo ""
echo -e "${GREEN}🌐 URLs de acceso:${NC}"
echo "  - QA Backend: https://repuestera-api.azurewebsites.net"
echo "  - QA Frontend: https://repuestera-web.azurewebsites.net"
echo "  - Prod Backend: https://repuestera-api.azurewebsites.net"
echo "  - Prod Frontend: https://repuestera-web.azurewebsites.net"
