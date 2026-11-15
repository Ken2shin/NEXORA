# Guía de Despliegue en Vercel

## 1. Requisitos Previos
- Cuenta en Vercel.
- Proyecto PostgreSQL en Supabase.
- Repositorio del proyecto clonado o vinculado.

## 2. Variables de Entorno en Vercel
Configura las siguientes variables en el panel del proyecto en Vercel (Settings > Environment Variables):

| Variable | Entorno | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Production, Preview, Development | URL del proyecto Supabase (ej. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Anon/Public API Key del proyecto Supabase |
| `SUPABASE_SECRET_KEY` | Solo Serverless / Functions (Privada) | Service Role Key (Nunca en frontend) |

## 3. Pasos de Despliegue

### Paso 1: Configurar Base de Datos
1. Abre el Editor SQL de tu proyecto en Supabase.
2. Copia y pega el contenido completo de `database/supabase_schema.sql`.
3. Ejecuta el script.
4. Verifica que las tablas, tipos, triggers y políticas RLS se hayan creado.

### Paso 2: Conectar Repositorio en Vercel
1. Importa el repositorio desde GitHub o GitLab en Vercel.
2. Configura los parámetros de compilación:
   - Framework Preset: `Vite`
   - Build Command: `vue-tsc -b && vite build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

### Paso 3: Asignar Administrador Inicial
1. Regístrate en la aplicación desplegada como cliente común.
2. En Supabase SQL Editor ejecuta:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu_correo@empresa.com';
```
3. Cierra sesión e inicia nuevamente para acceder al panel administrativo.
