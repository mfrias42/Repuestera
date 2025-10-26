#!/bin/bash

# Script conservador para limpiar el repositorio
# TP05 - Ingeniería de Software 3

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧹 Limpieza conservadora del repositorio${NC}"
echo "============================================="

# Solo eliminar archivos que definitivamente no necesitas
echo -e "${YELLOW}📄 Eliminando documentación duplicada...${NC}"

# Documentación que definitivamente no necesitas
rm -f AZURE_SQL_DEPLOYMENT.md
rm -f SQLITE_DEPLOYMENT.md
rm -f VERCEL_DEPLOYMENT.md
rm -f DEPLOYMENT_NOTES.md
rm -f DEPLOYMENT_INSTRUCTIONS.md
rm -f DEPLOYMENT.md

echo -e "${GREEN}✅ Documentación duplicada eliminada${NC}"

# Solo eliminar scripts que definitivamente no necesitas
echo -e "${YELLOW}🔧 Eliminando scripts obsoletos...${NC}"

# Scripts que ya no necesitas porque ya tienes MySQL configurado
rm -f deploy-mysql-flexible.sh
rm -f deploy-sqlite-infrastructure.sh
rm -f deploy-with-existing-mysql.sh

# Scripts de configuración que ya no necesitas
rm -f configure-azure-devops.sh
rm -f push-to-azure-repo.sh
rm -f test-azure-regions.sh
rm -f test-mysql-connection.sh
rm -f create-app-service.sh
rm -f create-database.sh

echo -e "${GREEN}✅ Scripts obsoletos eliminados${NC}"

# Solo eliminar templates que definitivamente no necesitas
echo -e "${YELLOW}📋 Eliminando templates obsoletos...${NC}"

# Template que ya no necesitas porque ya tienes MySQL configurado
rm -f azure-infrastructure-mysql-flexible.json

echo -e "${GREEN}✅ Templates obsoletos eliminados${NC}"

# Eliminar archivos temporales
echo -e "${YELLOW}🗑️  Eliminando archivos temporales...${NC}"

# Archivos de imagen de prueba
rm -rf image/

# Archivos de configuración de Azure que ya no necesitas
rm -f azure-package.json

echo -e "${GREEN}✅ Archivos temporales eliminados${NC}"

# Limpiar node_modules del directorio raíz si existe
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Eliminando node_modules del directorio raíz...${NC}"
    rm -rf node_modules
    rm -f package-lock.json
    echo -e "${GREEN}✅ node_modules del directorio raíz eliminado${NC}"
fi

# Mostrar resumen
echo -e "${GREEN}🎉 Limpieza conservadora completada${NC}"
echo ""
echo -e "${YELLOW}📋 Archivos eliminados:${NC}"
echo "  - Documentación duplicada (6 archivos)"
echo "  - Scripts obsoletos (7 archivos)"
echo "  - Templates obsoletos (1 archivo)"
echo "  - Archivos temporales (carpeta image/)"
echo ""
echo -e "${GREEN}✅ Archivos que se mantienen (por seguridad):${NC}"
echo "  - deploy-azure-sql.sh (por si necesitas Azure SQL)"
echo "  - deploy-azure-static.sh (por si necesitas Static Web Apps)"
echo "  - deploy-qa-resources.sh (por si necesitas QA)"
echo "  - deploy-prod-infrastructure.sh (por si necesitas producción)"
echo "  - deploy-qa-infrastructure.sh (por si necesitas QA)"
echo "  - azure-infrastructure-with-sql.json (por si necesitas Azure SQL)"
echo "  - azure-static-web-apps.json (por si necesitas Static Web Apps)"
echo "  - azure-infrastructure.json (por si necesitas producción)"
echo "  - azure-infrastructure-qa.json (por si necesitas QA)"
echo ""
echo -e "${GREEN}🚀 El repositorio está limpio pero conservador${NC}"
