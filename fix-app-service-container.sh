#!/bin/bash
# Script para configurar manualmente el App Service con la imagen correcta

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
ACR_NAME="repusteraacr"
APP_SERVICE_NAME="back-qa-fufuc2ahgheph6ak"
RESOURCE_GROUP="rg-repuestera-qa"

# Solicitar tag de la imagen
echo "¿Qué tag de imagen quieres usar?"
echo "Ejemplos: qa-123, latest, qa-latest"
read -p "Tag: " IMAGE_TAG

if [ -z "$IMAGE_TAG" ]; then
  IMAGE_TAG="qa-latest"
  echo "Usando tag por defecto: $IMAGE_TAG"
fi

BACKEND_IMAGE="${ACR_NAME}.azurecr.io/repuestera-backend:${IMAGE_TAG}"

echo ""
echo "=== Configurando App Service ==="
echo "App Service: $APP_SERVICE_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "Imagen: $BACKEND_IMAGE"
echo ""

# Obtener credenciales ACR
echo "Obteniendo credenciales ACR..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

if [ -z "$ACR_USERNAME" ] || [ -z "$ACR_PASSWORD" ]; then
  echo -e "${RED}❌ Error al obtener credenciales ACR${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Credenciales obtenidas${NC}"
echo ""

# Verificar que la imagen existe
echo "Verificando que la imagen existe en ACR..."
IMAGE_EXISTS=$(az acr repository show-tags --name $ACR_NAME --repository repuestera-backend --query "[?name=='${IMAGE_TAG}'].name" -o tsv 2>/dev/null || echo "")

if [ -z "$IMAGE_EXISTS" ]; then
  echo -e "${YELLOW}⚠️  La imagen con tag '${IMAGE_TAG}' no se encontró${NC}"
  echo "Imágenes disponibles:"
  az acr repository show-tags --name $ACR_NAME --repository repuestera-backend --output table
  echo ""
  read -p "¿Continuar de todas formas? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ Imagen encontrada en ACR${NC}"
fi

echo ""
echo "=== Configurando contenedor ==="

# Paso 1: Configurar el contenedor
echo "1. Configurando contenedor Docker..."
az webapp config container set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $BACKEND_IMAGE \
  --docker-registry-server-url https://${ACR_NAME}.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD \
  --output table

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al configurar el contenedor${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Contenedor configurado${NC}"
echo ""

# Paso 2: Configurar linuxFxVersion
echo "2. Configurando linuxFxVersion..."
az webapp config set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --linux-fx-version "DOCKER|${BACKEND_IMAGE}" \
  --output table

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al configurar linuxFxVersion${NC}"
  exit 1
fi

echo -e "${GREEN}✅ linuxFxVersion configurado${NC}"
echo ""

# Paso 3: Verificar configuración
echo "3. Verificando configuración..."
sleep 3

LINUX_FX=$(az webapp config show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP --query linuxFxVersion -o tsv 2>/dev/null || echo "")
CONTAINER_IMAGE=$(az webapp config container show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP --query dockerCfgImage -o tsv 2>/dev/null || echo "")

echo "linuxFxVersion: ${LINUX_FX:-'No configurado'}"
echo "Container Image: ${CONTAINER_IMAGE:-'No configurado'}"

if [[ "$LINUX_FX" == *"$BACKEND_IMAGE"* ]] || [[ "$CONTAINER_IMAGE" == *"$BACKEND_IMAGE"* ]]; then
  echo -e "${GREEN}✅ Configuración verificada correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  La configuración puede no haberse aplicado correctamente${NC}"
fi

echo ""
echo "4. Reiniciando App Service..."
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo "App Service URL: https://${APP_SERVICE_NAME}.chilecentral-01.azurewebsites.net"
echo "Health check: https://${APP_SERVICE_NAME}.chilecentral-01.azurewebsites.net/api/health"
echo ""
echo "Espera unos minutos y luego verifica el health check."

