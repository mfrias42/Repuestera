#!/bin/bash
# Script de verificación de requisitos del pipeline
# Ejecuta verificaciones sin necesidad de correr el pipeline completo

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Verificación de Requisitos del Pipeline"
echo "=========================================="
echo ""

# Variables del pipeline
ACR_NAME="repusteraacr"
RESOURCE_GROUP_QA="rg-repuestera-qa"
APP_SERVICE_BACKEND_QA="back-qa-fufuc2ahgheph6ak"
APP_SERVICE_FRONTEND_QA="front-qa-fed6b2g5dfadeqdw"
APP_SERVICE_BACKEND_PROD="back-prod-eqdtfvgyb7ftfmdy"
APP_SERVICE_FRONTEND_PROD="front-prod-bdh2f7dya8c3ewbf"
MYSQL_HOST="manufrias.mysql.database.azure.com"
MYSQL_DB="repuestera_db"
MYSQL_USER="A"

# Contador de errores
ERRORS=0
WARNINGS=0

# Función para verificar
check() {
    local name=$1
    local result=$2
    local required=${3:-true}
    
    if [ "$result" = "OK" ] || [ "$result" = "true" ] || [ -n "$result" ] && [ "$result" != "null" ] && [ "$result" != "[]" ]; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $name (REQUERIDO)${NC}"
            ((ERRORS++))
            return 1
        else
            echo -e "${YELLOW}⚠️  $name (Opcional)${NC}"
            ((WARNINGS++))
            return 0
        fi
    fi
}

echo "📋 1. VERIFICACIÓN DE AZURE CLI"
echo "--------------------------------"
if command -v az &> /dev/null; then
    AZ_VERSION=$(az --version | head -1)
    echo -e "${GREEN}✅ Azure CLI instalado: $AZ_VERSION${NC}"
    
    # Verificar login
    if az account show &> /dev/null; then
        SUBSCRIPTION=$(az account show --query "{Name:name, ID:id}" -o tsv 2>/dev/null | head -1)
        echo -e "${GREEN}✅ Autenticado en Azure: $SUBSCRIPTION${NC}"
    else
        echo -e "${RED}❌ No estás autenticado en Azure. Ejecuta: az login${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ Azure CLI no está instalado${NC}"
    ((ERRORS++))
fi
echo ""

echo "📋 2. VERIFICACIÓN DE AZURE CONTAINER REGISTRY (ACR)"
echo "-----------------------------------------------------"
if az acr show --name $ACR_NAME &> /dev/null; then
    ACR_INFO=$(az acr show --name $ACR_NAME --query "{Name:name, ResourceGroup:resourceGroup, LoginServer:loginServer, Sku:sku.name}" -o json 2>/dev/null)
    echo -e "${GREEN}✅ ACR '$ACR_NAME' existe${NC}"
    echo "$ACR_INFO" | jq '.' 2>/dev/null || echo "$ACR_INFO"
    
    # Verificar credenciales
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv 2>/dev/null || echo "")
    if [ -n "$ACR_USERNAME" ]; then
        echo -e "${GREEN}✅ Credenciales ACR disponibles${NC}"
    else
        echo -e "${RED}❌ No se pueden obtener credenciales ACR${NC}"
        ((ERRORS++))
    fi
    
    # Verificar imágenes en ACR
    echo ""
    echo "Imágenes en ACR:"
    az acr repository list --name $ACR_NAME --output table 2>/dev/null || echo "No se pudieron listar repositorios"
    
    echo ""
    echo "Tags de repuestera-backend:"
    az acr repository show-tags --name $ACR_NAME --repository repuestera-backend --output table 2>/dev/null || echo "No hay imágenes de backend"
    
    echo ""
    echo "Tags de repuestera-frontend:"
    az acr repository show-tags --name $ACR_NAME --repository repuestera-frontend --output table 2>/dev/null || echo "No hay imágenes de frontend"
else
    echo -e "${RED}❌ ACR '$ACR_NAME' NO existe${NC}"
    echo "   Necesitas crearlo con:"
    echo "   az acr create --resource-group $RESOURCE_GROUP_QA --name $ACR_NAME --sku Basic --admin-enabled true"
    ((ERRORS++))
fi
echo ""

echo "📋 3. VERIFICACIÓN DE RESOURCE GROUPS"
echo "-------------------------------------"
if az group show --name $RESOURCE_GROUP_QA &> /dev/null; then
    RG_LOCATION=$(az group show --name $RESOURCE_GROUP_QA --query location -o tsv 2>/dev/null)
    echo -e "${GREEN}✅ Resource Group '$RESOURCE_GROUP_QA' existe (Location: $RG_LOCATION)${NC}"
else
    echo -e "${RED}❌ Resource Group '$RESOURCE_GROUP_QA' NO existe${NC}"
    ((ERRORS++))
fi
echo ""

