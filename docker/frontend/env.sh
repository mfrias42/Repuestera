#!/bin/sh
# Script para inyectar variables de entorno en runtime
# Se ejecuta automáticamente cuando el contenedor inicia

# Crear archivo env-config.js con las variables de entorno
cat <<EOF > /usr/share/nginx/html/env-config.js
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-http://localhost:8000}",
  REACT_APP_ENV: "${REACT_APP_ENV:-production}"
};
EOF

echo "✅ Variables de entorno inyectadas:"
echo "   REACT_APP_API_URL: ${REACT_APP_API_URL:-http://localhost:8000}"
echo "   REACT_APP_ENV: ${REACT_APP_ENV:-production}"
