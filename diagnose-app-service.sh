#!/bin/bash
# Script de diagnóstico para App Services

set -e

echo "🔍 Diagnóstico de App Services"
echo "================================"
echo ""

# Variables
APP_SERVICE_BACKEND_QA="back-qa-fufuc2ahgheph6ak"
APP_SERVICE_FRONTEND_QA="front-qa-fed6b2g5dfadeqdw"
APP_SERVICE_BACKEND_PROD="back-prod-eqdtfvgyb7ftfmdy"
APP_SERVICE_FRONTEND_PROD="front-prod-bdh2f7dya8c3ewbf"

echo "1. Verificando si los App Services existen..."
echo ""

# Función para buscar App Service
check_app_service() {
    local app_name=$1
    echo "Buscando: $app_name"
    
    # Buscar en todos los resource groups
    RG=$(az webapp list --query "[?name=='$app_name'].resourceGroup" -o tsv 2>/dev/null | head -1)
    
    if [ -z "$RG" ]; then
        echo "  ❌ No encontrado en ningún resource group"
        return 1
    else
        echo "  ✅ Encontrado en resource group: $RG"
        
        # Obtener información del App Service
        echo "  Información del App Service:"
        az webapp show --name "$app_name" --resource-group "$RG" --query "{name:name, state:state, location:location, kind:kind, defaultHostName:defaultHostName}" -o table 2>/dev/null || echo "    No se pudo obtener información"
        
        # Verificar configuración del contenedor
        echo "  Configuración del contenedor:"
        CONTAINER_CONFIG=$(az webapp config container show --name "$app_name" --resource-group "$RG" -o json 2>/dev/null || echo "null")
        
        if [ "$CONTAINER_CONFIG" == "null" ] || [ -z "$CONTAINER_CONFIG" ]; then
            echo "    ⚠️  No configurado como contenedor Docker"
            
            # Verificar linuxFxVersion
            LINUX_FX=$(az webapp config show --name "$app_name" --resource-group "$RG" --query linuxFxVersion -o tsv 2>/dev/null || echo "")
            echo "    linuxFxVersion: ${LINUX_FX:-'No configurado'}"
        else
            echo "    ✅ Configurado como contenedor Docker"
            echo "$CONTAINER_CONFIG" | jq '.' 2>/dev/null || echo "$CONTAINER_CONFIG"
        fi
        
        # Verificar estado
        STATE=$(az webapp show --name "$app_name" --resource-group "$RG" --query state -o tsv 2>/dev/null || echo "Unknown")
        echo "    Estado: $STATE"
        
        return 0
    fi
}

check_app_service "$APP_SERVICE_BACKEND_QA"
echo ""
check_app_service "$APP_SERVICE_FRONTEND_QA"
echo ""
check_app_service "$APP_SERVICE_BACKEND_PROD"
echo ""
check_app_service "$APP_SERVICE_FRONTEND_PROD"
echo ""

echo "2. Listando todos los App Services en la suscripción..."
echo ""
az webapp list --query "[].{Name:name, ResourceGroup:resourceGroup, State:state, Location:location}" -o table

echo ""
echo "3. Verificando resource groups..."
echo ""
az group list --query "[].{Name:name, Location:location}" -o table

echo ""
echo "✅ Diagnóstico completado"

