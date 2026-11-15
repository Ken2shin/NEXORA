import type { UserProfile } from '@/shared/types/user.types'
import type { Service, ServiceCategory } from '@/shared/types/service.types'
import type { ServiceRequest } from '@/shared/types/request.types'
import type { Notification } from '@/shared/types/notification.types'

export const initialCategories: ServiceCategory[] = [
  {
    id: 'c1010000-0000-0000-0000-000000000001',
    name: 'Desarrollo Digital',
    slug: 'desarrollo-digital',
    description: 'Soluciones de software, sitios web y aplicaciones modernas.',
    sort_order: 1,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: 'c1010000-0000-0000-0000-000000000002',
    name: 'Soporte e Infraestructura',
    slug: 'soporte-infraestructura',
    description: 'Diagnóstico técnico, mantenimiento y asistencia operativa.',
    sort_order: 2,
    created_at: '2025-01-01T08:00:00Z'
  },
  {
    id: 'c1010000-0000-0000-0000-000000000003',
    name: 'Consultoría y Estrategia',
    slug: 'consultoria-estrategia',
    description: 'Auditoría tecnológica y planeación de arquitecturas cloud.',
    sort_order: 3,
    created_at: '2025-01-01T08:00:00Z'
  }
]

export const initialUsers: UserProfile[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    full_name: 'Admin General',
    email: 'admin@nexora.com',
    phone: '+52 55 9999 8888',
    role: 'admin',
    avatar_path: '/images/illustrations/avatar-admin.svg',
    is_active: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    full_name: 'Roberto Silva',
    email: 'empleado@nexora.com',
    phone: '+52 55 8888 7777',
    role: 'employee',
    avatar_path: '/images/illustrations/avatar-admin.svg',
    is_active: true,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z'
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    full_name: 'Carlos Pérez',
    email: 'carlos@gmail.com',
    phone: '+52 55 1234 5678',
    role: 'client',
    avatar_path: '/images/illustrations/avatar-client.svg',
    is_active: true,
    created_at: '2025-02-10T12:00:00Z',
    updated_at: '2025-02-10T12:00:00Z'
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    full_name: 'María López',
    email: 'maria@mail.com',
    phone: '+52 55 2345 6789',
    role: 'client',
    avatar_path: '/images/illustrations/avatar-client.svg',
    is_active: true,
    created_at: '2025-02-12T14:30:00Z',
    updated_at: '2025-02-12T14:30:00Z'
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    full_name: 'Ana Torres',
    email: 'ana@mail.com',
    phone: '+52 55 3456 7890',
    role: 'client',
    avatar_path: '/images/illustrations/avatar-client.svg',
    is_active: true,
    created_at: '2025-02-15T09:15:00Z',
    updated_at: '2025-02-15T09:15:00Z'
  },
  {
    id: 'u0000000-0000-0000-0000-000000000006',
    full_name: 'Luis Gómez',
    email: 'luis@mail.com',
    phone: '+52 55 4567 8901',
    role: 'client',
    avatar_path: '/images/illustrations/avatar-client.svg',
    is_active: true,
    created_at: '2025-02-20T11:45:00Z',
    updated_at: '2025-02-20T11:45:00Z'
  }
]

export const initialServices: Service[] = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
    category_id: 'c1010000-0000-0000-0000-000000000001',
    category_name: 'Desarrollo Digital',
    name: 'Diseño Web',
    slug: 'diseno-web',
    short_description: 'Sitios web modernos y responsivos.',
    description: 'Desarrollo web a medida con arquitectura modular, diseño responsive de alto rendimiento, optimización de velocidad Core Web Vitals y compatibilidad total con dispositivos móviles.',
    image_path: '/images/services/web-design.jpg',
    price_amount: 120.00,
    currency_code: 'USD',
    is_active: true,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z'
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    category_id: 'c1010000-0000-0000-0000-000000000002',
    category_name: 'Soporte e Infraestructura',
    name: 'Soporte Técnico',
    slug: 'soporte-tecnico',
    short_description: 'Asistencia profesional.',
    description: 'Diagnóstico integral de fallas en hardware y software corporativo, resolución de incidentes en tiempo récord, soporte preventivo y correctivo con técnicos certificados.',
    image_path: '/images/services/tech-support.jpg',
    price_amount: 80.00,
    currency_code: 'USD',
    is_active: true,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-12T10:00:00Z'
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    category_id: 'c1010000-0000-0000-0000-000000000003',
    category_name: 'Consultoría y Estrategia',
    name: 'Consultoría IT',
    slug: 'consultoria-it',
    short_description: 'Asesoría en tecnología.',
    description: 'Análisis estratégico de la infraestructura digital empresarial, recomendaciones de migración cloud, optimización de costos y diseño de arquitecturas de software escalables.',
    image_path: '/images/services/it-consulting.jpg',
    price_amount: 150.00,
    currency_code: 'USD',
    is_active: true,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    category_id: 'c1010000-0000-0000-0000-000000000002',
    category_name: 'Soporte e Infraestructura',
    name: 'Mantenimiento Preventivo',
    slug: 'mantenimiento-preventivo',
    short_description: 'Mantenimiento y optimización de servidores.',
    description: 'Rutinas periódicas de diagnóstico, limpieza física y lógica, actualización de parches de seguridad y auditoría de rendimiento en estaciones de trabajo y servidores.',
    image_path: '/images/services/maintenance.jpg',
    price_amount: 95.00,
    currency_code: 'USD',
    is_active: true,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-01-20T10:00:00Z'
  }
]

