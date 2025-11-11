#!/bin/bash
set -e

echo "🚀 TP08 - Deploy de Contenedores a Azure"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de configuración
RESOURCE_GROUP="repuestera-rg"
ACR_NAME="repusteraacr"
LOCATION="eastus"
MYSQL_HOST="manufrias.mysql.database.azure.com"
MYSQL_DB="repuestera_db"
MYSQL_USER="repuestera_user"

# Verificar Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI no está instalado${NC}"
    echo "Instalar con: brew install azure-cli"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI detectado${NC}"
echo ""

# Login a Azure
echo "🔐 Verificando login de Azure..."
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás logueado. Ejecutando az login...${NC}"
    az login
else
    echo -e "${GREEN}✅ Ya estás logueado en Azure${NC}"
    echo "Cuenta actual:"
    az account show --query "{Subscription:name, ID:id}" --output table
fi
echo ""

# Paso 1: Crear Resource Group
echo "📦 Paso 1: Crear Resource Group"
echo "--------------------------------"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Resource Group '$RESOURCE_GROUP' ya existe${NC}"
else
    echo "Creando Resource Group..."
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output table
    echo -e "${GREEN}✅ Resource Group creado${NC}"
fi
echo ""

# Paso 2: Crear Azure Container Registry
echo "🐳 Paso 2: Crear Azure Container Registry"
echo "-----------------------------------------"
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  ACR '$ACR_NAME' ya existe${NC}"
else
    echo "Creando ACR..."
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true \
        --output table
    echo -e "${GREEN}✅ ACR creado${NC}"
fi

# Obtener ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo ""

# Paso 3: Login a ACR
echo "🔑 Paso 3: Login a ACR"
echo "---------------------"
az acr login --name $ACR_NAME
echo -e "${GREEN}✅ Login exitoso a ACR${NC}"
echo ""

# Paso 4: Build y Push de imágenes
echo "🏗️  Paso 4: Build y Push de Imágenes"
echo "------------------------------------"

# Verificar que docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml no encontrado${NC}"
    exit 1
fi

# Build local (si no están las imágenes)
echo "Verificando imágenes locales..."
if ! docker images | grep -q "repuestera-backend"; then
    echo "Building imágenes localmente..."
    docker-compose build
fi

# Tag imágenes
echo "Tagging imágenes para ACR..."
docker tag repuestera-backend:latest $ACR_LOGIN_SERVER/repuestera-backend:latest
docker tag repuestera-backend:latest $ACR_LOGIN_SERVER/repuestera-backend:v1.0.0
docker tag repuestera-frontend:latest $ACR_LOGIN_SERVER/repuestera-frontend:latest
docker tag repuestera-frontend:latest $ACR_LOGIN_SERVER/repuestera-frontend:v1.0.0

echo "Pushing backend a ACR..."
docker push $ACR_LOGIN_SERVER/repuestera-backend:latest
docker push $ACR_LOGIN_SERVER/repuestera-backend:v1.0.0

echo "Pushing frontend a ACR..."
docker push $ACR_LOGIN_SERVER/repuestera-frontend:latest
docker push $ACR_LOGIN_SERVER/repuestera-frontend:v1.0.0

echo -e "${GREEN}✅ Imágenes pusheadas a ACR${NC}"
echo ""

# Verificar imágenes en ACR
echo "Imágenes en ACR:"
az acr repository list --name $ACR_NAME --output table
echo ""

# Paso 5: Obtener credenciales ACR
echo "🔐 Paso 5: Obtener Credenciales ACR"
echo "-----------------------------------"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
echo -e "${GREEN}✅ Credenciales obtenidas${NC}"
echo ""

# Solicitar password de MySQL
echo "🔑 Configuración de Base de Datos"
echo "----------------------------------"
echo "Host MySQL: $MYSQL_HOST"
echo "Database: $MYSQL_DB"
echo "User: $MYSQL_USER"
echo ""
read -sp "Ingresa el password de MySQL: " MYSQL_PASSWORD
echo ""
echo ""

# Paso 6: Deploy Backend a Container Instances
echo "☁️  Paso 6: Deploy Backend a Azure Container Instances"
echo "------------------------------------------------------"

# Verificar si ya existe
if az container show --resource-group $RESOURCE_GROUP --name repuestera-backend-aci &> /dev/null; then
    echo -e "${YELLOW}⚠️  Backend Container Instance ya existe. Eliminando...${NC}"
    az container delete \
        --resource-group $RESOURCE_GROUP \
        --name repuestera-backend-aci \
        --yes
    echo "Esperando 10 segundos..."
    sleep 10
