# Documentación del Modelo de Datos PostgreSQL

## 1. Archivo de Esquema
El esquema completo se encuentra preparado en:
`database/supabase_schema.sql`

## 2. Tablas Principales

### profiles
Almacena la información extendida de los usuarios sincronizada con `auth.users`.
- `id` (UUID, PK): Referencia a `auth.users(id)` en cascada.
- `full_name` (TEXT, NOT NULL): Nombre completo del usuario.
- `email` (TEXT, NOT NULL, UNIQUE): Correo institucional o personal.
- `phone` (TEXT): Teléfono de contacto.
- `role` (user_role ENUM: 'admin', 'employee', 'client').
- `avatar_path` (TEXT): Ruta local o URL del avatar.
- `is_active` (BOOLEAN): Estado operativo de la cuenta.

### service_categories
Categorización taxonómica de los servicios ofrecidos.
- `id` (UUID, PK).
- `name` (TEXT, NOT NULL, UNIQUE).
- `slug` (TEXT, NOT NULL, UNIQUE).
- `sort_order` (INTEGER): Orden en el catálogo.

### services
Catálogo empresarial de soluciones y servicios ofertados.
- `id` (UUID, PK).
- `category_id` (UUID, FK a `service_categories.id`).
- `name` (TEXT, NOT NULL).
- `slug` (TEXT, NOT NULL, UNIQUE).
- `short_description` (TEXT, NOT NULL).
- `description` (TEXT, NOT NULL).
- `image_path` (TEXT, NOT NULL).
- `price_amount` (NUMERIC(10, 2)).
- `currency_code` (VARCHAR(3)).
- `is_active` (BOOLEAN).

### service_requests
Solicitudes de servicios creadas por los clientes.
- `id` (UUID, PK).
- `request_number` (VARCHAR(20), UNIQUE): Folio secuencial formateado (ej. #001).
- `client_id` (UUID, FK a `profiles.id`).
- `service_id` (UUID, FK a `services.id`).
- `description` (TEXT, NOT NULL).
- `status` (request_status ENUM: 'pending', 'in_progress', 'completed').
- `assigned_to` (UUID, FK a `profiles.id`).

### request_attachments
Archivos adjuntos asociados a una solicitud.
- `id` (UUID, PK).
- `request_id` (UUID, FK a `service_requests.id`).
- `uploaded_by` (UUID, FK a `profiles.id`).
- `storage_path` (TEXT, NOT NULL).
- `original_filename` (TEXT, NOT NULL).
- `mime_type` (VARCHAR(100)).
- `size_bytes` (BIGINT, máx. 10MB).

### request_status_history
Bitácora de auditoría y trazabilidad de los cambios de estado.
- `id` (UUID, PK).
- `request_id` (UUID, FK a `service_requests.id`).
- `previous_status` (request_status).
- `new_status` (request_status, NOT NULL).
- `changed_by` (UUID, FK a `profiles.id`).
- `note` (TEXT).

### notifications
Avisos directos enviados a usuarios ante eventos relevantes.
- `id` (UUID, PK).
- `user_id` (UUID, FK a `profiles.id`).
- `request_id` (UUID, FK a `service_requests.id`).
- `title` (TEXT).
- `message` (TEXT).
- `notification_type` (notification_type ENUM).
- `read_at` (TIMESTAMPTZ).

### audit_logs
Registro inmutable de acciones sensibles realizadas por personal administrativo.
- `id` (UUID, PK).
- `actor_id` (UUID).
- `action` (TEXT).
- `entity_type` (TEXT).
- `entity_id` (UUID).
- `metadata` (JSONB).

## 3. Función Transaccional de Cambio de Estado
La función `update_request_status_atomic(p_request_id, p_new_status, p_note)` ejecuta de manera atómica:
1. Verificación de permisos del usuario invocador (`admin` o `employee`).
2. Bloqueo pesimista de fila (`FOR UPDATE`) en `service_requests`.
3. Actualización del estado y fecha de modificación.
4. Inserción del evento en `request_status_history`.
5. Creación automática de la notificación para el cliente dueño de la solicitud.
6. Registro del evento en `audit_logs`.

## 4. Procedimiento para Establecer el Primer Administrador
Luego de registrar el primer usuario a través de la interfaz web, ejecuta esta instrucción en el Editor SQL de Supabase:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tu_correo_registrado@empresa.com';
```