echo "📋 4. VERIFICACIÓN DE APP SERVICES - QA"
echo "----------------------------------------"

# Backend QA
echo "Backend QA: $APP_SERVICE_BACKEND_QA"
BACKEND_QA_RG=$(az webapp list --query "[?name=='$APP_SERVICE_BACKEND_QA'].resourceGroup" -o tsv 2>/dev/null | head -1)
if [ -n "$BACKEND_QA_RG" ]; then
    echo -e "${GREEN}  ✅ Existe en resource group: $BACKEND_QA_RG${NC}"
    
    # Verificar configuración
    STATE=$(az webapp show --name $APP_SERVICE_BACKEND_QA --resource-group $BACKEND_QA_RG --query state -o tsv 2>/dev/null || echo "Unknown")
    KIND=$(az webapp show --name $APP_SERVICE_BACKEND_QA --resource-group $BACKEND_QA_RG --query kind -o tsv 2>/dev/null || echo "")
    LINUX_FX=$(az webapp config show --name $APP_SERVICE_BACKEND_QA --resource-group $BACKEND_QA_RG --query linuxFxVersion -o tsv 2>/dev/null || echo "")
    
    echo "    Estado: $STATE"
    echo "    Kind: $KIND"
    echo "    linuxFxVersion: ${LINUX_FX:-'No configurado'}"
    
    # Verificar si está configurado como contenedor
    CONTAINER_CONFIG=$(az webapp config container show --name $APP_SERVICE_BACKEND_QA --resource-group $BACKEND_QA_RG -o json 2>/dev/null || echo "{}")
    CONTAINER_IMAGE=$(echo "$CONTAINER_CONFIG" | jq -r '.dockerCfgImage // .linuxFxVersion // "No configurado"' 2>/dev/null || echo "No configurado")
    
    if [[ "$CONTAINER_IMAGE" == *"repusteraacr"* ]] || [[ "$LINUX_FX" == *"DOCKER"* ]]; then
        echo -e "    ${GREEN}✅ Configurado como contenedor Docker${NC}"
        echo "    Imagen: $CONTAINER_IMAGE"
    else
        echo -e "    ${YELLOW}⚠️  NO está configurado como contenedor Docker${NC}"
        echo "    Imagen actual: $CONTAINER_IMAGE"
        ((WARNINGS++))
    fi
else
    echo -e "  ${RED}❌ NO existe${NC}"
    ((ERRORS++))
fi

echo ""

# Frontend QA
echo "Frontend QA: $APP_SERVICE_FRONTEND_QA"
FRONTEND_QA_RG=$(az webapp list --query "[?name=='$APP_SERVICE_FRONTEND_QA'].resourceGroup" -o tsv 2>/dev/null | head -1)
if [ -n "$FRONTEND_QA_RG" ]; then
    echo -e "${GREEN}  ✅ Existe en resource group: $FRONTEND_QA_RG${NC}"
    
    STATE=$(az webapp show --name $APP_SERVICE_FRONTEND_QA --resource-group $FRONTEND_QA_RG --query state -o tsv 2>/dev/null || echo "Unknown")
    LINUX_FX=$(az webapp config show --name $APP_SERVICE_FRONTEND_QA --resource-group $FRONTEND_QA_RG --query linuxFxVersion -o tsv 2>/dev/null || echo "")
    
    echo "    Estado: $STATE"
    echo "    linuxFxVersion: ${LINUX_FX:-'No configurado'}"
    
    CONTAINER_CONFIG=$(az webapp config container show --name $APP_SERVICE_FRONTEND_QA --resource-group $FRONTEND_QA_RG -o json 2>/dev/null || echo "{}")
    CONTAINER_IMAGE=$(echo "$CONTAINER_CONFIG" | jq -r '.dockerCfgImage // .linuxFxVersion // "No configurado"' 2>/dev/null || echo "No configurado")
    
    if [[ "$CONTAINER_IMAGE" == *"repusteraacr"* ]] || [[ "$LINUX_FX" == *"DOCKER"* ]]; then
        echo -e "    ${GREEN}✅ Configurado como contenedor Docker${NC}"
    else
        echo -e "    ${YELLOW}⚠️  NO está configurado como contenedor Docker${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "  ${RED}❌ NO existe${NC}"
    ((ERRORS++))
fi
echo ""

echo "📋 5. VERIFICACIÓN DE APP SERVICES - PRODUCCIÓN"
echo "-----------------------------------------------"

# Backend Prod
echo "Backend Prod: $APP_SERVICE_BACKEND_PROD"
BACKEND_PROD_RG=$(az webapp list --query "[?name=='$APP_SERVICE_BACKEND_PROD'].resourceGroup" -o tsv 2>/dev/null | head -1)
if [ -n "$BACKEND_PROD_RG" ]; then
    echo -e "${GREEN}  ✅ Existe en resource group: $BACKEND_PROD_RG${NC}"
    STATE=$(az webapp show --name $APP_SERVICE_BACKEND_PROD --resource-group $BACKEND_PROD_RG --query state -o tsv 2>/dev/null || echo "Unknown")
    echo "    Estado: $STATE"
