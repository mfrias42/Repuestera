#!/bin/bash

# Script para crear la base de datos en MySQL Flexible Server
# TP05 - Ingeniería de Software 3

set -e

# Configuración
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

echo -e "${GREEN}🗄️  Creando base de datos en MySQL Flexible Server${NC}"
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

# Verificar que el servidor MySQL existe
echo -e "${YELLOW}🔍 Verificando MySQL Flexible Server...${NC}"
if ! az mysql flexible-server show --resource-group "$RESOURCE_GROUP" --name "$MYSQL_SERVER" > /dev/null 2>&1; then
    echo -e "${RED}❌ MySQL Flexible Server '$MYSQL_SERVER' no encontrado en resource group '$RESOURCE_GROUP'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL Flexible Server '$MYSQL_SERVER' encontrado${NC}"

# Crear la base de datos
echo -e "${YELLOW}📦 Creando base de datos '$DATABASE_NAME'...${NC}"
az mysql flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$MYSQL_SERVER" \
    --database-name "$DATABASE_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos '$DATABASE_NAME' creada exitosamente${NC}"
else
    echo -e "${RED}❌ Error creando la base de datos${NC}"
    exit 1
fi

# Mostrar información de conexión
echo -e "${GREEN}🎉 Base de datos configurada correctamente${NC}"
echo ""
echo -e "${YELLOW}📋 Información de conexión:${NC}"
echo "  - Servidor: $MYSQL_SERVER.mysql.database.azure.com"
echo "  - Base de datos: $DATABASE_NAME"
echo "  - Usuario: $MYSQL_USER"
echo "  - Contraseña: $MYSQL_PASSWORD"
echo "  - Puerto: 3306"
echo ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo "1. Configurar App Service con estas credenciales"
echo "2. Actualizar variables de entorno"
echo "3. Probar conexión desde la aplicación"
echo ""
echo -e "${GREEN}🔧 Comando para conectar manualmente:${NC}"
echo "mysql -h $MYSQL_SERVER.mysql.database.azure.com -u $MYSQL_USER -p$MYSQL_PASSWORD $DATABASE_NAME"
