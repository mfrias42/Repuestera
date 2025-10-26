#!/bin/bash

# Script para probar regiones disponibles en Azure for Students
# TP05 - Ingeniería de Software 3

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌍 Probando regiones disponibles en Azure for Students${NC}"
echo "=================================================="

# Lista de regiones a probar (las más comunes para estudiantes)
REGIONS=(
    "East US"
    "West US 2"
    "Central US"
    "North Central US"
    "South Central US"
    "West Europe"
    "North Europe"
    "Southeast Asia"
    "East Asia"
    "Australia East"
    "Brazil South"
    "Canada Central"
    "Japan East"
    "Korea Central"
    "France Central"
    "Germany West Central"
    "UK South"
    "Sweden Central"
    "Norway East"
    "Switzerland North"
)

# Función para probar una región
test_region() {
    local region=$1
    local resource_group="rg-test-${region,,}"
    local resource_group=${resource_group// /-}
    
    echo -e "${YELLOW}🔍 Probando región: $region${NC}"
    
    # Crear resource group temporal
    if az group create --name "$resource_group" --location "$region" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Resource Group creado en $region${NC}"
        
        # Intentar crear un App Service Plan básico
        if az appservice plan create \
            --name "test-plan-${region,,}" \
            --resource-group "$resource_group" \
            --location "$region" \
            --sku F1 \
            --is-linux > /dev/null 2>&1; then
            echo -e "${GREEN}✅ App Service Plan F1 disponible en $region${NC}"
            
            # Limpiar recursos
            az group delete --name "$resource_group" --yes > /dev/null 2>&1
            return 0
        else
            echo -e "${RED}❌ App Service Plan F1 NO disponible en $region${NC}"
            az group delete --name "$resource_group" --yes > /dev/null 2>&1
            return 1
        fi
    else
        echo -e "${RED}❌ No se puede crear Resource Group en $region${NC}"
        return 1
    fi
}

# Probar cada región
AVAILABLE_REGIONS=()
UNAVAILABLE_REGIONS=()

for region in "${REGIONS[@]}"; do
    if test_region "$region"; then
        AVAILABLE_REGIONS+=("$region")
    else
        UNAVAILABLE_REGIONS+=("$region")
    fi
    echo ""
done

# Mostrar resultados
echo -e "${GREEN}🎉 RESUMEN DE REGIONES DISPONIBLES${NC}"
echo "=================================="

if [ ${#AVAILABLE_REGIONS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Regiones DISPONIBLES (${#AVAILABLE_REGIONS[@]}):${NC}"
    for region in "${AVAILABLE_REGIONS[@]}"; do
        echo "  - $region"
    done
else
    echo -e "${RED}❌ No se encontraron regiones disponibles${NC}"
fi

echo ""

if [ ${#UNAVAILABLE_REGIONS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Regiones NO disponibles (${#UNAVAILABLE_REGIONS[@]}):${NC}"
    for region in "${UNAVAILABLE_REGIONS[@]}"; do
        echo "  - $region"
    done
fi

echo ""

if [ ${#AVAILABLE_REGIONS[@]} -gt 0 ]; then
    echo -e "${YELLOW}💡 RECOMENDACIÓN:${NC}"
    echo "Usar la primera región disponible: ${AVAILABLE_REGIONS[0]}"
    echo ""
    echo -e "${GREEN}🚀 Comando para desplegar:${NC}"
    echo "LOCATION=\"${AVAILABLE_REGIONS[0]}\" ./deploy-sqlite-infrastructure.sh"
else
    echo -e "${RED}🚨 CONCLUSIÓN:${NC}"
    echo "Azure for Students tiene limitaciones muy severas."
    echo "Recomendamos usar alternativas como Vercel, Railway o Render."
fi
