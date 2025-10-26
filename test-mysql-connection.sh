#!/bin/bash

# Script para probar la conexión a MySQL Flexible Server
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

echo -e "${GREEN}🔍 Probando conexión a MySQL Flexible Server${NC}"
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

# Verificar que el servidor MySQL existe
echo -e "${YELLOW}🔍 Verificando MySQL Flexible Server...${NC}"
if ! az mysql flexible-server show --resource-group "$RESOURCE_GROUP" --name "$MYSQL_SERVER" > /dev/null 2>&1; then
    echo -e "${RED}❌ MySQL Flexible Server '$MYSQL_SERVER' no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL Flexible Server '$MYSQL_SERVER' encontrado${NC}"

# Verificar que la base de datos existe
echo -e "${YELLOW}🔍 Verificando base de datos...${NC}"
if ! az mysql flexible-server db show --resource-group "$RESOURCE_GROUP" --server-name "$MYSQL_SERVER" --database-name "$DATABASE_NAME" > /dev/null 2>&1; then
    echo -e "${RED}❌ Base de datos '$DATABASE_NAME' no encontrada${NC}"
    echo -e "${YELLOW}💡 Ejecutar primero: ./create-database.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Base de datos '$DATABASE_NAME' encontrada${NC}"

# Probar conexión usando Azure CLI
echo -e "${YELLOW}🔗 Probando conexión a MySQL...${NC}"
if az mysql flexible-server execute \
    --resource-group "$RESOURCE_GROUP" \
    --name "$MYSQL_SERVER" \
    --admin-user "$MYSQL_USER" \
    --admin-password "$MYSQL_PASSWORD" \
    --database-name "$DATABASE_NAME" \
    --querytext "SELECT 1 as test_connection;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión a MySQL exitosa${NC}"
else
    echo -e "${RED}❌ Error conectando a MySQL${NC}"
    exit 1
fi

# Mostrar información de conexión
echo -e "${GREEN}🎉 Conexión verificada correctamente${NC}"
echo ""
echo -e "${YELLOW}📋 Información de conexión:${NC}"
echo "  - Servidor: $MYSQL_SERVER.mysql.database.azure.com"
echo "  - Base de datos: $DATABASE_NAME"
echo "  - Usuario: $MYSQL_USER"
echo "  - Contraseña: $MYSQL_PASSWORD"
echo "  - Puerto: 3306"
echo ""
echo -e "${GREEN}🔧 Comando para conectar manualmente:${NC}"
echo "mysql -h $MYSQL_SERVER.mysql.database.azure.com -u $MYSQL_USER -p$MYSQL_PASSWORD $DATABASE_NAME"
echo ""
echo -e "${YELLOW}💡 Variables de entorno para la aplicación:${NC}"
echo "DB_TYPE=mysql"
echo "DB_HOST=$MYSQL_SERVER.mysql.database.azure.com"
echo "DB_USER=$MYSQL_USER"
echo "DB_PASSWORD=$MYSQL_PASSWORD"
echo "DB_NAME=$DATABASE_NAME"
echo "DB_PORT=3306"
