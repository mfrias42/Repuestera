# Configuración de SonarCloud en Azure DevOps Pipeline

## ✅ Estado Actual
Tu pipeline **YA tiene configurado SonarCloud** en las siguientes tareas:
- ✅ `SonarCloudPrepare@3` (línea 43)
- ✅ `SonarCloudAnalyze@3` (línea 103)
- ✅ `SonarCloudPublish@3` (línea 106)

## 🔧 Configuración Requerida en Azure DevOps

### Paso 1: Crear Service Connection en Azure DevOps

1. **Accede a tu proyecto en Azure DevOps**
   - Ve a: https://dev.azure.com/tu-organizacion/Repuestera

2. **Configurar Service Connection**
   ```
   Project Settings (abajo a la izquierda)
   → Service connections
   → New service connection
   → SonarCloud
   ```

3. **Datos a completar:**
   - **SonarCloud Token**: Tu token de SonarCloud (generado en https://sonarcloud.io/account/security)
   - **Service connection name**: `SonarCloud` (debe coincidir con `azure-pipelines.yml` línea 27)
   - **Description**: "SonarCloud analysis for Repuestera"
   - ☑️ Grant access permission to all pipelines

4. **Crear el token en SonarCloud:**
   ```
   https://sonarcloud.io/account/security
   → Generate Tokens
   → Name: "Azure Pipeline - Repuestera"
   → Type: Project Analysis Token
   → Click "Generate"
   → COPIAR EL TOKEN (solo se muestra una vez)
   ```

### Paso 2: Verificar el Proyecto en SonarCloud

1. **Accede a SonarCloud**: https://sonarcloud.io
2. **Ve a tu organización**: `mfrias42`
3. **Verifica que existe el proyecto**: `mfrias42_tp05`
   
   **Si NO existe el proyecto:**
   - Click en el botón `+` (arriba derecha)
   - "Analyze new project"
   - Selecciona el repositorio: `mfrias42/Repuestera`
   - Configura:
     - **Project Key**: `mfrias42_tp05`
     - **Organization**: `mfrias42`
   - "Set up"

### Paso 3: Configurar el Proyecto en SonarCloud

Una vez creado el proyecto en SonarCloud:

1. **Ve a**: Project Settings → General Settings
2. **Verifica**:
   - Project Key: `mfrias42_tp05`
   - Project Name: `tp05`
   - Organization: `mfrias42`

3. **Configurar Quality Gate** (opcional):
   ```
   Project Settings → Quality Gate
   → Use "Sonar way" (recomendado)
   ```

## 🚀 Flujo de Ejecución en el Pipeline

Cuando hagas push a tu repositorio:

```mermaid
1. Trigger (push a main)
   ↓
2. Build Stage
   ↓
3. Install dependencies (backend)
   ↓
4. SonarCloudPrepare - Prepara el análisis
   ↓
5. npm test:ci - Ejecuta tests
   ↓
6. npm test:coverage - Genera cobertura (77.31%)
   ↓
7. SonarCloudAnalyze - Analiza el código
   ↓
8. SonarCloudPublish - Publica resultados
   ↓
9. Quality Gate check ✅/❌
```

## 📊 Métricas que Analizará

SonarCloud evaluará:

### Backend (77.31% coverage actual)
- **Bugs**: 0 esperados
- **Vulnerabilities**: 0 esperadas
- **Code Smells**: ~10-20 (típico)
- **Coverage**: 77.31%
- **Duplications**: < 3%
- **Security Hotspots**: Revisar

### Frontend
- **Coverage**: Variable (dependencias pendientes)
- **Code Quality**: React best practices
- **TypeScript issues** (si aplica)

## ✅ Verificación Post-Deploy

Después del primer pipeline exitoso:

1. **Ver resultados en SonarCloud**:
   ```
   https://sonarcloud.io/project/overview?id=mfrias42_tp05
   ```

2. **Dashboard mostrará**:
   - Quality Gate Status (Passed/Failed)
   - Bugs, Vulnerabilities, Code Smells
   - Coverage % con trend
   - Duplications %
   - Security Hotspots

3. **En Azure DevOps**:
   - Pipeline → Summary
   - Verás "SonarCloud Analysis" con link a reporte
   - Badge de Quality Gate

## 🎯 Quality Gate por Defecto

El Quality Gate "Sonar way" requiere:

| Métrica | Condición |
|---------|-----------|
| Coverage on New Code | ≥ 80% |
| Duplicated Lines on New Code | ≤ 3% |
| Maintainability Rating on New Code | ≥ A |
| Reliability Rating on New Code | ≥ A |
| Security Rating on New Code | ≥ A |
| Security Hotspots Reviewed | = 100% |

## 🔒 Seguridad del Token

✅ **Correcto** (Pipeline):
- Token almacenado en Azure DevOps Service Connection
- Encriptado automáticamente
- No visible en logs
- No commitado al repositorio

❌ **Incorrecto** (Local):
- Token en `sonar-project.properties`
- Token en variables de entorno sin encriptar
- Token en el código fuente

## 📝 Próximos Pasos

1. **Ahora mismo**:
   - [ ] Crear Service Connection en Azure DevOps con tu token de SonarCloud
   - [ ] Verificar/crear proyecto en SonarCloud
   - [ ] Hacer commit y push para triggear el pipeline

2. **Después del primer análisis**:
   - [ ] Revisar Quality Gate status
   - [ ] Corregir Code Smells críticos
   - [ ] Documentar resultados para el TP
   - [ ] Agregar badge de SonarCloud al README

## 🏆 Beneficios vs Análisis Local

| Aspecto | Pipeline ✅ | Local ❌ |
|---------|------------|----------|
| **Seguridad** | Token encriptado | Token expuesto |
| **Automatización** | Auto en cada push | Manual |
| **Historial** | Full timeline | Solo snapshot |
| **Quality Gate** | Bloquea merges | Solo informativo |
| **Setup** | Una sola vez | En cada máquina |
| **CI/CD Integration** | Nativo | No integrado |

## 📚 Recursos

- **SonarCloud Docs**: https://docs.sonarcloud.io
- **Azure Task**: https://docs.sonarcloud.io/getting-started/azure-devops/
- **Quality Gates**: https://docs.sonarcloud.io/improving/quality-gates/

## 🎓 Para tu Informe del TP

Puedes documentar que implementaste:

1. ✅ **Análisis estático automatizado** con SonarCloud
2. ✅ **Integración en CI/CD** (Azure Pipelines)
3. ✅ **Quality Gates** para bloquear código de mala calidad
4. ✅ **Coverage tracking** con histórico (77.31% backend)
5. ✅ **Security scanning** automático
6. ✅ **Code smell detection** en cada commit

---

**Próximo comando**: Hacer push para ver el análisis en acción 🚀