else
    echo -e "  ${YELLOW}⚠️  NO existe (puede crearse más adelante)${NC}"
    ((WARNINGS++))
fi

# Frontend Prod
echo "Frontend Prod: $APP_SERVICE_FRONTEND_PROD"
FRONTEND_PROD_RG=$(az webapp list --query "[?name=='$APP_SERVICE_FRONTEND_PROD'].resourceGroup" -o tsv 2>/dev/null | head -1)
if [ -n "$FRONTEND_PROD_RG" ]; then
    echo -e "${GREEN}  ✅ Existe en resource group: $FRONTEND_PROD_RG${NC}"
    STATE=$(az webapp show --name $APP_SERVICE_FRONTEND_PROD --resource-group $FRONTEND_PROD_RG --query state -o tsv 2>/dev/null || echo "Unknown")
    echo "    Estado: $STATE"
else
    echo -e "  ${YELLOW}⚠️  NO existe (puede crearse más adelante)${NC}"
    ((WARNINGS++))
fi
echo ""

echo "📋 6. VERIFICACIÓN DE BASE DE DATOS MYSQL"
echo "-----------------------------------------"
echo "Host: $MYSQL_HOST"
echo "Database: $MYSQL_DB"
echo "User: $MYSQL_USER"
echo ""
echo -e "${BLUE}ℹ️  Verificación manual requerida:${NC}"
echo "   - Verificar que el servidor MySQL existe"
echo "   - Verificar que la base de datos '$MYSQL_DB' existe"
echo "   - Verificar que el usuario '$MYSQL_USER' tiene permisos"
echo "   - Verificar que el firewall permite conexiones desde App Services"
echo ""

echo "📋 7. VERIFICACIÓN DE AZURE DEVOPS SERVICE CONNECTIONS"
echo "-------------------------------------------------------"
echo -e "${BLUE}ℹ️  Verificación manual requerida en Azure DevOps:${NC}"
echo ""
echo "1. Service Connection 'Azure-Service-Connection':"
echo "   - Ir a: Project Settings → Service connections"
echo "   - Verificar que existe y está autorizada"
echo "   - Debe tener permisos para:"
echo "     * Leer/escribir en App Services"
echo "     * Leer/escribir en ACR"
echo "     * Leer en Resource Groups"
echo ""
echo "2. Service Connection 'SonarCloud' (opcional):"
echo "   - Ir a: Project Settings → Service connections"
echo "   - Verificar que existe si usas SonarCloud"
echo ""

echo "📋 8. VERIFICACIÓN DE ENVIRONMENTS EN AZURE DEVOPS"
echo "--------------------------------------------------"
echo -e "${BLUE}ℹ️  Verificación manual requerida en Azure DevOps:${NC}"
echo ""
echo "Environments necesarios:"
echo "  - qa-backend"
echo "  - qa-frontend"
echo "  - production-backend (con aprobación manual opcional)"
echo "  - production-frontend (con aprobación manual opcional)"
echo ""
echo "Ir a: Pipelines → Environments"
echo ""

echo "📋 9. RESUMEN DE INFORMACIÓN NECESARIA"
echo "--------------------------------------"
echo ""
echo "Para que el pipeline funcione, necesitas verificar:"
echo ""
echo -e "${GREEN}✅ CRÍTICO (debe estar correcto):${NC}"
echo "  1. Azure Service Connection 'Azure-Service-Connection' en Azure DevOps"
echo "  2. ACR '$ACR_NAME' existe y tiene credenciales habilitadas"
echo "  3. App Services existen (al menos QA)"
echo "  4. Resource Group '$RESOURCE_GROUP_QA' existe"
echo "  5. Base de datos MySQL accesible desde App Services"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  6. App Services configurados como contenedores Docker"
echo "  7. Imágenes Docker en ACR con los tags correctos"
echo ""
echo -e "${BLUE}ℹ️  OPCIONAL:${NC}"
echo "  8. SonarCloud Service Connection (si usas análisis de código)"
echo "  9. Environments en Azure DevOps (para aprobaciones)"
echo ""

# Resumen final
echo "=========================================="
echo "📊 RESUMEN"
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ No se encontraron errores críticos${NC}"
else
    echo -e "${RED}❌ Se encontraron $ERRORS error(es) crítico(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Se encontraron $WARNINGS advertencia(s)${NC}"
fi

echo ""
echo "Para más detalles, ejecuta comandos específicos:"
echo "  - Ver ACR: az acr show --name $ACR_NAME"
echo "  - Ver App Service: az webapp show --name <nombre> --resource-group <rg>"
echo "  - Ver configuración contenedor: az webapp config container show --name <nombre> --resource-group <rg>"
echo ""

