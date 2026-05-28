# FECHAS CHILE - GUIA RAPIDA

Este proyecto usa la zona horaria de Chile para filtros y conversiones de fecha.

## Regla base

- Zona horaria oficial: America/Santiago.
- Evitar conversiones directas con new Date("YYYY-MM-DD") para filtros de dia, porque puede desplazar el dia por UTC.

## Utilidades oficiales

Archivo: lib/date-chile.ts

- parseSantiagoDate(dateStr, endOfDay)
  - Convierte YYYY-MM-DD al inicio o fin del dia en Chile (incluye DST).
- buildDateOnlyCompatWhere(startDateStr, endDateStr)
  - Construye rangos compatibles para columnas date-only historicas.
- getSantiagoDateKey(date)
  - Obtiene clave YYYY-MM-DD en calendario de Chile.
- parseDateInputAsSantiagoDate(dateInput, endOfDay)
  - Normaliza entradas date-only o datetime a calendario Chile.

## Patron recomendado para filtros en APIs y paginas server

1. Leer fechaInicio y fechaFin como YYYY-MM-DD.
2. Convertir con parseSantiagoDate(fechaInicio) y parseSantiagoDate(fechaFin, true).
3. Construir where con gte/lte.
4. Aplicar where al campo correcto segun el estado o flujo de negocio.

## Referencias actuales

- app/supervisor/page.tsx
- app/api/dashboard/metrics/route.ts
- app/api/dashboard/tabla-actividades/route.ts

Nota: en /supervisor el filtro por fecha usa fechaAsignacion.
