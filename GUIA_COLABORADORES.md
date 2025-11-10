# Guía para Colaboradores - Configuración de Remotes

Esta guía explica cómo configurar tu repositorio local para poder hacer push tanto a GitHub como a Azure DevOps.

## 📋 Requisitos Previos

1. **Permisos en GitHub**: Debes ser colaborador del repositorio `mfrias42/Repuestera`
2. **Permisos en Azure DevOps**: Debes tener acceso al proyecto `tp05` en la organización `mfrias42`
3. **Token de acceso personal (PAT) para Azure DevOps**: Necesitas generar uno con permisos de código

## 🔧 Configuración Paso a Paso

### Paso 1: Clonar el Repositorio

```bash
# Opción A: Clonar desde GitHub (recomendado)
git clone https://github.com/mfrias42/Repuestera.git
cd Repuestera

# Opción B: Si ya tienes el repo clonado, solo necesitas agregar el remote de Azure
```

### Paso 2: Verificar Remotes Actuales

```bash
git remote -v
```

Deberías ver:
- `origin` → GitHub
- (posiblemente `azure` si ya está configurado)

### Paso 3: Agregar Remote de Azure DevOps

Si no tienes el remote `azure` configurado:

```bash
# Obtén tu Personal Access Token (PAT) de Azure DevOps
# Ve a: Azure DevOps → User Settings → Personal Access Tokens → New Token
# Permisos necesarios: Code (Read & Write)

# Agregar el remote de Azure
git remote add azure https://<TU-PAT>@dev.azure.com/mfrias42/tp05/_git/tp05
```

**⚠️ IMPORTANTE**: Reemplaza `<TU-PAT>` con tu propio Personal Access Token de Azure DevOps.

### Paso 4: Verificar Configuración

```bash
git remote -v
```

Deberías ver ambos remotes:
```
azure    https://<TU-PAT>@dev.azure.com/mfrias42/tp05/_git/tp05 (fetch)
azure    https://<TU-PAT>@dev.azure.com/mfrias42/tp05/_git/tp05 (push)
origin   https://github.com/mfrias42/Repuestera.git (fetch)
origin   https://github.com/mfrias42/Repuestera.git (push)
```

## 🚀 Hacer Push a Ambos Remotes

### Opción 1: Push a Ambos en un Solo Comando

```bash
git push origin main && git push azure main
```

### Opción 2: Push Individual

```bash
# Push a GitHub
git push origin main

# Push a Azure DevOps
git push azure main
```

### Opción 3: Configurar Push Automático (Opcional)

Si quieres que `git push origin` automáticamente haga push a ambos:

```bash
git remote set-url --add --push origin https://github.com/mfrias42/Repuestera.git
git remote set-url --add --push origin https://<TU-PAT>@dev.azure.com/mfrias42/tp05/_git/tp05
```

Luego solo necesitas:
```bash
git push origin main
```

## 🔐 Generar Personal Access Token (PAT) en Azure DevOps

1. Ve a [Azure DevOps](https://dev.azure.com)
2. Click en tu perfil (esquina superior derecha) → **Security**
3. Click en **Personal access tokens** → **+ New Token**
4. Configura:
   - **Name**: `Repuestera Git Access`
   - **Organization**: `mfrias42`
   - **Expiration**: Elige una fecha (ej: 90 días)
   - **Scopes**: Selecciona **Code (Read & Write)**
5. Click en **Create**
6. **⚠️ COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)

## ✅ Verificar Permisos

### En GitHub:
1. Ve a: `https://github.com/mfrias42/Repuestera`
2. Settings → Collaborators
3. Verifica que tu usuario esté en la lista

### En Azure DevOps:
1. Ve a: `https://dev.azure.com/mfrias42/tp05`
2. Project Settings → Repositories → Security
3. Verifica que tengas permisos de **Contribute**

## 🐛 Solución de Problemas

### Error: "Permission denied"
- Verifica que tengas permisos en el repositorio
- Verifica que tu PAT tenga los permisos correctos
- Asegúrate de que el PAT no haya expirado

### Error: "Remote not found"
- Verifica que hayas agregado el remote correctamente: `git remote -v`
- Si falta, agrégalo con: `git remote add azure <URL>`

### Error: "Authentication failed"
- Regenera tu PAT en Azure DevOps
- Actualiza la URL del remote: `git remote set-url azure <NUEVA-URL-CON-PAT>`

## 📝 Notas Importantes

1. **Seguridad**: Nunca compartas tu PAT públicamente. Si lo haces por error, revócalo inmediatamente.
2. **Sincronización**: Siempre haz pull antes de push para evitar conflictos:
   ```bash
   git pull origin main
   git pull azure main
   git push origin main && git push azure main
   ```
3. **Ramas**: Asegúrate de estar en la rama correcta antes de hacer push:
   ```bash
   git branch  # Ver rama actual
   git checkout main  # Cambiar a main si es necesario
   ```

## 🔄 Flujo de Trabajo Recomendado

```bash
# 1. Actualizar desde ambos remotes
git pull origin main
git pull azure main

# 2. Hacer tus cambios y commitear
git add .
git commit -m "Tu mensaje de commit"

# 3. Push a ambos remotes
git push origin main && git push azure main
```

## 📞 Soporte

Si tienes problemas con la configuración, contacta al administrador del repositorio.

