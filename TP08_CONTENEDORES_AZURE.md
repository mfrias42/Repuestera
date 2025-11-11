# 🚀 TP08 - Guía Rápida: Despliegue en Azure

> **Pasos para desplegar contenedores Docker en Azure**

---

## 📋 Pre-requisitos

✅ Docker instalado localmente  
✅ Azure CLI instalado: `az --version`  
✅ Cuenta Azure con créditos  
✅ Imágenes Docker construidas localmente  

---

## 🔧 Paso 1: Crear Azure Container Registry (ACR)

```bash
# Login a Azure
az login

# Variables
export RESOURCE_GROUP="repuestera-rg"
export ACR_NAME="repusteraacr"
export LOCATION="eastus"

# Crear resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Crear ACR (Basic SKU)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Obtener login server
export ACR_LOGIN_SERVER=$(az acr show \
  --name $ACR_NAME \
  --query loginServer \
  --output tsv)

echo "✅ ACR creado: $ACR_LOGIN_SERVER"
```

---

## 📝 NOTAS IMPORTANTES

Este TP08 está **PARCIALMENTE IMPLEMENTADO**:

✅ **Completado Localmente**:
- Docker Compose configurado
- Dockerfiles optimizados (multi-stage builds)
- Stack funcionando: MySQL + Backend + Frontend
- Health checks implementados
- Volúmenes persistentes
- Networking configurado

⏳ **Pendiente en Azure**:
- Crear Azure Container Registry
- Push de imágenes a ACR
- Deploy a Container Instances
- Integración con Azure Pipeline

**Razón**: Se priorizó el fix crítico del TP07 (tests Cypress fallando).

---

## 🚀 Próximos Pasos

Ver documentación completa en: **DOCUMENTACION_TP08_DOCKER.md**

