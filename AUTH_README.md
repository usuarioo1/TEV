# Sistema de Autenticación - NextMiner

Sistema completo de autenticación con registro, login y roles implementado en Next.js 16+ con Prisma ORM.

## 🚀 Características

- ✅ Registro de usuarios con validación
- ✅ Login con autenticación JWT
- ✅ Sistema de roles (Gerencia, Jefaturas, Supervisor, Operario)
- ✅ Sesiones seguras con cookies httpOnly
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Código completamente modularizado
- ✅ TypeScript con tipado completo

## 📁 Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts      # API endpoint de login
│   │       ├── register/route.ts   # API endpoint de registro
│   │       └── logout/route.ts     # API endpoint de logout
│   ├── login/page.tsx              # Página de login
│   ├── register/page.tsx           # Página de registro
│   └── test/page.tsx               # Página protegida de prueba
├── components/
│   ├── LoginForm.tsx               # Formulario de login
│   ├── RegisterForm.tsx            # Formulario de registro
│   └── LogoutButton.tsx            # Botón de cerrar sesión
├── lib/
│   ├── auth.ts                     # Utilidades de autenticación
│   ├── session.ts                  # Manejo de sesiones
│   └── prisma.ts                   # Cliente de Prisma
└── prisma/
    └── schema.prisma               # Esquema de base de datos
```

## 📋 Esquema de Usuario

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  rol       String   // coordinador, jefaturas, supervisor, operario
  email     String?
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔐 Roles Disponibles

1. **Coordinador**: Rol de coordinación de operaciones y caminatas
2. **Jefaturas**: Rol de gestión y supervisión de alto nivel
3. **Supervisor**: Rol de supervisión operativa
4. **Operario**: Rol operativo básico

## 🛠️ Uso del Sistema

### 1. Registrar un Usuario

Navega a `/register` y completa el formulario:
- **Usuario** (requerido)
- **Contraseña** (requerido, mínimo 6 caracteres)
- **Confirmar contraseña** (requerido)
- **Rol** (requerido, selecciona uno de los 4 roles)
- **Nombre completo** (opcional)
- **Email** (opcional)

### 2. Iniciar Sesión

Navega a `/login` y usa tus credenciales:
- **Usuario**
- **Contraseña**

### 3. Acceder a Página Protegida

Una vez logueado, serás redirigido automáticamente a `/test` donde verás:
- Mensaje de bienvenida con tu nombre de usuario
- Tu información de sesión (usuario, rol, ID)
- Botón para cerrar sesión

## 🔧 API Endpoints

### Registro
```typescript
POST /api/auth/register
Body: {
  username: string;
  password: string;
  rol: "gerencia" | "jefaturas" | "supervisor" | "operario";
  name?: string;
  email?: string;
}
```

### Login
```typescript
POST /api/auth/login
Body: {
  username: string;
  password: string;
}
```

### Logout
```typescript
POST /api/auth/logout
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt (salt rounds: 10)
- Los tokens JWT expiran en 7 días
- Las cookies son httpOnly y secure en producción
- Validación de roles en el backend
- Protección contra ataques comunes

## 📦 Dependencias Agregadas

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.5"
}
```

## 🎯 Ejemplo de Uso en Código

### Obtener sesión del usuario actual
```typescript
import { getSession } from '@/lib/session';

export default async function ProtectedPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Hola {session.username}</div>;
}
```

### Verificar rol del usuario
```typescript
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

const session = await getSession();
if (session?.rol === ROLES.GERENCIA) {
  // Usuario es gerencia
}
```

## 🚀 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Generar cliente de Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar seed (usuarios de prueba)
npx prisma db seed

# Ver base de datos en Prisma Studio
npx prisma studio
```

## 👥 Usuarios de Prueba (después del seed)

| Usuario   | Contraseña | Rol          |
|-----------|------------|--------------|
| alice     | alice123   | jefaturas    |
| bob       | bob123     | jefaturas    |
| charlie   | charlie123 | coordinador  |
| diana     | diana123   | operario     |
| edward    | edward123  | operario     |
| francisco | francisco123| supervisor  |
| gabriela  | gabriela123| operario     |
| hector    | hector123  | operario     |
| isabel    | isabel123  | coordinador  |

## 🔐 Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
DATABASE_URL="tu_url_de_base_de_datos"
JWT_SECRET="tu-secreto-muy-seguro-cambialo-en-produccion"
```

## 📝 Notas Importantes

1. **Cambiar JWT_SECRET en producción**: El secreto JWT debe ser una cadena aleatoria y segura en producción.

2. **Migraciones**: Cuando cambies el schema de Prisma, siempre ejecuta:
   ```bash
   npx prisma migrate dev
   ```

3. **Sesión**: La sesión se almacena en cookies httpOnly por 7 días.

4. **Proteger rutas**: Usa `getSession()` en cualquier página que quieras proteger.

## 🎨 Personalización

### Cambiar duración de sesión
Edita `lib/auth.ts`:
```typescript
return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // Cambiar aquí
```

### Agregar más roles
Edita `lib/auth.ts`:
```typescript
export const ROLES = {
  GERENCIA: 'gerencia',
  JEFATURAS: 'jefaturas',
  SUPERVISOR: 'supervisor',
  OPERARIO: 'operario',
  NUEVO_ROL: 'nuevo_rol', // Agregar aquí
} as const;
```

## ✨ Próximos Pasos Sugeridos

- [ ] Agregar recuperación de contraseña
- [ ] Implementar refresh tokens
- [ ] Agregar verificación de email
- [ ] Crear middleware de protección de rutas
- [ ] Implementar permisos basados en roles
- [ ] Agregar autenticación de dos factores

---

**Developed with ❤️ using Next.js, Prisma, and TypeScript**
