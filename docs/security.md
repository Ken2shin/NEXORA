# Informe de Seguridad y Mitigaciones OWASP

## 1. Cumplimiento Normativo
NEXORA implementa controles defensivos alineados con OWASP Top 10:2025, OWASP API Security Top 10 y directrices OWASP ASVS 5.0.

## 2. Mitigaciones Implementadas

### Prevensión de IDOR / BOLA / BFLA
- Las consultas en PostgreSQL están aisladas por Row Level Security (RLS) evaluando `auth.uid() = client_id`.
- Los clientes no pueden leer ni alterar solicitudes pertenecientes a otros usuarios.
- La función de cambio de estado `update_request_status_atomic` valida que el invocador posea rol `admin` o `employee` en la tabla `profiles` antes de ejecutar cualquier transacción.

### Prevensión de Escalada de Privilegios
- La asignación de roles inicial se fuerza automáticamente a `'client'` mediante un trigger de base de datos (`handle_new_user`).
- Se revoca la capacidad de que un cliente altere su propia columna `role` a través de políticas RLS `WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()))`.

### Sanitización y Prevención de XSS
- Los formularios validan formato y longitud máxima con Zod schemas antes del envío.
- Todos los textos libres se sanitizan mediante codificación de entidades HTML para evitar inyecciones de secuencias de comandos.
- No se utiliza `v-html` con contenido no confiable.

### Cabeceras de Seguridad HTTP (Vercel)
Se configuran cabeceras estrictas en `vercel.json`:
- `Content-Security-Policy`: Restringe orígenes de scripts, estilos, fuentes e imágenes a dominios autorizados y Supabase.
- `Strict-Transport-Security`: HSTS habilitado con `max-age=31536000; includeSubDomains; preload`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY` (anti-clickjacking).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`: Restringe cámara, micrófono y geolocalización.

### Seguridad en Almacenamiento Privado (Supabase Storage)
- El bucket `request_attachments` es privado (`public = false`).
- Solo el cliente dueño de la carpeta o el personal con rol administrativo pueden generar accesos autorizados.
