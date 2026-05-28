# 🔧 Solución: Segmentation Fault al Crear Alertas

## 🔴 Problema Identificado

```
Segmentation fault (Exit Code: 139)
Firefox no puede establecer conexión con ws://localhost:3000/_next/webpack-hmr
```

### Causa Raíz:
El **Segmentation fault** ocurre cuando el pool de conexiones de Prisma no se maneja correctamente, especialmente con el adaptador `@prisma/adapter-pg`.

## ✅ Soluciones Implementadas

### 1. **Pool de Conexiones Singleton** (`lib/prisma.ts`)

```typescript
// Pool ahora es singleton en global
const pool = globalForPrisma.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Guardar en global para evitar múltiples instancias
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
}
```

**Beneficio**: Evita crear múltiples pools que causan conflictos y crashes.

### 2. **Manejo de Errores del Pool**

```typescript
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
    // No relanzar el error para evitar crash del servidor
});
```

**Beneficio**: Captura errores sin hacer crash del proceso.

### 3. **Limpieza de Conexiones al Cerrar**

```typescript
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);
```

**Beneficio**: Cierra correctamente las conexiones antes de terminar el proceso.

### 4. **Scripts de Reinicio Seguro**

Creados dos scripts para reiniciar el servidor limpiamente:

#### **Windows (Git Bash):**
```bash
npm run dev:clean
```

#### **Windows (CMD):**
```bash
restart-dev.bat
```

Estos scripts:
- ✅ Matan todos los procesos de Node.js colgados
- ✅ Limpian la caché de Next.js
- ✅ Reinician el servidor

## 🚀 Pasos para Resolver el Error

### Opción 1: Usar el Script de Reinicio (Recomendado)

```bash
# En Git Bash
npm run dev:clean

# O directamente
./restart-dev.bat
```

### Opción 2: Reinicio Manual

1. **Detener todos los procesos de Node.js:**
   ```bash
   # En Git Bash
   taskkill //F //IM node.exe
   
   # En CMD
   taskkill /F /IM node.exe
   ```

2. **Limpiar la caché:**
   ```bash
   rm -rf .next/cache
   ```

3. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

### Opción 3: Reinicio del Sistema
Si el problema persiste, reinicia tu computadora para liberar todos los recursos.

## 🔍 Verificación del Problema

### Verificar procesos de Node.js:
```bash
# Ver cuántos procesos Node hay ejecutándose
tasklist | grep node
```

Si ves múltiples procesos de `node.exe`, eso puede causar el Segmentation fault.

## ⚠️ Prevención Futura

### 1. **Siempre cerrar el servidor correctamente**
- Usa `Ctrl+C` en la terminal
- Espera a que diga "closed" antes de cerrar
- No cierres la terminal directamente

### 2. **Monitorear la consola**
Busca estos mensajes:
```
🔌 Cerrando conexiones de base de datos...
❌ Error inesperado en el pool de conexiones
```

### 3. **Reiniciar periódicamente**
Si trabajas por muchas horas, reinicia el servidor cada 2-3 horas:
```bash
npm run dev:clean
```

## 🐛 Debugging Adicional

### Si el error persiste:

1. **Verificar versiones de dependencias:**
   ```bash
   npm list @prisma/adapter-pg @prisma/client pg
   ```

2. **Actualizar dependencias de Prisma:**
   ```bash
   npm update @prisma/adapter-pg @prisma/client prisma
   npm run postinstall
   ```

3. **Verificar memoria disponible:**
   El Segmentation fault puede ocurrir por falta de memoria.
   
4. **Verificar logs detallados:**
   ```bash
   NODE_OPTIONS='--trace-warnings' npm run dev
   ```

## 🔄 Alternativa: Prisma sin Adaptador

Si el problema persiste, puedes usar Prisma sin el adaptador pg:

```typescript
// lib/prisma.ts (alternativa)
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
```

**Nota**: Esto requiere cambiar el schema.prisma y regenerar el cliente.

## 📊 Configuración Actual

| Parámetro | Valor | Propósito |
|-----------|-------|-----------|
| `max` | 10 | Conexiones máximas simultáneas |
| `idleTimeoutMillis` | 30000 | Tiempo antes de cerrar conexión inactiva |
| `connectionTimeoutMillis` | 10000 | Tiempo máximo para conectar |
| Pool | Singleton | Una sola instancia compartida |
| Error Handling | Activo | Captura errores sin crash |
| Cleanup | Automático | Cierra conexiones al terminar |

## ✅ Checklist de Resolución

- [ ] Matar procesos de Node.js colgados
- [ ] Limpiar caché de Next.js (`.next/cache`)
- [ ] Reiniciar con `npm run dev:clean`
- [ ] Verificar que el servidor inicie sin errores
- [ ] Probar crear una alerta de prueba
- [ ] Verificar que no haya Segmentation fault

## 💡 Nota Importante

El error de WebSocket (`ws://localhost:3000/_next/webpack-hmr`) es **secundario** y ocurre porque el servidor crasheó. Una vez resuelto el Segmentation fault, el HMR funcionará correctamente.

---

**Última actualización**: Marzo 2026  
**Estado**: ✅ Implementado
