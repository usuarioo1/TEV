# 🔌 Configuración de Conexiones a Base de Datos

## ✅ Mejoras Implementadas

### 1. **Aumento del Pool de Conexiones** (`lib/prisma.ts`)
```typescript
max: 20  // Antes: 10 - Ahora soporta el doble de conexiones simultáneas
min: 2   // Mantiene 2 conexiones siempre listas
```

### 2. **Timeouts Aumentados**
```typescript
connectionTimeoutMillis: 20000  // Antes: 10000 - Más tiempo para establecer conexión
```

### 3. **Parámetros en DATABASE_URL** (`.env`)
```
connection_limit=20   // Límite del lado de Prisma
pool_timeout=30       // 30 segundos de espera para obtener conexión
connect_timeout=20    // 20 segundos para conectarse a la BD
```

### 4. **Logging de Eventos del Pool**
- Monitoreo de conexiones establecidas
- Detección de errores en el pool
- Tracking de conexiones removidas

## 📊 Configuración Actual

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `max` | 20 | Máximo de conexiones simultáneas |
| `min` | 2 | Conexiones mínimas mantenidas |
| `idleTimeoutMillis` | 30000 | Tiempo antes de cerrar conexión inactiva |
| `connectionTimeoutMillis` | 20000 | Tiempo máximo para establecer conexión |
| `pool_timeout` | 30s | Tiempo de espera en el pool |
| `connect_timeout` | 20s | Timeout de conexión a PostgreSQL |

## 🔍 Monitoreo del Pool

En desarrollo, verás logs como:
```
🔌 Nueva conexión establecida al pool
🔴 Conexión removida del pool
❌ Error en el pool de conexiones: [detalles]
```

## ⚠️ Limitaciones de Prisma Cloud

Tu base de datos está en **Prisma Cloud** (`db.prisma.io`):

| Plan | Conexiones Máximas | Nota |
|------|-------------------|------|
| Free | ~10-20 | Puede tener límites |
| Paid | 100+ | Sin restricciones |

## 🚀 Recomendaciones Adicionales

### Si sigues teniendo problemas:

1. **Migrar a un proveedor con mejor connection pooling:**
   - Vercel Postgres (con PgBouncer incluido)
   - Neon (connection pooling automático)
   - Railway (más estable)
   - Supabase (pooling incluido)

2. **Implementar PgBouncer externo:**
   ```bash
   # Para servicios que no lo incluyen nativamente
   DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true"
   ```

3. **Optimizar queries pesadas:**
   - Usar `take` y `skip` para paginación
   - Agregar `select` para traer solo campos necesarios
   - Implementar caché con Redis

4. **Implementar retry logic:**
   ```typescript
   async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
     try {
       return await fn();
     } catch (error) {
       if (retries > 0 && error.code === 'P2024') {
         await new Promise(r => setTimeout(r, 1000));
         return withRetry(fn, retries - 1);
       }
       throw error;
     }
   }
   ```

## 📈 Monitoreo de Conexiones

Para ver cuántas conexiones estás usando:

```sql
-- En PostgreSQL
SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';
```

## 🔧 Troubleshooting

### Error: "Connection terminated unexpectedly"
- ✅ **Solucionado** con el aumento de `max: 20` y timeouts
- Si persiste: verificar límites del proveedor

### Error: "Too many connections"
- Reduce `max` en `lib/prisma.ts`
- Migra a un servicio con pooling

### Error: "Connection timeout"
- ✅ **Mejorado** con `connectionTimeoutMillis: 20000`
- Verificar latencia de red con el servidor de BD

## 📝 Notas Importantes

1. **Reinicia el servidor** después de estos cambios:
   ```bash
   npm run dev  # o el comando que uses
   ```

2. **En producción**, considera valores más altos:
   ```typescript
   max: process.env.NODE_ENV === 'production' ? 30 : 20
   ```

3. **No exceder límites del proveedor** o obtendrás errores

---

Última actualización: Marzo 2026
