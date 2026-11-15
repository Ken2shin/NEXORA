# NEXORA — Monolito Modular Empresarial

> Gestiona · Solicita · Avanza

Plataforma SaaS empresarial construida para la gestión de servicios corporativos, atención a clientes y seguimiento transaccional de solicitudes en tiempo real.

---

## 1. Stack Tecnológico

- **Frontend:** Vue.js 3 (Composition API, `<script setup>`), TypeScript en modo estricto, Vite, Pinia, Vue Router.
- **Iconografía e Identidad:** Lucide Icons, Logotipo SVG corporativo original con degradado eléctrico y estrella dorada.
- **Validaciones:** Zod schemas centralizados.
- **Base de Datos:** PostgreSQL sobre infraestructura Supabase con Row Level Security (RLS), triggers y funciones atómicas.
- **Infraestructura:** Vercel CDN, cabeceras HTTP de seguridad (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
- **Pruebas:** Vitest (unitarias, integración y seguridad OWASP).

---

## 2. Roles del Sistema

1. **Administrador:** Gestión total de catálogo de servicios, administración y suspensión de clientes, control de solicitudes, historial y reportes con exportación CSV.
2. **Empleado:** Operación de catálogo de servicios y procesamiento con cambio de estado de solicitudes y generación de trazabilidad.
3. **Cliente:** Catálogo público de servicios activos, registro de solicitudes con carga de adjuntos privados, seguimiento de estado y centro de notificaciones.

---

## 3. Instalación y Ejecución Local

### Clonar y preparar entorno
```bash
pnpm install
```

### Ejecutar en modo desarrollo
```bash
pnpm run dev
```
La aplicación iniciará en `http://localhost:3000`.

### Ejecutar pruebas automatizadas
```bash
pnpm run test
```

### Compilar para producción
```bash
pnpm run build
```

---

## 4. Cuentas de Demostración Integradas

La pantalla de inicio de sesión incluye botones de acceso rápido para evaluar los 3 roles técnicos de forma inmediata



---

## 5. Base de Datos PostgreSQL

El archivo de esquema listo para ser pegado en el Editor SQL de Supabase se encuentra en:
`database/supabase_schema.sql`

*Nota de seguridad:* El script SQL contiene tipos ENUM, tablas normalizadas, índices optimizados, triggers `updated_at`, secuencia de folios `#001`, función transaccional `update_request_status_atomic`, políticas RLS por rol y configuración de bucket privado para adjuntos.
