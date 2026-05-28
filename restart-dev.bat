@echo off
echo Deteniendo procesos de Node.js...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Limpiando archivos temporales...
if exist .next\cache rmdir /s /q .next\cache 2>nul

echo Iniciando servidor...
npm run dev
