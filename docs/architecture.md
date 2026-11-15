# Arquitectura de NEXORA

## 1. Visión General del Sistema
NEXORA es una plataforma SaaS empresarial diseñada bajo el patrón de **Monolito Modular**. Centraliza la publicación de servicios, la atención al cliente, la gestión de solicitudes y la notificación en tiempo real, manteniendo la cohesión del dominio sin incurrir en la complejidad distribuida de los microservicios.

## 2. Principios de Diseño
- **Monolito Modular:** Cada módulo de negocio encapsula su lógica, contratos y presentación.
- **Inversión de Dependencias:** El acceso a datos se desacopla mediante contratos e interfaces de repositorio (`IAuthRepository`, `IServiceRepository`, `IRequestRepository`, etc.).
- **Seguridad en Profundidad:** Validación estricta con Zod en frontend, control de acceso basado en roles (RBAC) y políticas Row Level Security (RLS) en PostgreSQL.
- **Rendimiento Predictivo:** Carga diferida de rutas (route lazy loading), división manual de bundles (manual chunks) y cero consultas N+1 mediante agregaciones y selecciones relacionales.

## 3. Estructura de Módulos

```text
src/
├── app/
│   ├── layouts/
│   │   ├── AdminLayout.vue
│   │   ├── ClientLayout.vue
│   │   └── AuthLayout.vue
│   └── router/
│       └── index.ts
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── services/
│   ├── clients/
│   ├── requests/
│   ├── history/
│   ├── notifications/
│   └── profile/
└── shared/
    ├── components/
    ├── infrastructure/
    ├── types/
    ├── utils/
    └── validators/
```

## 4. Matriz de Roles y Accesos

| Módulo / Funcionalidad | Rol Admin | Rol Empleado | Rol Cliente |
|---|---|---|---|
| Dashboard Administrativo | Acceso total | Acceso total | Denegado |
| CRUD de Servicios | Crear, Editar, Desactivar | Crear, Editar | Solo lectura de servicios activos |
| Gestión de Clientes | Lectura, Ficha, Suspender/Activar | Denegado | Denegado |
| Solicitudes Empresariales | Lectura total y cambio de estado | Lectura y cambio de estado | Denegado a solicitudes ajenas |
| Historial Administrativo | Completo con exportación CSV | Completo | Solo sus propias solicitudes |
| Reportes Operativos | Generación y exportación CSV | Denegado | Denegado |
| Solicitud de Servicios | Denegado (panel admin) | Denegado | Creación de solicitudes propias |
| Notificaciones | Bandeja personal | Bandeja personal | Notificaciones personales |
