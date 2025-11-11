#!/bin/bash

# Script para corregir la configuración de todos los App Services
# Reemplaza la imagen de static site por las imágenes Docker de ACR

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
ACR_NAME="repusteraacr"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
RESOURCE_GROUP="rg-repuestera-qa"

# App Services
BACKEND_QA="back-qa"
FRONTEND_QA="front-qa"
BACKEND_PROD="back-prod"
FRONTEND_PROD="front-prod"

# Función para obtener la mejor imagen disponible
get_best_image() {
    local REPO=$1
    local PREFERRED_TAG=$2
    
    echo "Buscando imagen en $REPO:$PREFERRED_TAG..." >&2
    
    # Verificar si existe el tag preferido
    if az acr repository show-tags --name $ACR_NAME --repository $REPO --query "[?name=='$PREFERRED_TAG'].name" -o tsv 2>/dev/null | grep -q "$PREFERRED_TAG"; then
        echo "${ACR_LOGIN_SERVER}/${REPO}:${PREFERRED_TAG}"
        return 0
    fi
    
    # Si no existe, buscar el tag más reciente
    echo "Tag $PREFERRED_TAG no encontrado, buscando tags disponibles..." >&2
    AVAILABLE_TAGS=$(az acr repository show-tags --name $ACR_NAME --repository $REPO --orderby time_desc --query "[0:5].name" -o tsv 2>/dev/null || echo "")
    
    if [ -z "$AVAILABLE_TAGS" ]; then
        echo "" >&2
        return 1
    fi
    
    # Usar el primer tag disponible (más reciente)
    FIRST_TAG=$(echo "$AVAILABLE_TAGS" | head -1)
    echo "Usando tag disponible: $FIRST_TAG" >&2
    echo "${ACR_LOGIN_SERVER}/${REPO}:${FIRST_TAG}"
    return 0
}

# Obtener imágenes disponibles
echo "Verificando imágenes disponibles en ACR..."
BACKEND_IMAGE=$(get_best_image "repuestera-backend" "latest")
FRONTEND_QA_IMAGE=$(get_best_image "repuestera-frontend" "qa-latest")
FRONTEND_PROD_IMAGE=$(get_best_image "repuestera-frontend" "prod-latest")

if [ -z "$BACKEND_IMAGE" ]; then
    echo -e "${RED}❌ No se encontró ninguna imagen de backend en ACR${NC}"
    echo "Necesitas construir las imágenes primero ejecutando el pipeline"
    exit 1
fi

echo ""
echo "Imágenes a usar:"
echo "  Backend: $BACKEND_IMAGE"
echo "  Frontend QA: ${FRONTEND_QA_IMAGE:-'No encontrada'}"
echo "  Frontend Prod: ${FRONTEND_PROD_IMAGE:-'No encontrada'}"
echo ""

echo "=========================================="
echo "Corrección de App Services - Repuestera"
echo "=========================================="
echo ""

# Verificar que estamos logueados en Azure
echo "Verificando login en Azure..."
if ! az account show &>/dev/null; then
    echo -e "${RED}❌ No estás logueado en Azure${NC}"
    echo "Ejecuta: az login"
    exit 1
fi
echo -e "${GREEN}✅ Logueado en Azure${NC}"
echo ""

# Obtener credenciales de ACR
echo "Obteniendo credenciales de ACR..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

if [ -z "$ACR_USERNAME" ] || [ -z "$ACR_PASSWORD" ]; then
    echo -e "${RED}❌ No se pudieron obtener las credenciales de ACR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Credenciales de ACR obtenidas${NC}"
echo ""