fi

echo "Desplegando Backend Container..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name repuestera-backend-aci \
    --image $ACR_LOGIN_SERVER/repuestera-backend:latest \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --dns-name-label repuestera-backend-tp08 \
    --ports 8000 \
    --environment-variables \
        NODE_ENV=production \
        PORT=8000 \
        DB_HOST=$MYSQL_HOST \
        DB_PORT=3306 \
        DB_NAME=$MYSQL_DB \
        DB_USER=$MYSQL_USER \
        DB_PASSWORD=$MYSQL_PASSWORD \
        JWT_SECRET="production-jwt-secret-$(date +%s)" \
    --cpu 1 \
    --memory 1.5 \
    --output table

# Obtener URL del backend
BACKEND_URL=$(az container show \
    --resource-group $RESOURCE_GROUP \
    --name repuestera-backend-aci \
    --query ipAddress.fqdn \
    --output tsv)

echo -e "${GREEN}✅ Backend desplegado${NC}"
echo "URL Backend: http://$BACKEND_URL:8000"
echo ""

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
for i in {1..30}; do
    if curl -s -f "http://$BACKEND_URL:8000/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend está respondiendo${NC}"
        break
    fi
    echo "Intento $i/30... esperando 5s"
    sleep 5
done
echo ""

# Paso 7: Deploy Frontend a Container Instances
echo "🌐 Paso 7: Deploy Frontend a Azure Container Instances"
echo "-------------------------------------------------------"

# Verificar si ya existe
if az container show --resource-group $RESOURCE_GROUP --name repuestera-frontend-aci &> /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend Container Instance ya existe. Eliminando...${NC}"
    az container delete \
        --resource-group $RESOURCE_GROUP \
        --name repuestera-frontend-aci \
        --yes
    echo "Esperando 10 segundos..."
    sleep 10
fi

echo "Desplegando Frontend Container..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name repuestera-frontend-aci \
    --image $ACR_LOGIN_SERVER/repuestera-frontend:latest \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --dns-name-label repuestera-frontend-tp08 \
    --ports 80 \
    --environment-variables \
        API_URL="http://$BACKEND_URL:8000" \
    --cpu 0.5 \
    --memory 1 \
    --output table

# Obtener URL del frontend
FRONTEND_URL=$(az container show \
    --resource-group $RESOURCE_GROUP \
    --name repuestera-frontend-aci \
    --query ipAddress.fqdn \
    --output tsv)

echo -e "${GREEN}✅ Frontend desplegado${NC}"
echo "URL Frontend: http://$FRONTEND_URL"
echo ""

# Paso 8: Verificación Final
echo "✅ Paso 8: Verificación Final"
echo "=============================="
echo ""

echo "🔍 Health Check Backend:"
curl -s "http://$BACKEND_URL:8000/api/health" | jq '.' || echo "Backend no responde aún"
echo ""

echo "🔍 Health Check Frontend:"
curl -s "http://$FRONTEND_URL/health" || echo "Frontend no responde aún"
echo ""

echo "📊 Estado de Container Instances:"
az container list \
    --resource-group $RESOURCE_GROUP \
    --query "[].{Name:name, Status:provisioningState, IP:ipAddress.fqdn}" \
    --output table
echo ""

# Resumen final
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOY COMPLETADO${NC}"
echo "=========================================="
echo ""
echo "📝 URLS DE LA APLICACIÓN:"
echo "-------------------------"
echo "Frontend:  http://$FRONTEND_URL"
echo "Backend:   http://$BACKEND_URL:8000"
echo "API Health: http://$BACKEND_URL:8000/api/health"
echo ""
echo "📊 RECURSOS AZURE:"
echo "-----------------"
echo "Resource Group: $RESOURCE_GROUP"
echo "ACR:           $ACR_NAME.azurecr.io"
echo "Región:        $LOCATION"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "-----------------"
echo "1. Abrir http://$FRONTEND_URL en el navegador"
echo "2. Registrar un usuario"
echo "3. Probar la aplicación"
echo ""
echo "📋 VER LOGS:"
echo "-----------"
echo "Backend:  az container logs -g $RESOURCE_GROUP -n repuestera-backend-aci"
echo "Frontend: az container logs -g $RESOURCE_GROUP -n repuestera-frontend-aci"
echo ""
echo "🗑️  LIMPIAR RECURSOS:"
echo "--------------------"
echo "az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo ""