export const initialRequests: ServiceRequest[] = [
  {
    id: 'r0000000-0000-0000-0000-000000000001',
    request_number: '#001',
    client_id: 'u0000000-0000-0000-0000-000000000003',
    client_name: 'Carlos Pérez',
    client_email: 'carlos@gmail.com',
    service_id: 's0000000-0000-0000-0000-000000000001',
    service_name: 'Diseño Web',
    service_image: '/images/services/web-design.jpg',
    description: 'Requerimos rediseño completo de nuestro portal corporativo para adaptarlo a móviles e integrar pasarela de pagos.',
    status: 'pending',
    assigned_to: 'u0000000-0000-0000-0000-000000000002',
    assigned_name: 'Roberto Silva',
    created_at: '2025-11-10T14:30:00Z',
    updated_at: '2025-11-10T14:30:00Z',
    attachments: [],
    history: [
      {
        id: 'h0000001',
        request_id: 'r0000000-0000-0000-0000-000000000001',
        previous_status: null,
        new_status: 'pending',
        changed_by: 'u0000000-0000-0000-0000-000000000003',
        changed_by_name: 'Carlos Pérez',
        note: 'Solicitud creada por el cliente',
        created_at: '2025-11-10T14:30:00Z'
      }
    ]
  },
  {
    id: 'r0000000-0000-0000-0000-000000000002',
    request_number: '#002',
    client_id: 'u0000000-0000-0000-0000-000000000004',
    client_name: 'María López',
    client_email: 'maria@mail.com',
    service_id: 's0000000-0000-0000-0000-000000000002',
    service_name: 'Soporte Técnico',
    service_image: '/images/services/tech-support.jpg',
    description: 'Problemas de conectividad en el conmutador central y estaciones de red del departamento contable.',
    status: 'in_progress',
    assigned_to: 'u0000000-0000-0000-0000-000000000002',
    assigned_name: 'Roberto Silva',
    created_at: '2025-11-09T10:15:00Z',
    updated_at: '2025-11-09T16:00:00Z',
    attachments: [],
    history: [
      {
        id: 'h0000002',
        request_id: 'r0000000-0000-0000-0000-000000000002',
        previous_status: null,
        new_status: 'pending',
        changed_by: 'u0000000-0000-0000-0000-000000000004',
        changed_by_name: 'María López',
        note: 'Registro inicial de solicitud',
        created_at: '2025-11-09T10:15:00Z'
      },
      {
        id: 'h0000003',
        request_id: 'r0000000-0000-0000-0000-000000000002',
        previous_status: 'pending',
        new_status: 'in_progress',
        changed_by: 'u0000000-0000-0000-0000-000000000002',
        changed_by_name: 'Roberto Silva',
        note: 'Técnico asignado en camino a sitio para diagnóstico',
        created_at: '2025-11-09T16:00:00Z'
      }
    ]
  },
  {
    id: 'r0000000-0000-0000-0000-000000000003',
    request_number: '#003',
    client_id: 'u0000000-0000-0000-0000-000000000005',
    client_name: 'Ana Torres',
    client_email: 'ana@mail.com',
    service_id: 's0000000-0000-0000-0000-000000000003',
    service_name: 'Consultoría IT',
    service_image: '/images/services/it-consulting.jpg',
    description: 'Evaluación técnica de infraestructura para cumplimiento regulatorio ISO 27001.',
    status: 'completed',
    assigned_to: 'u0000000-0000-0000-0000-000000000001',
    assigned_name: 'Admin General',
    created_at: '2025-11-08T09:00:00Z',
    updated_at: '2025-11-08T18:00:00Z',
    attachments: [],
    history: [
      {
        id: 'h0000004',
        request_id: 'r0000000-0000-0000-0000-000000000003',
        previous_status: null,
        new_status: 'pending',
        changed_by: 'u0000000-0000-0000-0000-000000000005',
        changed_by_name: 'Ana Torres',
        note: 'Solicitud enviada',
        created_at: '2025-11-08T09:00:00Z'
      },
      {
        id: 'h0000005',
        request_id: 'r0000000-0000-0000-0000-000000000003',
        previous_status: 'pending',
        new_status: 'in_progress',
        changed_by: 'u0000000-0000-0000-0000-000000000001',
        changed_by_name: 'Admin General',
        note: 'Consultoría en marcha con el equipo auditor',
        created_at: '2025-11-08T11:00:00Z'
      },
      {
        id: 'h0000006',
        request_id: 'r0000000-0000-0000-0000-000000000003',
        previous_status: 'in_progress',
        new_status: 'completed',
        changed_by: 'u0000000-0000-0000-0000-000000000001',
        changed_by_name: 'Admin General',
        note: 'Dictamen entregado y aprobado por la gerencia',
        created_at: '2025-11-08T18:00:00Z'
      }
    ]
  }
]

export const initialNotifications: Notification[] = [
  {
    id: 'n0000000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000003',
    request_id: 'r0000000-0000-0000-0000-000000000001',
    title: 'Solicitud recibida',
    message: 'Tu solicitud #001 ha sido registrada exitosamente.',
    notification_type: 'request_created',
    read_at: null,
    created_at: '2025-11-10T14:35:00Z'
  },
  {
    id: 'n0000000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000003',
    request_id: 'r0000000-0000-0000-0000-000000000001',
    title: 'Actualización de tu solicitud',
    message: 'Tu solicitud #001 está en proceso de asignación técnica.',
    notification_type: 'status_changed',
    read_at: null,
    created_at: '2025-11-10T15:00:00Z'
  },
  {
    id: 'n0000000-0000-0000-0000-000000000003',
    user_id: 'u0000000-0000-0000-0000-000000000003',
    request_id: null,
    title: 'Bienvenido a NEXORA',
    message: 'Gestiona, solicita y avanza con tus requerimientos corporativos desde tu panel.',
    notification_type: 'general',
    read_at: '2025-11-01T10:00:00Z',
    created_at: '2025-11-01T09:00:00Z'
  }
]