# Función para configurar un App Service
configure_app_service() {
    local APP_NAME=$1
    local IMAGE=$2
    local ENV_VARS=$3
    
    echo "=========================================="
    echo "Configurando: $APP_NAME"
    echo "Imagen: $IMAGE"
    echo "=========================================="
    
    # Verificar que el App Service existe
    if ! az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
        echo -e "${YELLOW}⚠️  App Service $APP_NAME no encontrado en $RESOURCE_GROUP${NC}"
        echo "Buscando en otros resource groups..."
        ACTUAL_RG=$(az resource list --name $APP_NAME --resource-type "Microsoft.Web/sites" --query "[0].resourceGroup" -o tsv 2>/dev/null || echo "")
        if [ -z "$ACTUAL_RG" ]; then
            echo -e "${RED}❌ App Service $APP_NAME no encontrado${NC}"
            return 1
        fi
        echo -e "${GREEN}✅ Encontrado en resource group: $ACTUAL_RG${NC}"
        RESOURCE_GROUP=$ACTUAL_RG
    fi
    
    # Verificar que la imagen existe en ACR
    REPO_NAME=$(echo $IMAGE | cut -d'/' -f2 | cut -d':' -f1)
    TAG_NAME=$(echo $IMAGE | cut -d':' -f2)
    echo "Verificando imagen en ACR: $REPO_NAME:$TAG_NAME"
    
    if ! az acr repository show-tags --name $ACR_NAME --repository $REPO_NAME --query "[?name=='$TAG_NAME'].name" -o tsv | grep -q "$TAG_NAME"; then
        echo -e "${YELLOW}⚠️  La imagen $IMAGE no se encontró en ACR${NC}"
        echo "Imágenes disponibles en $REPO_NAME:"
        az acr repository show-tags --name $ACR_NAME --repository $REPO_NAME --output table 2>/dev/null || echo "No se pudieron listar imágenes"
        echo ""
        echo "¿Deseas continuar de todas formas? (s/n)"
        read -r response
        if [[ ! "$response" =~ ^[Ss]$ ]]; then
            return 1
        fi
    else
        echo -e "${GREEN}✅ Imagen encontrada en ACR${NC}"
    fi
    
    # Configurar contenedor Docker
    echo "Configurando contenedor Docker..."
    az webapp config container set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --docker-custom-image-name $IMAGE \
        --docker-registry-server-url https://$ACR_LOGIN_SERVER \
        --docker-registry-server-user $ACR_USERNAME \
        --docker-registry-server-password $ACR_PASSWORD \
        --output table
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al configurar el contenedor${NC}"
        return 1
    fi
    
    # Configurar linuxFxVersion (CRÍTICO para que funcione)
    echo "Configurando linuxFxVersion para Docker..."
    az webapp config set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --linux-fx-version "DOCKER|$IMAGE" \
        --output table
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al configurar linuxFxVersion${NC}"
        return 1
    fi
    
    # Configurar variables de entorno si se proporcionaron
    if [ ! -z "$ENV_VARS" ]; then
        echo "Configurando variables de entorno..."
        az webapp config appsettings set \
            --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --settings $ENV_VARS \
            --output table
    fi
    
    # Configurar WEBSITES_ENABLE_APP_SERVICE_STORAGE=false (importante)
    echo "Configurando WEBSITES_ENABLE_APP_SERVICE_STORAGE..."
    az webapp config appsettings set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        --output table
    
    # Verificar configuración
    echo "Verificando configuración aplicada..."
    sleep 3
    
    LINUX_FX=$(az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP --query linuxFxVersion -o tsv 2>/dev/null || echo "")
    CONTAINER_CONFIG=$(az webapp config container show --name $APP_NAME --resource-group $RESOURCE_GROUP -o json 2>/dev/null || echo "{}")
    
    echo "linuxFxVersion: ${LINUX_FX:-'No configurado'}"
    
    if [[ "$LINUX_FX" == *"$IMAGE"* ]]; then
        echo -e "${GREEN}✅ Configuración verificada correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  ADVERTENCIA: La configuración podría no haberse aplicado correctamente${NC}"
        echo "Esperada: DOCKER|$IMAGE"
        echo "Configurada: $LINUX_FX"
    fi
    
    # Reiniciar App Service
    echo "Reiniciando App Service..."
    az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
    
    echo -e "${GREEN}✅ $APP_NAME configurado${NC}"
    echo ""
}

# Configurar Backend QA
configure_app_service "$BACKEND_QA" "$BACKEND_IMAGE" \
    "NODE_ENV=qa PORT=8000 WEBSITES_PORT=8000 DB_TYPE=mysql DB_HOST=manufrias.mysql.database.azure.com DB_PORT=3306 DB_NAME=repuestera_db DB_USER=A DB_PASSWORD=4286Pka1# JWT_SECRET=qa_jwt_secret_key_2024 JWT_EXPIRES_IN=24h"

# Configurar Frontend QA
if [ ! -z "$FRONTEND_QA_IMAGE" ]; then
    configure_app_service "$FRONTEND_QA" "$FRONTEND_QA_IMAGE" \
        "REACT_APP_API_URL=https://back-qa-fufuc2ahgheph6ak.chilecentral-01.azurewebsites.net REACT_APP_ENV=qa"
else
    echo -e "${YELLOW}⚠️  Saltando Frontend QA - imagen no encontrada${NC}"
fi

# Configurar Backend Prod
configure_app_service "$BACKEND_PROD" "$BACKEND_IMAGE" \
    "NODE_ENV=production PORT=8000 WEBSITES_PORT=8000 DB_TYPE=mysql DB_HOST=manufrias.mysql.database.azure.com DB_PORT=3306 DB_NAME=repuestera_db DB_USER=A DB_PASSWORD=4286Pka1# JWT_SECRET=prod_jwt_secret_key_2024 JWT_EXPIRES_IN=24h"

# Configurar Frontend Prod
if [ ! -z "$FRONTEND_PROD_IMAGE" ]; then
    configure_app_service "$FRONTEND_PROD" "$FRONTEND_PROD_IMAGE" \
        "REACT_APP_API_URL=https://back-prod-eqdtfvgyb7ftfmdy.chilecentral-01.azurewebsites.net REACT_APP_ENV=production"
else
    echo -e "${YELLOW}⚠️  Saltando Frontend Prod - imagen no encontrada${NC}"
fi

echo "=========================================="
echo -e "${GREEN}✅ Proceso completado${NC}"
echo "=========================================="
echo ""
echo "Espera 30-60 segundos para que los App Services se reinicien"
echo "Luego verifica que funcionen correctamente:"
echo ""
echo "Backend QA: https://back-qa-fufuc2ahgheph6ak.chilecentral-01.azurewebsites.net/api/health"
echo "Frontend QA: https://front-qa-fed6b2g5dfadeqdw.chilecentral-01.azurewebsites.net"
echo "Backend Prod: https://back-prod-eqdtfvgyb7ftfmdy.chilecentral-01.azurewebsites.net/api/health"
echo "Frontend Prod: https://front-prod-bdh2f7dya8c3ewbf.chilecentral-01.azurewebsites.net"
echo ""

