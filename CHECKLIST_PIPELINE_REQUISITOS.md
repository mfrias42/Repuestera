# ✅ Checklist de Requisitos del Pipeline

## 📋 Información que necesitas verificar/pasar

### 🔴 **CRÍTICO - Debe estar correcto para que funcione:**

#### 1. **Azure Service Connection en Azure DevOps**
- **Nombre**: `Azure-Service-Connection`
- **Ubicación**: Project Settings → Service connections
- **Verificar**:
  - ✅ Existe
  - ✅ Está autorizada
  - ✅ Tiene permisos para:
    - Leer/escribir en App Services
    - Leer/escribir en Azure Container Registry (ACR)
    - Leer en Resource Groups
    - Acceder a la suscripción de Azure

#### 2. **Azure Container Registry (ACR)**
- **Nombre**: `repusteraacr`
- **Verificar con Azure CLI**:
  ```bash
  az acr show --name repusteraacr
  az acr credential show --name repusteraacr
  ```
- **Debe tener**:
  - ✅ Admin user habilitado
  - ✅ Credenciales disponibles
  - ✅ Repositorios: `repuestera-backend` y `repuestera-frontend`
  - ✅ Imágenes con tags: `qa-*`, `prod-*`, `latest`

#### 3. **App Services - QA**
- **Backend QA**: `back-qa-fufuc2ahgheph6ak`
  - Resource Group: (puede estar en cualquier RG)
  - URL: `https://back-qa-fufuc2ahgheph6ak.chilecentral-01.azurewebsites.net`
  - **Verificar**:
    - ✅ Existe
    - ✅ Estado: Running
    - ✅ Configurado como contenedor Docker
    - ✅ linuxFxVersion: `DOCKER|repusteraacr.azurecr.io/repuestera-backend:...`

- **Frontend QA**: `front-qa-fed6b2g5dfadeqdw`
  - Resource Group: (puede estar en cualquier RG)
  - URL: `https://front-qa-fed6b2g5dfadeqdw.chilecentral-01.azurewebsites.net`
  - **Verificar**:
    - ✅ Existe
    - ✅ Estado: Running
    - ✅ Configurado como contenedor Docker

#### 4. **App Services - Producción** (opcional para ahora)
- **Backend Prod**: `back-prod-eqdtfvgyb7ftfmdy`
- **Frontend Prod**: `front-prod-bdh2f7dya8c3ewbf`

#### 5. **Base de Datos MySQL**
- **Host**: `manufrias.mysql.database.azure.com`
- **Database**: `repuestera_db`
- **User**: `A`
- **Password**: `4286Pka1#`
- **Puerto**: `3306`
- **Verificar**:
  - ✅ Servidor MySQL existe
  - ✅ Base de datos existe
  - ✅ Usuario tiene permisos
  - ✅ Firewall permite conexiones desde App Services (0.0.0.0/0 o IPs específicas)

#### 6. **Resource Groups**
- **QA**: `rg-repuestera-qa` (o donde estén los App Services)
- **Verificar**: Existe y tiene los recursos necesarios

---

### 🟡 **IMPORTANTE - Afecta el funcionamiento:**

#### 7. **Configuración de Contenedores en App Services**
Cada App Service debe tener:
- ✅ `linuxFxVersion` configurado como `DOCKER|imagen`
- ✅ Container config apuntando al ACR
- ✅ Credenciales ACR configuradas

#### 8. **Imágenes Docker en ACR**
- ✅ Imágenes construidas y pusheadas al ACR
- ✅ Tags correctos: `qa-<BuildId>`, `prod-<BuildId>`, `latest`

---

### 🔵 **OPCIONAL - Mejora la experiencia:**

#### 9. **SonarCloud** (opcional)
- Service Connection: `SonarCloud`
- Organization: `mfrias42`
- Project Key: `mfrias42_tp05`

#### 10. **Environments en Azure DevOps**
- `qa-backend`
- `qa-frontend`
- `production-backend` (con aprobación manual opcional)
- `production-frontend` (con aprobación manual opcional)

---

## 🔧 **Comandos para Verificar**

### Verificar ACR:
```bash
az acr show --name repusteraacr
az acr repository list --name repusteraacr
az acr repository show-tags --name repusteraacr --repository repuestera-backend
az acr credential show --name repusteraacr
```

### Verificar App Services:
```bash
# Buscar App Service
az webapp list --query "[?name=='back-qa-fufuc2ahgheph6ak']"

# Ver información
az webapp show --name back-qa-fufuc2ahgheph6ak --resource-group <rg>

# Ver configuración de contenedor
az webapp config container show --name back-qa-fufuc2ahgheph6ak --resource-group <rg>

# Ver linuxFxVersion
az webapp config show --name back-qa-fufuc2ahgheph6ak --resource-group <rg --query linuxFxVersion
```

### Verificar MySQL:
```bash
# Listar servidores MySQL
az mysql flexible-server list

# Ver firewall rules
az mysql flexible-server firewall-rule list --resource-group <rg> --name <server-name>
```

---

## 📝 **Información que debes proporcionar:**

1. **¿El ACR existe y tiene imágenes?**
   - Ejecuta: `az acr repository show-tags --name repusteraacr --repository repuestera-backend`

2. **¿En qué Resource Group están los App Services?**
   - Ejecuta: `az webapp list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table`

3. **¿Los App Services están configurados como contenedores?**
   - Ejecuta: `az webapp config container show --name <nombre> --resource-group <rg>`

4. **¿Qué imagen tienen configurada actualmente?**
   - Revisa en Azure Portal o con: `az webapp config show --name <nombre> --resource-group <rg> --query linuxFxVersion`

5. **¿El MySQL permite conexiones desde App Services?**
   - Verifica las firewall rules en Azure Portal

---

## 🚀 **Script de Verificación Automática**

Ejecuta el script que creé:
```bash
./verify-pipeline-requirements.sh
```

Este script verificará automáticamente:
- ✅ Azure CLI instalado y autenticado
- ✅ ACR existe y tiene credenciales
- ✅ App Services existen
- ✅ Configuración de contenedores
- ✅ Resource Groups

---

## ⚠️ **Problemas Comunes y Soluciones**

### Problema: App Service no encuentra la imagen
**Solución**: Verificar que:
1. La imagen existe en ACR con el tag correcto
2. El App Service tiene credenciales ACR configuradas
3. El `linuxFxVersion` está configurado correctamente

### Problema: 404 en el backend
**Solución**: 
1. Verificar que el contenedor está corriendo
2. Verificar que el puerto es 8000
3. Verificar logs del App Service: `az webapp log tail --name <nombre> --resource-group <rg>`

### Problema: No se puede obtener configuración del contenedor
**Solución**:
1. Verificar que el App Service existe
2. Verificar que está en el resource group correcto
3. Verificar permisos de la Service Connection

