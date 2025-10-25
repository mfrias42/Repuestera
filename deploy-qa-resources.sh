#!/bin/bash

# Script para desplegar recursos QA en Azure
# TP05 - Ingeniería de Software 3

set -e

echo "🚀 Desplegando recursos QA para Repuestera..."

# Variables
RESOURCE_GROUP="rg-repuestera"
LOCATION="Brazil South"
APP_NAME_PREFIX="repuestera-mfrias"

# Verificar que Azure CLI esté instalado
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar login en Azure
echo "🔐 Verificando autenticación en Azure..."
if ! az account show &> /dev/null; then
    echo "❌ No estás autenticado en Azure. Ejecuta 'az login' primero."
    exit 1
fi

# Verificar que el grupo de recursos existe
echo "📋 Verificando grupo de recursos..."
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "❌ El grupo de recursos $RESOURCE_GROUP no existe."
    echo "💡 Créalo primero con: az group create --name $RESOURCE_GROUP --location \"$LOCATION\""
    exit 1
fi

# Desplegar recursos QA
echo "🏗️  Desplegando recursos QA..."
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file azure-infrastructure-qa.json \
    --parameters appNamePrefix=$APP_NAME_PREFIX \
    --parameters location="$LOCATION" \
    --parameters sku=B1 \
    --verbose

if [ $? -eq 0 ]; then
    echo "✅ Recursos QA desplegados exitosamente!"
    echo ""
    echo "📊 URLs de QA:"
    echo "🔗 Backend QA: https://${APP_NAME_PREFIX}-api-qa.azurewebsites.net"
    echo "🔗 Frontend QA: https://${APP_NAME_PREFIX}-web-qa.azurewebsites.net"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "1. Configurar environments en Azure DevOps:"
    echo "   - qa-backend"
    echo "   - qa-frontend"
    echo "2. Ejecutar el pipeline para probar el deployment"
    echo "3. Configurar aprobaciones manuales para producción"
else
    echo "❌ Error al desplegar recursos QA"
    exit 1
fi