# Manual de Usuario - Rol Jefaturas

## Introduccion

Este manual describe las funciones y procedimientos que un usuario con rol **jefaturas** puede realizar en la plataforma.

El rol jefaturas tiene un enfoque de gestion transversal:

- Seguimiento operativo y de seguridad desde dashboards
- Administracion de usuarios
- Administracion de equipos


---

## Acceso al Sistema

### Inicio de Sesion

1. Ingrese a la URL del sistema
2. Escriba su usuario y contrasena
3. Presione **Iniciar sesion**

### Primera Visualizacion

Al iniciar sesion como jefaturas, el sistema redirige a la ruta **/** (pantalla de inicio principal).

---

## Inicio y Navegación

La portada para jefaturas esta organizada en 3 bloques:

1. **Actividades pendientes**
2. **Reportar**
3. **Dashboards**

### 1) Actividades pendientes

Muestra pendientes asignados al usuario en:

- Caminatas
- Tareas asignadas
- Alertas por cierre
- Alertas por verificación
- Controles ART

### 2) Reportar

Permite abrir formularios para:
- Auto asignación de caminatas
- Reporte de peligro
- Tarjeta Alto/Stop
- Control de calidad ART

### 3) Dashboards

Desde esta seccion se accede a:

- **Dashboard Operaciones** (`/dashboard/operaciones`)
- **Dashboard Seguridad** (`/dashboard/gestion-desempeno`)

### Menu superior (Navbar)

En el menu **Administracion** del navbar, jefaturas tiene acceso directo a:

- **Gestion de Usuarios** (`/users`)
- **Gestion de Equipos** (`/equipos`)

---



## Dashboard Operaciones (`/dashboard/operaciones`)

Permite control ejecutivo de la operacion:

- KPIs de servicios por estado
- Servicios completados y aprobaciones
- No conformidades operativas
- Hallazgos a partir de los chekclist
- Filtro por rango de fechas
- Exportacion a Excel de operaciones
- Acceso a detalle de servicio desde tarjetas y modales

## Dashboard Seguridad (`/dashboard/gestion-desempeno`)

Enfocado en cumplimiento de actividades de seguridad:

- Cumplimiento por tipo de actividad
- Actividades por rol
- Distribucion de estatus por usuario
- Comparativos programadas vs no programadas
- Filtros por fecha y usuario

## Vista consolidada adicional (`/dashboard`)

Incluye:

- Estado de cumplimiento general
- Historial de actividades
- Exportacion de Excel unificado (una sola hoja)

---

## Gestion de Usuarios

## Acceso

- Ruta: **`/users`**

Esta sección es exclusiva de jefaturas.

## Acciones disponibles

1. Ver listado total de usuarios
2. Crear nuevo usuario (boton **Crear Usuario**, ruta `/register`)
3. Editar nombre y email de usuarios existentes

## Creacion de usuario

Datos principales:

- Usuario
- Nombre (opcional)
- Email (opcional)
- RUT (opcional)
- Empresa (opcional)
- Rol
- Contrasena

---

## Gestion de Equipos

## Acceso

- Ruta: **`/equipos`**

## Estructura del modulo

Dos pestañas:

- **Tractocamiones**
- **Semirremolques**

## Acciones de jefaturas

- Crear tractocamion (`/equipos/tractocamiones/nuevo`)
- Crear semirremolque (`/equipos/semirremolques/nuevo`)
- Editar registros existentes
- Activar/Inactivar equipos

---

## Caminatas y Alertas de Seguridad

## Mis Alertas Pendientes

Permite gestionar alertas donde jefaturas fue asignada como responsable:

- Cierre de reportes de peligro (con comentario y opcional imagen)
- Cierre de tarjetas stop
- Verificación de reportes pendientes de verificación
- Devolución de reportes para retroceso cuando aplica

## Importante sobre asignacion de actividades

La asignación formal de nuevas actividades en `/caminatas/nueva` esta implementada para el rol **prevencionista**.

---

## Contacto

Si presenta problemas de acceso, permisos o comportamiento inesperado en un modulo, contacte al administrador del sistema.