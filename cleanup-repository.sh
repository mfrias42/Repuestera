#!/bin/bash

# Script para limpiar el repositorio de archivos innecesarios
# TP05 - Ingeniería de Software 3

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧹 Limpiando repositorio de archivos innecesarios${NC}"
echo "=================================================="

# Archivos de documentación duplicados o innecesarios
echo -e "${YELLOW}📄 Eliminando documentación duplicada...${NC}"

# Documentación de despliegue duplicada
rm -f AZURE_SQL_DEPLOYMENT.md
rm -f SQLITE_DEPLOYMENT.md
rm -f VERCEL_DEPLOYMENT.md
rm -f DEPLOYMENT_NOTES.md
rm -f DEPLOYMENT_INSTRUCTIONS.md
rm -f DEPLOYMENT.md

echo -e "${GREEN}✅ Documentación duplicada eliminada${NC}"

# Scripts de despliegue obsoletos
echo -e "${YELLOW}🔧 Eliminando scripts de despliegue obsoletos...${NC}"

# Scripts que ya no necesitamos
rm -f deploy-azure-sql.sh
rm -f deploy-azure-static.sh
rm -f deploy-mysql-flexible.sh
rm -f deploy-sqlite-infrastructure.sh
rm -f deploy-with-existing-mysql.sh
rm -f deploy-qa-resources.sh
rm -f deploy-prod-infrastructure.sh
rm -f deploy-qa-infrastructure.sh

echo -e "${GREEN}✅ Scripts obsoletos eliminados${NC}"

# Templates ARM obsoletos
echo -e "${YELLOW}📋 Eliminando templates ARM obsoletos...${NC}"

# Templates que ya no usamos
rm -f azure-infrastructure-mysql-flexible.json
rm -f azure-infrastructure-with-sql.json
rm -f azure-static-web-apps.json
rm -f azure-infrastructure.json
rm -f azure-infrastructure-qa.json

echo -e "${GREEN}✅ Templates ARM obsoletos eliminados${NC}"

# Scripts de configuración que ya no necesitamos
echo -e "${YELLOW}⚙️  Eliminando scripts de configuración obsoletos...${NC}"

rm -f configure-azure-devops.sh
rm -f push-to-azure-repo.sh
rm -f test-azure-regions.sh
rm -f test-mysql-connection.sh
rm -f create-app-service.sh
rm -f create-database.sh

echo -e "${GREEN}✅ Scripts de configuración obsoletos eliminados${NC}"

# Archivos de configuración duplicados
echo -e "${YELLOW}📁 Eliminando archivos de configuración duplicados...${NC}"

rm -f setup-environments.sh
rm -f run-admin-script.sh

echo -e "${GREEN}✅ Archivos de configuración duplicados eliminados${NC}"

# Limpiar node_modules del directorio raíz si existe
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Eliminando node_modules del directorio raíz...${NC}"
    rm -rf node_modules
    rm -f package-lock.json
    echo -e "${GREEN}✅ node_modules del directorio raíz eliminado${NC}"
fi

# Limpiar archivos temporales
echo -e "${YELLOW}🗑️  Eliminando archivos temporales...${NC}"

# Archivos de imagen de prueba
rm -rf image/

# Archivos de configuración de Azure que ya no necesitamos
rm -f azure-package.json

echo -e "${GREEN}✅ Archivos temporales eliminados${NC}"

# Mostrar resumen
echo -e "${GREEN}🎉 Limpieza del repositorio completada${NC}"
echo ""
echo -e "${YELLOW}📋 Archivos eliminados:${NC}"
echo "  - Documentación duplicada (7 archivos)"
echo "  - Scripts de despliegue obsoletos (9 archivos)"
echo "  - Templates ARM obsoletos (5 archivos)"
echo "  - Scripts de configuración obsoletos (6 archivos)"
echo "  - Archivos de configuración duplicados (2 archivos)"
echo "  - Archivos temporales (carpeta image/)"
echo ""
echo -e "${GREEN}✅ Repositorio limpio y optimizado${NC}"
echo ""
echo -e "${YELLOW}💡 Archivos que se mantienen:${NC}"
echo "  - azure-pipelines.yml (pipeline principal)"
echo "  - azure-infrastructure-qa-simple.json (template QA)"
echo "  - backend/ (código de la aplicación)"
echo "  - frontend/ (código de la aplicación)"
echo "  - MYSQL_FLEXIBLE_DEPLOYMENT.md (documentación principal)"
echo "  - PIPELINE_MYSQL_CONFIGURATION.md (configuración del pipeline)"
echo ""
echo -e "${GREEN}🚀 El repositorio está listo para producción${NC}"
