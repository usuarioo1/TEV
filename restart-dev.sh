#!/bin/bash

echo "🔴 Deteniendo procesos de Node.js..."

# Detener todos los procesos de Node.js en Windows
taskkill //F //IM node.exe 2>/dev/null || true

# Esperar un momento
sleep 2

echo "🧹 Limpiando archivos temporales..."
rm -rf .next/cache 2>/dev/null || true

echo "🟢 Iniciando servidor..."
npm run dev
