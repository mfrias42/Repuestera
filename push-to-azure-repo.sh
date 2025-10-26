#!/bin/bash

# Script para hacer push al repositorio remoto de Azure
# TP05 - Ingeniería de Software 3

set -e

# Configuración
AZURE_REPO_URL="https://dev.azure.com/tu-organizacion/tu-proyecto/_git/tu-repositorio"  # Cambiar por tu URL
BRANCH="main"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Haciendo push al repositorio remoto de Azure${NC}"
echo "=================================================="

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ No estás en un repositorio git${NC}"
    exit 1
fi

# Verificar que git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado${NC}"
    exit 1
fi

# Verificar el estado del repositorio
echo -e "${YELLOW}📋 Verificando estado del repositorio...${NC}"
git status

# Agregar todos los archivos
echo -e "${YELLOW}📦 Agregando archivos al staging...${NC}"
git add .

# Hacer commit con mensaje descriptivo
echo -e "${YELLOW}💾 Haciendo commit...${NC}"
git commit -m "feat: Configurar despliegue con MySQL Flexible Server

- Actualizar pipeline para usar MySQL Flexible Server
- Configurar variables de entorno para QA y Producción
- Agregar scripts de despliegue y configuración
- Configurar conexión a manufrias.mysql.database.azure.com
- Actualizar documentación de despliegue

Cambios principales:
- azure-pipelines.yml: Actualizado para MySQL
- Scripts de despliegue: create-database.sh, create-app-service.sh
- Configuración híbrida: SQLite local, MySQL en Azure
- Variables de entorno: DB_TYPE=mysql, DB_HOST, DB_USER, etc."

# Verificar si hay un remote de Azure configurado
if ! git remote get-url azure &> /dev/null; then
    echo -e "${YELLOW}🔗 Configurando remote de Azure...${NC}"
    git remote add azure $AZURE_REPO_URL
    echo -e "${GREEN}✅ Remote de Azure configurado${NC}"
else
    echo -e "${GREEN}✅ Remote de Azure ya existe${NC}"
fi

# Hacer push al repositorio remoto
echo -e "${YELLOW}🚀 Haciendo push al repositorio remoto...${NC}"
git push azure $BRANCH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Push exitoso al repositorio remoto de Azure${NC}"
    echo ""
    echo -e "${YELLOW}📋 Información del push:${NC}"
    echo "  - Repositorio: $AZURE_REPO_URL"
    echo "  - Rama: $BRANCH"
    echo "  - Commit: $(git rev-parse HEAD)"
    echo ""
    echo -e "${GREEN}🔧 Próximos pasos:${NC}"
    echo "1. Verificar que el pipeline se ejecute automáticamente"
    echo "2. Monitorear el despliegue en Azure DevOps"
    echo "3. Probar la aplicación en QA"
    echo "4. Aprobar el despliegue a Producción"
    echo ""
    echo -e "${YELLOW}💡 Comandos útiles:${NC}"
    echo "  - Ver logs del pipeline: az pipelines runs list"
    echo "  - Ejecutar pipeline manualmente: az pipelines run --name 'tu-pipeline-name'"
    echo "  - Ver estado de los recursos: az webapp list --resource-group rg-repuestera-qa"
else
    echo -e "${RED}❌ Error haciendo push al repositorio remoto${NC}"
    exit 1
fi
