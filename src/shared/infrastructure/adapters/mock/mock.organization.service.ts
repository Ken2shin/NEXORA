import type {
  Department,
  WorkGroup,
  Position,
  Employee,
  HrLeaveRequest,
  HrVacancy,
  HrPerformanceReview,
  FinanceTransaction,
  FinanceInvoice,
  FinanceBudget,
  LegalCase,
  LegalContract,
  LegalInternalRequest,
  OrgNotification,
  TemporaryCredential,
  SecurityIncident,
  SecurityEvent,
  DevProject,
  DevTask
} from '@/shared/types/organization.types'
import { CryptoService } from '@/shared/utils/crypto.service'
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/infrastructure/supabase'

class MockOrganizationService {
  private departments: Department[] = []
  private groups: WorkGroup[] = []
  private positions: Position[] = []
  private employees: Employee[] = []
  private leaveRequests: HrLeaveRequest[] = []
  private vacancies: HrVacancy[] = []
  private reviews: HrPerformanceReview[] = []
  private transactions: FinanceTransaction[] = []
  private invoices: FinanceInvoice[] = []
  private budgets: FinanceBudget[] = []
  private legalCases: LegalCase[] = []
  private legalContracts: LegalContract[] = []
  private legalRequests: LegalInternalRequest[] = []
  private notifications: OrgNotification[] = []
  private credentials: TemporaryCredential[] = []
  private securityIncidents: SecurityIncident[] = []
  private securityEvents: SecurityEvent[] = []
  private devProjects: DevProject[] = []
  private devTasks: DevTask[] = []

  private getClient() {
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      return getSupabaseClient()
    }
    return null
  }

  constructor() {
    this.initSeedData()
  }

  private initSeedData(): void {
    const storedDepts = localStorage.getItem('nexora_org_depts')
    if (storedDepts) {
      try {
        this.departments = JSON.parse(storedDepts)
        this.groups = JSON.parse(localStorage.getItem('nexora_org_groups') || '[]')
        this.positions = JSON.parse(localStorage.getItem('nexora_org_positions') || '[]')
        this.employees = JSON.parse(localStorage.getItem('nexora_org_employees') || '[]')
        this.leaveRequests = JSON.parse(localStorage.getItem('nexora_hr_leaves') || '[]')
        this.vacancies = JSON.parse(localStorage.getItem('nexora_hr_vacancies') || '[]')
        this.reviews = JSON.parse(localStorage.getItem('nexora_hr_reviews') || '[]')
        this.transactions = JSON.parse(localStorage.getItem('nexora_fin_transactions') || '[]')
        this.invoices = JSON.parse(localStorage.getItem('nexora_fin_invoices') || '[]')
        this.budgets = JSON.parse(localStorage.getItem('nexora_fin_budgets') || '[]')
        this.legalCases = JSON.parse(localStorage.getItem('nexora_leg_cases') || '[]')
        this.legalContracts = JSON.parse(localStorage.getItem('nexora_leg_contracts') || '[]')
        this.legalRequests = JSON.parse(localStorage.getItem('nexora_leg_requests') || '[]')
        this.notifications = JSON.parse(localStorage.getItem('nexora_org_notifications') || '[]')
        this.credentials = JSON.parse(localStorage.getItem('nexora_org_credentials') || '[]')
        this.securityIncidents = JSON.parse(localStorage.getItem('nexora_sec_incidents') || '[]')
        this.securityEvents = JSON.parse(localStorage.getItem('nexora_sec_events') || '[]')
        this.devProjects = JSON.parse(localStorage.getItem('nexora_dev_projects') || '[]')
        this.devTasks = JSON.parse(localStorage.getItem('nexora_dev_tasks') || '[]')
        if (this.securityIncidents.length > 0 && this.devProjects.length > 0) {
          return
        }
      } catch {}
    }

    this.departments = [
      {
        id: 'dept-1',
        name: 'Departamento de Tecnología',
        code: 'DEP-TEC',
        description: 'Desarrollo de software, mantenimiento de infraestructura en la nube y arquitectura de aplicaciones.',
        manager_id: 'emp-1',
        manager_name: 'Carlos Mendoza',
        objectives: 'Garantizar el 99.9% de disponibilidad operativa e impulsar la evolución continua de la plataforma.',
        functions: ['Desarrollo web y móvil', 'Arquitectura cloud', 'Soporte a usuarios'],
        is_active: true,
        group_count: 4,
        employee_count: 8,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dept-2',
        name: 'Departamento de Ciberseguridad',
        code: 'DEP-SEC',
        description: 'Protección de activos digitales, auditorías de vulnerabilidad y respuesta ante incidentes.',
        manager_id: 'emp-3',
        manager_name: 'Alejandro Soto',
        objectives: 'Blindar el monolito y bases de datos contra ataques conforme a los lineamientos OWASP.',
        functions: ['Análisis de vulnerabilidades', 'Hardening de servidores', 'Monitoreo de accesos'],
        is_active: true,
        group_count: 3,
        employee_count: 5,
        created_at: new Date(Date.now() - 86400000 * 80).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dept-3',
        name: 'Departamento de Logística y Operaciones',
        code: 'DEP-LOG',
        description: 'Coordinación de inventario tecnológico, despliegue físico y entrega de equipamiento.',
        manager_id: 'emp-5',
        manager_name: 'Sandra Rivas',
        objectives: 'Optimizar los tiempos de provisión de equipos y logística técnica para clientes y empleados.',
        functions: ['Control de inventario', 'Distribución de equipamiento', 'Envíos y recepciones'],
        is_active: true,
        group_count: 2,
        employee_count: 4,
        created_at: new Date(Date.now() - 86400000 * 70).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dept-4',
        name: 'Departamento de Recursos Humanos',
        code: 'DEP-HR',
        description: 'Gestión del talento, reclutamiento, administración de beneficios y bienestar laboral.',
        manager_id: 'emp-6',
        manager_name: 'Mariana Pineda',
        objectives: 'Atraer al mejor talento de ingeniería y asegurar un ambiente de alta productividad.',
        functions: ['Reclutamiento y selección', 'Onboarding y offboarding', 'Gestión de ausencias'],
        is_active: true,
        group_count: 2,
        employee_count: 4,
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dept-5',
        name: 'Departamento de Contabilidad y Finanzas',
        code: 'DEP-FIN',
        description: 'Facturación, cobranza, control de egresos presupuestarios e informes de rentabilidad.',
        manager_id: 'emp-7',
        manager_name: 'Roberto Valenzuela',
        objectives: 'Mantener la salud financiera y cumplimiento fiscal riguroso de cada servicio prestado.',
        functions: ['Emisión de facturas', 'Control de presupuestos', 'Conciliación de pagos'],
        is_active: true,
        group_count: 2,
        employee_count: 3,
        created_at: new Date(Date.now() - 86400000 * 50).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'dept-6',
        name: 'Departamento Legal y Cumplimiento',
        code: 'DEP-LEG',
        description: 'Asesoría jurídica, redacción y auditoría de contratos, y protección de datos conforme a ley.',
        manager_id: 'emp-8',
        manager_name: 'Lic. Gustavo Morales',
        objectives: 'Mitigar riesgos contractuales y respaldar las transacciones empresariales con plena validez.',
        functions: ['Revisión contractual', 'Protección de datos', 'Atención de litigios'],
        is_active: true,
        group_count: 2,
        employee_count: 3,
        created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    this.groups = [
      {
        id: 'grp-1',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        name: 'Desarrollo Frontend',
        code: 'GRP-FE',
        leader_id: 'emp-2',
        leader_name: 'Valeria Castro',
        objective: 'Construir interfaces de usuario de alta velocidad, responsivas y accesibles con Vue 3.',
        specialties: ['Vue.js', 'TypeScript', 'CSS Arquitectura', 'Accesibilidad WCAG'],
        max_capacity: 10,
        member_count: 4,
        services_assigned: ['Diseño Web', 'Mantenimiento UI'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-2',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        name: 'Desarrollo Backend & DB',
        code: 'GRP-BE',
        leader_id: 'emp-1',
        leader_name: 'Carlos Mendoza',
        objective: 'Mantenimiento del monolito modular en Node, esquemas PostgreSQL y funciones serverless.',
        specialties: ['PostgreSQL', 'Node.js', 'Supabase', 'APIs REST'],
        max_capacity: 10,
        member_count: 3,
        services_assigned: ['Consultoría IT'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-3',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        name: 'Soporte Técnico Especializado',
        code: 'GRP-SOP',
        leader_id: 'emp-4',
        leader_name: 'Felipe Herrera',
        objective: 'Atención ágil de incidencias técnicas, recuperación de cuentas y diagnóstico de hardware.',
        specialties: ['Soporte Nivel 2', 'Redes', 'Hardware', 'Diagnóstico de Sistemas'],
        max_capacity: 10,
        member_count: 3,
        services_assigned: ['Soporte Técnico'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-4',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        name: 'Análisis de Vulnerabilidades',
        code: 'GRP-VUL',
        leader_id: 'emp-3',
        leader_name: 'Alejandro Soto',
        objective: 'Inspeccionar vectores de ataque, auditar dependencias y evaluar integridad criptográfica.',
        specialties: ['Auditoría OWASP', 'Pentesting Web', 'Criptografía', 'Análisis Estático'],
        max_capacity: 10,
        member_count: 3,
        services_assigned: ['Auditoría de Seguridad'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-5',
        department_id: 'dept-4',
        department_name: 'Departamento de Recursos Humanos',
        name: 'Atracción y Reclutamiento',
        code: 'GRP-REC',
        leader_id: 'emp-6',
        leader_name: 'Mariana Pineda',
        objective: 'Gestionar procesos de selección, entrevistas técnicas y contratación de personal.',
        specialties: ['Entrevistas Técnicas', 'Headhunting', 'Pruebas Psicométricas'],
        max_capacity: 10,
        member_count: 2,
        services_assigned: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-6',
        department_id: 'dept-5',
        department_name: 'Departamento de Contabilidad y Finanzas',
        name: 'Facturación y Cobranza',
        code: 'GRP-FAC',
        leader_id: 'emp-7',
        leader_name: 'Roberto Valenzuela',
        objective: 'Emisión oportuna de facturas fiscales, seguimiento de pagos y control de morosidad.',
        specialties: ['Facturación Electrónica', 'Cobranza Corporativa', 'Impuestos'],
        max_capacity: 10,
        member_count: 2,
        services_assigned: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'grp-7',
        department_id: 'dept-6',
        department_name: 'Departamento Legal y Cumplimiento',
        name: 'Contratos Corporativos',
        code: 'GRP-CON',
        leader_id: 'emp-8',
        leader_name: 'Lic. Gustavo Morales',
        objective: 'Elaboración, revisión y validación de convenios, acuerdos de confidencialidad y contratos de servicio.',
        specialties: ['Derecho Mercantil', 'Contratación Digital', 'Compliance'],
        max_capacity: 10,
        member_count: 2,
        services_assigned: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    this.positions = [
      {
        id: 'pos-1',
        title: 'Director de Tecnología (CTO)',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        hierarchy_level: 'director',
        description: 'Lidera la visión tecnológica, infraestructura y dirección de ingeniería.',
        responsibilities: ['Estrategia tecnológica', 'Supervisión de arquitectura', 'Aprobación de estándares'],
        required_skills: ['Liderazgo técnico', 'Cloud Architecture', 'Gestión de equipos'],
        required_education: 'Ingeniería en Sistemas / Maestría',
        specialties: ['Arquitectura de Software', 'DevOps'],
        supervisor_position_id: null,
        is_active: true,
        employee_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'pos-2',
        title: 'Ingeniero de Software Frontend Senior',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        hierarchy_level: 'senior',
        description: 'Diseño e implementación de componentes UI reactivos y accesibles con Vue 3.',
        responsibilities: ['Desarrollo de módulos', 'Optimización de rendimiento', 'Code review'],
        required_skills: ['Vue 3', 'TypeScript', 'CSS Avanzado', 'Vite'],
        required_education: 'Licenciatura o Ingeniería en Computación',
        specialties: ['Desarrollo Frontend', 'UI/UX'],
        supervisor_position_id: 'pos-1',
        supervisor_title: 'Director de Tecnología (CTO)',
        is_active: true,
        employee_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'pos-3',
        title: 'Especialista en Seguridad y Redes',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        hierarchy_level: 'lead',
        description: 'Auditoría continua de seguridad, configuración de firewalls y detección de intrusiones.',
        responsibilities: ['Pruebas de intrusión', 'Monitoreo de seguridad', 'Mitigación de vulnerabilidades'],
        required_skills: ['OWASP', 'Criptografía', 'Network Security'],
        required_education: 'Ingeniería en Ciberseguridad / Telemática',
        specialties: ['Ciberseguridad Ofensiva', 'Hardening'],
        supervisor_position_id: null,
        is_active: true,
        employee_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'pos-4',
        title: 'Gerente de Recursos Humanos',
        department_id: 'dept-4',
        department_name: 'Departamento de Recursos Humanos',
        hierarchy_level: 'manager',
        description: 'Supervisa el ciclo de vida del colaborador, contrataciones y normatividad laboral.',
        responsibilities: ['Estrategia de compensaciones', 'Evaluación de desempeño', 'Cultura empresarial'],
        required_skills: ['Gestión de talento', 'Derecho laboral básico', 'Comunicación asertiva'],
        required_education: 'Licenciatura en Psicología Organizacional o Administración',
        specialties: ['Desarrollo Organizacional', 'Relaciones Laborales'],
        supervisor_position_id: null,
        is_active: true,
        employee_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'pos-5',
        title: 'Contador Público y Financiero',
        department_id: 'dept-5',
        department_name: 'Departamento de Contabilidad y Finanzas',
        hierarchy_level: 'senior',
        description: 'Emisión de reportes contables, balance de ingresos y egresos, y cumplimiento fiscal.',
        responsibilities: ['Facturación', 'Conciliación bancaria', 'Cálculo de impuestos'],
        required_skills: ['Contabilidad fiscal', 'Excel financiero', 'Auditoría'],
        required_education: 'Licenciatura en Contaduría Pública',
        specialties: ['Finanzas Corporativas', 'Impuestos'],
        supervisor_position_id: null,
        is_active: true,
        employee_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'pos-6',
        title: 'Abogado Corporativo',
        department_id: 'dept-6',
        department_name: 'Departamento Legal y Cumplimiento',
        hierarchy_level: 'senior',
        description: 'Supervisión de instrumentos jurídicos, defensa de la empresa y cumplimiento regulatorio.',
        responsibilities: ['Redacción de contratos', 'Dictámenes jurídicos', 'Protección de datos'],
        required_skills: ['Derecho mercantil', 'Contratación digital', 'Litigio preventivo'],
        required_education: 'Licenciatura en Derecho con Cédula Profesional',
        specialties: ['Derecho Corporativo', 'Propiedad Intelectual'],
        supervisor_position_id: null,
        is_active: true,
        employee_count: 1,
        created_at: new Date().toISOString()
      }
    ]

    this.employees = [
      {
        id: 'emp-1',
        internal_id: 'EMP-101',
        full_name: 'Carlos Mendoza',
        email: 'carlos.mendoza@nexora.com',
        phone: '+52 55 1122 3344',
        address: 'Av. Insurgentes Sur 1200, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-01-15',
        status: 'active',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        group_id: 'grp-2',
        group_name: 'Desarrollo Backend & DB',
        position_id: 'pos-1',
        position_title: 'Director de Tecnología (CTO)',
        profession: 'Ingeniero en Sistemas Computacionales',
        career: 'Ingeniería de Software',
        specialties: ['Arquitectura Cloud', 'PostgreSQL', 'Sistemas Distribuidos'],
        skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Seguridad'],
        years_experience: 10,
        responsibility_level: 'director',
        supervisor_id: null,
        assigned_permissions: ['all_tech', 'db_admin', 'approvals'],
        active_tasks_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-2',
        internal_id: 'EMP-102',
        full_name: 'Valeria Castro',
        email: 'valeria.castro@nexora.com',
        phone: '+52 55 2233 4455',
        address: 'Col. Roma Norte, Cuauhtémoc, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-03-01',
        status: 'active',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        group_id: 'grp-1',
        group_name: 'Desarrollo Frontend',
        position_id: 'pos-2',
        position_title: 'Ingeniero de Software Frontend Senior',
        profession: 'Licenciada en Ciencias de la Computación',
        career: 'Desarrollo Web y Móvil',
        specialties: ['Vue.js 3', 'TypeScript', 'Accesibilidad Web'],
        skills: ['Vue.js', 'CSS Moderno', 'Vite', 'Pinia', 'WCAG 2.2'],
        years_experience: 6,
        responsibility_level: 'lead',
        supervisor_id: 'emp-1',
        supervisor_name: 'Carlos Mendoza',
        assigned_permissions: ['frontend_lead', 'review_prs'],
        active_tasks_count: 3,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-3',
        internal_id: 'EMP-103',
        full_name: 'Alejandro Soto',
        email: 'alejandro.soto@nexora.com',
        phone: '+52 55 3344 5566',
        address: 'Polanco, Miguel Hidalgo, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-04-15',
        status: 'active',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        group_id: 'grp-4',
        group_name: 'Análisis de Vulnerabilidades',
        position_id: 'pos-3',
        position_title: 'Especialista en Seguridad y Redes',
        profession: 'Ingeniero en Ciberseguridad',
        career: 'Seguridad Informática y Redes',
        specialties: ['Ethical Hacking', 'OWASP Top 10', 'Hardening'],
        skills: ['Pentesting', 'Wireshark', 'Burp Suite', 'Auditoría Criptográfica'],
        years_experience: 7,
        responsibility_level: 'lead',
        supervisor_id: null,
        assigned_permissions: ['sec_audit', 'firewall_admin'],
        active_tasks_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-4',
        internal_id: 'EMP-104',
        full_name: 'Felipe Herrera',
        email: 'felipe.herrera@nexora.com',
        phone: '+52 55 4455 6677',
        address: 'Col. del Valle, Benito Juárez, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-06-10',
        status: 'active',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        group_id: 'grp-3',
        group_name: 'Soporte Técnico Especializado',
        position_id: 'pos-2',
        position_title: 'Ingeniero de Soporte y Redes',
        profession: 'Ingeniero en Telemática',
        career: 'Redes y Telecomunicaciones',
        specialties: ['Soporte Nivel 2', 'Infraestructura LAN/VPN'],
        skills: ['Troubleshooting', 'Linux', 'Windows Server', 'Routing'],
        years_experience: 5,
        responsibility_level: 'senior',
        supervisor_id: 'emp-1',
        supervisor_name: 'Carlos Mendoza',
        assigned_permissions: ['support_level2'],
        active_tasks_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-5',
        internal_id: 'EMP-105',
        full_name: 'Sandra Rivas',
        email: 'sandra.rivas@nexora.com',
        phone: '+52 55 5566 7788',
        address: 'Santa Fe, Cuajimalpa, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-08-01',
        status: 'active',
        department_id: 'dept-3',
        department_name: 'Departamento de Logística y Operaciones',
        group_id: null,
        position_id: 'pos-1',
        position_title: 'Coordinadora de Operaciones y Logística',
        profession: 'Licenciada en Administración de Empresas',
        career: 'Logística y Cadena de Suministro',
        specialties: ['Gestión de Inventarios', 'Procesos Operativos'],
        skills: ['ERP', 'Cadena de suministro', 'Control de calidad'],
        years_experience: 8,
        responsibility_level: 'manager',
        supervisor_id: null,
        assigned_permissions: ['logistics_manage'],
        active_tasks_count: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-6',
        internal_id: 'EMP-106',
        full_name: 'Mariana Pineda',
        email: 'mariana.pineda@nexora.com',
        phone: '+52 55 6677 8899',
        address: 'Coyoacán, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-02-20',
        status: 'active',
        department_id: 'dept-4',
        department_name: 'Departamento de Recursos Humanos',
        group_id: 'grp-5',
        group_name: 'Atracción y Reclutamiento',
        position_id: 'pos-4',
        position_title: 'Gerente de Recursos Humanos',
        profession: 'Licenciada en Psicología Organizacional',
        career: 'Recursos Humanos y Desarrollo del Talento',
        specialties: ['Reclutamiento IT', 'Gestión del Desempeño', 'Clima Laboral'],
        skills: ['Entrevistas por competencias', 'Legislación laboral', 'Onboarding'],
        years_experience: 9,
        responsibility_level: 'manager',
        supervisor_id: null,
        assigned_permissions: ['hr_full_access'],
        active_tasks_count: 3,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-7',
        internal_id: 'EMP-107',
        full_name: 'Roberto Valenzuela',
        email: 'roberto.valenzuela@nexora.com',
        phone: '+52 55 7788 9900',
        address: 'Condesa, Cuauhtémoc, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-01-10',
        status: 'active',
        department_id: 'dept-5',
        department_name: 'Departamento de Contabilidad y Finanzas',
        group_id: 'grp-6',
        group_name: 'Facturación y Cobranza',
        position_id: 'pos-5',
        position_title: 'Contador Público y Financiero',
        profession: 'Contador Público Certificado',
        career: 'Contaduría Pública y Finanzas',
        specialties: ['Auditoría Fiscal', 'Flujo de Caja', 'Facturación SAT'],
        skills: ['Contabilidad electrónica', 'Análisis financiero', 'Presupuestos'],
        years_experience: 11,
        responsibility_level: 'senior',
        supervisor_id: null,
        assigned_permissions: ['finance_full_access'],
        active_tasks_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'emp-8',
        internal_id: 'EMP-108',
        full_name: 'Lic. Gustavo Morales',
        email: 'gustavo.morales@nexora.com',
        phone: '+52 55 8899 0011',
        address: 'Lomas de Chapultepec, Miguel Hidalgo, CDMX',
        avatar_url: '/images/illustrations/hero-character.jpg',
        hire_date: '2023-05-02',
        status: 'active',
        department_id: 'dept-6',
        department_name: 'Departamento Legal y Cumplimiento',
        group_id: 'grp-7',
        group_name: 'Contratos Corporativos',
        position_id: 'pos-6',
        position_title: 'Abogado Corporativo',
        profession: 'Licenciado en Derecho',
        career: 'Derecho Corporativo y Mercantil',
        specialties: ['Contratos de Tecnología', 'Compliance Legal', 'Protección de Datos'],
        skills: ['Negociación contractual', 'Dictámenes jurídicos', 'Propiedad Intelectual'],
        years_experience: 12,
        responsibility_level: 'senior',
        supervisor_id: null,
        assigned_permissions: ['legal_full_access'],
        active_tasks_count: 1,
        created_at: new Date().toISOString()
      }
    ]

    this.leaveRequests = [
      {
        id: 'leave-1',
        employee_id: 'emp-2',
        employee_name: 'Valeria Castro',
        leave_type: 'vacation',
        start_date: '2026-12-20',
        end_date: '2026-12-27',
        days_count: 5,
        reason: 'Vacaciones de fin de año programadas.',
        status: 'approved',
        approved_by: 'Mariana Pineda',
        created_at: new Date().toISOString()
      },
      {
        id: 'leave-2',
        employee_id: 'emp-4',
        employee_name: 'Felipe Herrera',
        leave_type: 'medical',
        start_date: '2026-11-18',
        end_date: '2026-11-19',
        days_count: 2,
        reason: 'Cita médica dental programada con justificante.',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]

    this.vacancies = [
      {
        id: 'vac-1',
        title: 'Desarrollador Backend Node.js & TypeScript',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        position_id: 'pos-2',
        openings_count: 2,
        candidates_count: 7,
        status: 'interviewing',
        description: 'Buscamos programador backend con experiencia en PostgreSQL y monolitos modulares.',
        requirements: ['3+ años en Node.js', 'PostgreSQL avanzado', 'Testing con Vitest'],
        created_at: new Date().toISOString()
      },
      {
        id: 'vac-2',
        title: 'Analista de Seguridad Cloud',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        position_id: 'pos-3',
        openings_count: 1,
        candidates_count: 4,
        status: 'open',
        description: 'Responsable de auditorías continuas y monitoreo de eventos de seguridad.',
        requirements: ['Certificación en ciberseguridad', 'Conocimiento de AWS / Cloud', 'Linux'],
        created_at: new Date().toISOString()
      }
    ]

    this.reviews = [
      {
        id: 'rev-1',
        employee_id: 'emp-2',
        employee_name: 'Valeria Castro',
        reviewer_name: 'Carlos Mendoza',
        period: 'Q3 2026',
        score: 98,
        goals_met: ['Entrega del módulo Intake a tiempo', 'Cero bugs críticos en producción'],
        feedback: 'Excelente desempeño técnico y liderazgo del equipo frontend.',
        status: 'completed',
        created_at: new Date().toISOString()
      }
    ]

    this.transactions = [
      {
        id: 'tx-1',
        type: 'income',
        category: 'Cobro de Servicios',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        amount: 2450.00,
        currency: 'USD',
        concept: 'Provisión mensual de plataforma web y soporte',
        reference_code: 'ING-2026-089',
        transaction_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'confirmed'
      },
      {
        id: 'tx-2',
        type: 'expense',
        category: 'Infraestructura Cloud',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        amount: 480.00,
        currency: 'USD',
        concept: 'Servidores dedicados y base de datos Supabase Pro',
        reference_code: 'EGR-2026-042',
        transaction_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'confirmed'
      },
      {
        id: 'tx-3',
        type: 'expense',
        category: 'Capacitación y Cursos',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        amount: 650.00,
        currency: 'USD',
        concept: 'Certificación de seguridad para equipo de pentesting',
        reference_code: 'EGR-2026-043',
        transaction_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'confirmed'
      }
    ]

    this.invoices = [
      {
        id: 'inv-1',
        invoice_number: 'FAC-2026-001',
        client_id: 'cli-1',
        client_name: 'Carlos Pérez',
        concept: 'Servicio de Diseño Web y Despliegue',
        amount: 120.00,
        tax_amount: 19.20,
        total_amount: 139.20,
        currency: 'USD',
        issue_date: '2026-11-01',
        due_date: '2026-11-15',
        status: 'paid'
      },
      {
        id: 'inv-2',
        invoice_number: 'FAC-2026-002',
        client_id: 'cli-2',
        client_name: 'María López',
        concept: 'Soporte Técnico Especializado e Infraestructura',
        amount: 80.00,
        tax_amount: 12.80,
        total_amount: 92.80,
        currency: 'USD',
        issue_date: '2026-11-05',
        due_date: '2026-11-20',
        status: 'pending'
      }
    ]

    this.budgets = [
      {
        id: 'bud-1',
        department_id: 'dept-1',
        department_name: 'Departamento de Tecnología',
        period: '2026',
        allocated_amount: 45000,
        spent_amount: 28400,
        currency: 'USD'
      },
      {
        id: 'bud-2',
        department_id: 'dept-2',
        department_name: 'Departamento de Ciberseguridad',
        period: '2026',
        allocated_amount: 25000,
        spent_amount: 14200,
        currency: 'USD'
      },
      {
        id: 'bud-3',
        department_id: 'dept-4',
        department_name: 'Departamento de Recursos Humanos',
        period: '2026',
        allocated_amount: 18000,
        spent_amount: 11500,
        currency: 'USD'
      }
    ]

    this.legalCases = [
      {
        id: 'leg-1',
        case_number: 'EXP-LEG-2026-001',
        title: 'Acuerdo de Nivel de Servicio (SLA) con Proveedores Cloud',
        case_type: 'compliance',
        responsible_lawyer: 'Lic. Gustavo Morales',
        status: 'in_review',
        opening_date: '2026-10-15',
        due_date: '2026-12-01',
        description: 'Revisión de cláusulas de indemnización y penalización por caídas de servicio.',
        document_count: 4
      },
      {
        id: 'leg-2',
        case_number: 'EXP-LEG-2026-002',
        title: 'Registro de Marca y Propiedad Intelectual NEXORA',
        case_type: 'intellectual_property',
        responsible_lawyer: 'Lic. Gustavo Morales',
        status: 'open',
        opening_date: '2026-11-01',
        description: 'Trámite de registro de identidad de marca, logotipo y código fuente.',
        document_count: 6
      }
    ]

    this.legalContracts = [
      {
        id: 'ctr-1',
        contract_number: 'CTR-NEX-084',
        title: 'Contrato Marco de Prestación de Servicios de TI',
        contract_type: 'service_agreement',
        parties: ['NEXORA Technologies Inc.', 'Corporativo Alfa S.A.'],
        effective_date: '2026-01-01',
        expiration_date: '2026-12-31',
        auto_renew: true,
        status: 'active'
      },
      {
        id: 'ctr-2',
        contract_number: 'CTR-NDA-032',
        title: 'Convenio de Confidencialidad y No Divulgación',
        contract_type: 'nda',
        parties: ['NEXORA Technologies Inc.', 'Contratistas Externos'],
        effective_date: '2026-06-01',
        expiration_date: '2027-06-01',
        auto_renew: false,
        status: 'active'
      }
    ]

    this.legalRequests = [
      {
        id: 'lreq-1',
        request_number: 'SOL-LEG-01',
        requester_name: 'Carlos Mendoza',
        requester_dept: 'Departamento de Tecnología',
        subject: 'Revisión de términos y condiciones de API de terceros',
        description: 'Requerimos validación legal sobre las licencias de librerías open-source antes de producción.',
        urgency: 'high',
        status: 'in_analysis',
        created_at: new Date().toISOString()
      }
    ]

    this.notifications = [
      {
        id: 'org-notif-1',
        recipient_scope: 'department',
        target_id: 'dept-1',
        title: 'Nueva solicitud asignada a Tecnología',
        message: 'Se ha asignado el ticket #012 de Diseño Web al área técnica.',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'org-notif-2',
        recipient_scope: 'group',
        target_id: 'grp-1',
        title: 'Asignación de requerimiento Frontend',
        message: 'El grupo de Desarrollo Frontend tiene 1 nuevo entregable pendiente.',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ]

    this.securityIncidents = [
      {
        id: 'inc-001',
        incident_number: 'SEC-2026-089',
        title: 'Intentos anómalos de fuerza bruta en endpoint /auth/v1/token',
        severity: 'high',
        category: 'brute_force',
        status: 'mitigated',
        assigned_group_id: 'grp-4',
        assigned_group_name: 'Análisis de Vulnerabilidades & SOC',
        reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        resolved_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        source_ip: '185.220.101.44',
        description: 'Múltiples solicitudes fallidas consecutivas con diccionarios comunes detectadas por el escudo defensivo.',
        defensive_action: 'Regla de rate-limiting estricto y bloqueo temporal de CIDR aplicado en gateway.'
      },
      {
        id: 'inc-002',
        incident_number: 'SEC-2026-090',
        title: 'Payload sospechoso de evasión SQL detectado en filtro de solicitudes',
        severity: 'medium',
        category: 'unauthorized_access',
        status: 'investigating',
        assigned_group_id: 'grp-4',
        assigned_group_name: 'Análisis de Vulnerabilidades & SOC',
        reported_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        source_ip: '45.154.255.89',
        description: 'Intento de inyección mediante caracteres de escape neutralizado por validadores de Zod y consultas parametrizadas.'
      }
    ]

    this.securityEvents = [
      {
        id: 'sev-1',
        event_type: 'login_success',
        user_email: 'admin@nexora.com',
        ip_address: '192.168.1.10',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'allowed',
        details: 'Inicio de sesión con credenciales válidas y sesión reactiva iniciada',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'sev-2',
        event_type: 'login_failed',
        user_email: 'valeria.castro@nexora.com',
        ip_address: '185.220.101.44',
        user_agent: 'Python-urllib/3.9',
        status: 'blocked',
        details: 'Credenciales inválidas desde IP no autorizada. Intento bloqueado.',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'sev-3',
        event_type: 'role_escalation',
        user_email: 'carlos.mendoza@nexora.com',
        ip_address: '192.168.1.15',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'allowed',
        details: 'Autorización de supervisor registrada para aprobación de contratos',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]

    this.devProjects = [
      {
        id: 'prj-1',
        name: 'NEXORA Enterprise Monolith',
        code: 'NEX-CORE',
        description: 'Plataforma empresarial principal en Vue 3, TypeScript y PostgreSQL con Supabase.',
        repository_url: 'https://github.com/nexora-org/nexora-monolith',
        current_version: 'v2.1.0',
        status: 'active',
        lead_employee_id: 'emp-1',
        lead_employee_name: 'Carlos Mendoza',
        updated_at: new Date().toISOString()
      },
      {
        id: 'prj-2',
        name: 'SLA Radar & Routing Engine',
        code: 'NEX-SLA',
        description: 'Motor reactivo de supervisión de acuerdos de servicio, colas de atención y escalamiento.',
        repository_url: 'https://github.com/nexora-org/sla-radar-engine',
        current_version: 'v1.4.2',
        status: 'active',
        lead_employee_id: 'emp-2',
        lead_employee_name: 'Valeria Castro',
        updated_at: new Date().toISOString()
      }
    ]

    this.devTasks = [
      {
        id: 'dtask-1',
        task_number: 'DEV-401',
        project_id: 'prj-1',
        project_name: 'NEXORA Enterprise Monolith',
        title: 'Optimización de índices compuestos en tablas de conversaciones para búsquedas rápidas',
        type: 'feature',
        priority: 'high',
        status: 'in_progress',
        assigned_employee_id: 'emp-2',
        assigned_employee_name: 'Valeria Castro',
        estimated_hours: 8,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'dtask-2',
        task_number: 'DEV-402',
        project_id: 'prj-1',
        project_name: 'NEXORA Enterprise Monolith',
        title: 'Implementación del protocolo Web Crypto API AES-GCM 256 para centro de aclaraciones',
        type: 'security_patch',
        priority: 'urgent',
        status: 'done',
        assigned_employee_id: 'emp-3',
        assigned_employee_name: 'Alejandro Soto',
        estimated_hours: 14,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'dtask-3',
        task_number: 'DEV-403',
        project_id: 'prj-2',
        project_name: 'SLA Radar & Routing Engine',
        title: 'Detección proactiva de riesgos de vencimiento y cálculo de días hábiles',
        type: 'feature',
        priority: 'medium',
        status: 'in_review',
        assigned_employee_id: 'emp-1',
        assigned_employee_name: 'Carlos Mendoza',
        estimated_hours: 6,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]

    this.persistAll()
  }

  private persistAll(): void {
    localStorage.setItem('nexora_org_depts', JSON.stringify(this.departments))
    localStorage.setItem('nexora_org_groups', JSON.stringify(this.groups))
    localStorage.setItem('nexora_org_positions', JSON.stringify(this.positions))
    localStorage.setItem('nexora_org_employees', JSON.stringify(this.employees))
    localStorage.setItem('nexora_hr_leaves', JSON.stringify(this.leaveRequests))
    localStorage.setItem('nexora_hr_vacancies', JSON.stringify(this.vacancies))
    localStorage.setItem('nexora_hr_reviews', JSON.stringify(this.reviews))
    localStorage.setItem('nexora_fin_transactions', JSON.stringify(this.transactions))
    localStorage.setItem('nexora_fin_invoices', JSON.stringify(this.invoices))
    localStorage.setItem('nexora_fin_budgets', JSON.stringify(this.budgets))
    localStorage.setItem('nexora_leg_cases', JSON.stringify(this.legalCases))
    localStorage.setItem('nexora_leg_contracts', JSON.stringify(this.legalContracts))
    localStorage.setItem('nexora_leg_requests', JSON.stringify(this.legalRequests))
    localStorage.setItem('nexora_org_notifications', JSON.stringify(this.notifications))
    localStorage.setItem('nexora_org_credentials', JSON.stringify(this.credentials))
    localStorage.setItem('nexora_sec_incidents', JSON.stringify(this.securityIncidents))
    localStorage.setItem('nexora_sec_events', JSON.stringify(this.securityEvents))
    localStorage.setItem('nexora_dev_projects', JSON.stringify(this.devProjects))
    localStorage.setItem('nexora_dev_tasks', JSON.stringify(this.devTasks))
  }

  async getDepartments(): Promise<Department[]> {
    const client = this.getClient()
    if (client) {
      try {
        const { data } = await client.from('departments').select('*').order('name')
        if (data && data.length > 0) {
          this.departments = data as Department[]
          this.persistAll()
          return [...this.departments]
        }
      } catch {}
    }
    return [...this.departments]
  }

  getDepartmentById(id: string): Promise<Department | null> {
    const d = this.departments.find(x => x.id === id) || null
    return Promise.resolve(d)
  }

  async createDepartment(data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'group_count' | 'employee_count'>): Promise<Department> {
    const newDept: Department = {
      ...data,
      id: `dept-${Date.now()}`,
      group_count: 0,
      employee_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const client = this.getClient()
    if (client) {
      try {
        await client.from('departments').insert({
          id: newDept.id,
          name: newDept.name,
          code: newDept.code,
          description: newDept.description,
          objectives: newDept.objectives,
          functions: newDept.functions || [],
          is_active: newDept.is_active ?? true
        })
      } catch {}
    }
    this.departments.push(newDept)
    this.persistAll()
    return newDept
  }

  updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const idx = this.departments.findIndex(x => x.id === id)
    if (idx === -1) throw new Error('Departamento no encontrado')
    this.departments[idx] = {
      ...this.departments[idx]!,
      ...data,
      updated_at: new Date().toISOString()
    }
    const client = this.getClient()
    if (client) {
      try {
        client.from('departments').update(data).eq('id', id)
      } catch {}
    }
    this.persistAll()
    return Promise.resolve(this.departments[idx]!)
  }

  deleteDepartment(id: string, reassignDeptId?: string): Promise<void> {
    const assignedEmps = this.employees.filter(e => e.department_id === id)
    const assignedGrps = this.groups.filter(g => g.department_id === id)

    if ((assignedEmps.length > 0 || assignedGrps.length > 0) && !reassignDeptId) {
      throw new Error(`No se puede eliminar el departamento porque tiene ${assignedEmps.length} empleados y ${assignedGrps.length} grupos asociados. Debes reasignarlos primero.`)
    }

    if (reassignDeptId) {
      const targetDept = this.departments.find(d => d.id === reassignDeptId)
      if (!targetDept) throw new Error('Departamento de reasignación no válido')

      this.employees.forEach(e => {
        if (e.department_id === id) {
          e.department_id = reassignDeptId
          e.department_name = targetDept.name
        }
      })

      this.groups.forEach(g => {
        if (g.department_id === id) {
          g.department_id = reassignDeptId
          g.department_name = targetDept.name
        }
      })
    }

    const client = this.getClient()
    if (client) {
      try {
        client.from('departments').delete().eq('id', id)
      } catch {}
    }

    this.departments = this.departments.filter(d => d.id !== id)
    this.persistAll()
    return Promise.resolve()
  }

  async getGroups(deptId?: string): Promise<WorkGroup[]> {
    const client = this.getClient()
    if (client) {
      try {
        let q = client.from('work_groups').select('*')
        if (deptId) q = q.eq('department_id', deptId)
        const { data } = await q
        if (data && data.length > 0) {
          if (!deptId) this.groups = data as WorkGroup[]
          return data as WorkGroup[]
        }
      } catch {}
    }
    if (deptId) {
      return this.groups.filter(g => g.department_id === deptId)
    }
    return [...this.groups]
  }

  async createGroup(data: Omit<WorkGroup, 'id' | 'created_at' | 'updated_at' | 'member_count'>): Promise<WorkGroup> {
    const newGrp: WorkGroup = {
      ...data,
      id: `grp-${Date.now()}`,
      max_capacity: data.max_capacity || 10,
      member_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const client = this.getClient()
    if (client) {
      try {
        await client.from('work_groups').insert({
          id: newGrp.id,
          department_id: newGrp.department_id,
          name: newGrp.name,
          code: newGrp.code,
          objective: newGrp.objective,
          specialties: newGrp.specialties || [],
          max_capacity: newGrp.max_capacity,
          member_count: 0,
          services_assigned: newGrp.services_assigned || [],
          is_active: newGrp.is_active ?? true
        })
      } catch {}
    }
    this.groups.push(newGrp)

    const dept = this.departments.find(d => d.id === data.department_id)
    if (dept) {
      dept.group_count = (dept.group_count || 0) + 1
    }

    this.persistAll()
    return newGrp
  }

  updateGroup(id: string, data: Partial<WorkGroup>): Promise<WorkGroup> {
    const idx = this.groups.findIndex(g => g.id === id)
    if (idx === -1) throw new Error('Grupo no encontrado')
    this.groups[idx] = {
      ...this.groups[idx]!,
      ...data,
      updated_at: new Date().toISOString()
    }
    this.persistAll()
    return Promise.resolve(this.groups[idx]!)
  }

  deleteGroup(id: string, reassignGroupId?: string): Promise<void> {
    const members = this.employees.filter(e => e.group_id === id)
    if (members.length > 0 && !reassignGroupId) {
      throw new Error(`El grupo cuenta con ${members.length} colaboradores activos. Selecciona un grupo de reasignación antes de eliminarlo.`)
    }

    if (reassignGroupId) {
      const targetGrp = this.groups.find(g => g.id === reassignGroupId)
      if (!targetGrp) throw new Error('Grupo destino no existe')

      members.forEach(e => {
        e.group_id = reassignGroupId
        e.group_name = targetGrp.name
      })
      targetGrp.member_count += members.length
    }

    const grp = this.groups.find(g => g.id === id)
    if (grp) {
      const dept = this.departments.find(d => d.id === grp.department_id)
      if (dept && dept.group_count) {
        dept.group_count = Math.max(0, dept.group_count - 1)
      }
    }

    this.groups = this.groups.filter(g => g.id !== id)
    this.persistAll()
    return Promise.resolve()
  }

  async getPositions(deptId?: string): Promise<Position[]> {
    const client = this.getClient()
    if (client) {
      try {
        let q = client.from('positions').select('*')
        if (deptId) q = q.eq('department_id', deptId)
        const { data } = await q
        if (data && data.length > 0) {
          if (!deptId) this.positions = data as Position[]
          return data as Position[]
        }
      } catch {}
    }
    if (deptId) {
      return this.positions.filter(p => p.department_id === deptId)
    }
    return [...this.positions]
  }

  async createPosition(data: Omit<Position, 'id' | 'created_at' | 'employee_count'>): Promise<Position> {
    const newPos: Position = {
      ...data,
      id: `pos-${Date.now()}`,
      employee_count: 0,
      created_at: new Date().toISOString()
    }
    const client = this.getClient()
    if (client) {
      try {
        await client.from('positions').insert({
          id: newPos.id,
          title: newPos.title,
          department_id: newPos.department_id,
          hierarchy_level: newPos.hierarchy_level,
          description: newPos.description,
          responsibilities: newPos.responsibilities || [],
          required_skills: newPos.required_skills || [],
          required_education: newPos.required_education,
          specialties: newPos.specialties || [],
          is_active: newPos.is_active ?? true
        })
      } catch {}
    }
    this.positions.push(newPos)
    this.persistAll()
    return newPos
  }

  updatePosition(id: string, data: Partial<Position>): Promise<Position> {
    const idx = this.positions.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Puesto no encontrado')
    this.positions[idx] = {
      ...this.positions[idx]!,
      ...data
    }
    const client = this.getClient()
    if (client) {
      try {
        client.from('positions').update(data).eq('id', id)
      } catch {}
    }
    this.persistAll()
    return Promise.resolve(this.positions[idx]!)
  }

  deletePosition(id: string): Promise<void> {
    const emps = this.employees.filter(e => e.position_id === id)
    if (emps.length > 0) {
      throw new Error(`No se puede eliminar el puesto porque hay ${emps.length} colaboradores asignados a él.`)
    }
    const client = this.getClient()
    if (client) {
      try {
        client.from('positions').delete().eq('id', id)
      } catch {}
    }
    this.positions = this.positions.filter(p => p.id !== id)
    this.persistAll()
    return Promise.resolve()
  }

  async getEmployees(filter?: { deptId?: string; status?: string; search?: string }): Promise<Employee[]> {
    const client = this.getClient()
    if (client) {
      try {
        let q = client.from('employees').select('*, department:departments!department_id(name), position:positions!position_id(title)')
        if (filter?.deptId && filter.deptId !== 'all') {
          q = q.eq('department_id', filter.deptId)
        }
        if (filter?.status && filter.status !== 'all') {
          q = q.eq('status', filter.status)
        }
        const { data, error } = await q
        if (!error && data && data.length > 0) {
          type EmpRow = Employee & {
            department?: { name: string } | null
            position?: { title: string } | null
          }
          const mapped: Employee[] = (data as unknown as EmpRow[]).map(row => ({
            ...row,
            department_name: row.department?.name || row.department_name,
            position_title: row.position?.title || row.position_title
          }))
          if (filter?.search) {
            const query = filter.search.toLowerCase().trim()
            return mapped.filter(e =>
              e.full_name.toLowerCase().includes(query) ||
              e.email.toLowerCase().includes(query) ||
              e.internal_id.toLowerCase().includes(query) ||
              e.profession.toLowerCase().includes(query)
            )
          }
          this.employees = mapped
          this.persistAll()
          return mapped
        }
      } catch {}
    }

    let list = [...this.employees]
    if (filter?.deptId && filter.deptId !== 'all') {
      list = list.filter(e => e.department_id === filter.deptId)
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(e => e.status === filter.status)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim()
      list = list.filter(e =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.internal_id.toLowerCase().includes(q) ||
        e.profession.toLowerCase().includes(q)
      )
    }
    return list
  }

  async createEmployee(data: Omit<Employee, 'id' | 'created_at' | 'active_tasks_count'>): Promise<Employee> {
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      active_tasks_count: 0,
      created_at: new Date().toISOString()
    }

    const client = this.getClient()
    if (client) {
      try {
        await client.from('employees').insert({
          id: newEmp.id,
          internal_id: newEmp.internal_id,
          full_name: newEmp.full_name,
          email: newEmp.email,
          phone: newEmp.phone,
          address: newEmp.address || null,
          avatar_url: newEmp.avatar_url || null,
          hire_date: newEmp.hire_date || new Date().toISOString().split('T')[0],
          status: newEmp.status || 'active',
          department_id: newEmp.department_id,
          group_id: newEmp.group_id || null,
          position_id: newEmp.position_id,
          profession: newEmp.profession,
          career: newEmp.career,
          specialties: newEmp.specialties || [],
          skills: newEmp.skills || [],
          years_experience: newEmp.years_experience || 0,
          responsibility_level: newEmp.responsibility_level || 'mid',
          supervisor_id: newEmp.supervisor_id || null,
          assigned_permissions: newEmp.assigned_permissions || []
        })
      } catch {}
    }

    this.employees.push(newEmp)

    const dept = this.departments.find(d => d.id === data.department_id)
    if (dept) {
      dept.employee_count = (dept.employee_count || 0) + 1
    }

    if (data.group_id) {
      const grp = this.groups.find(g => g.id === data.group_id)
      if (grp) {
        grp.member_count = (grp.member_count || 0) + 1
      }
    }

    const pos = this.positions.find(p => p.id === data.position_id)
    if (pos) {
      pos.employee_count = (pos.employee_count || 0) + 1
    }

    this.persistAll()
    return newEmp
  }

  updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const idx = this.employees.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Empleado no encontrado')
    this.employees[idx] = {
      ...this.employees[idx]!,
      ...data
    }
    const client = this.getClient()
    if (client) {
      try {
        client.from('employees').update(data).eq('id', id)
      } catch {}
    }
    this.persistAll()
    return Promise.resolve(this.employees[idx]!)
  }

  toggleEmployeeStatus(id: string, status: 'active' | 'inactive'): Promise<Employee> {
    const emp = this.employees.find(e => e.id === id)
    if (!emp) throw new Error('Empleado no encontrado')
    emp.status = status
    const client = this.getClient()
    if (client) {
      try {
        client.from('employees').update({ status }).eq('id', id)
      } catch {}
    }
    this.persistAll()
    return Promise.resolve(emp)
  }

  deleteEmployee(id: string): Promise<void> {
    const emp = this.employees.find(e => e.id === id)
    if (!emp) throw new Error('Empleado no encontrado')

    const client = this.getClient()
    if (client) {
      try {
        client.from('employees').delete().eq('id', id)
      } catch {}
    }

    const dept = this.departments.find(d => d.id === emp.department_id)
    if (dept && dept.employee_count) {
      dept.employee_count = Math.max(0, dept.employee_count - 1)
    }

    if (emp.group_id) {
      const grp = this.groups.find(g => g.id === emp.group_id)
      if (grp && grp.member_count) {
        grp.member_count = Math.max(0, grp.member_count - 1)
      }
    }

    this.employees = this.employees.filter(e => e.id !== id)
    this.persistAll()
    return Promise.resolve()
  }

  getHrLeaves(): Promise<HrLeaveRequest[]> {
    return Promise.resolve([...this.leaveRequests])
  }

  createHrLeave(data: Omit<HrLeaveRequest, 'id' | 'created_at'>): Promise<HrLeaveRequest> {
    const req: HrLeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    this.leaveRequests.push(req)
    this.persistAll()
    return Promise.resolve(req)
  }

  updateHrLeaveStatus(id: string, status: 'approved' | 'rejected', reviewer: string): Promise<HrLeaveRequest> {
    const l = this.leaveRequests.find(x => x.id === id)
    if (!l) throw new Error('Solicitud de permiso no encontrada')
    l.status = status
    l.approved_by = reviewer
    this.persistAll()
    return Promise.resolve(l)
  }

  getHrVacancies(): Promise<HrVacancy[]> {
    return Promise.resolve([...this.vacancies])
  }

  createHrVacancy(data: Omit<HrVacancy, 'id' | 'created_at' | 'candidates_count'>): Promise<HrVacancy> {
    const v: HrVacancy = {
      ...data,
      id: `vac-${Date.now()}`,
      candidates_count: 0,
      created_at: new Date().toISOString()
    }
    this.vacancies.push(v)
    this.persistAll()
    return Promise.resolve(v)
  }

  getHrReviews(): Promise<HrPerformanceReview[]> {
    return Promise.resolve([...this.reviews])
  }

  getFinanceTransactions(): Promise<FinanceTransaction[]> {
    return Promise.resolve([...this.transactions])
  }

  createFinanceTransaction(data: Omit<FinanceTransaction, 'id'>): Promise<FinanceTransaction> {
    const tx: FinanceTransaction = {
      ...data,
      id: `tx-${Date.now()}`
    }
    this.transactions.push(tx)
    this.persistAll()
    return Promise.resolve(tx)
  }

  getFinanceInvoices(): Promise<FinanceInvoice[]> {
    return Promise.resolve([...this.invoices])
  }

  getFinanceBudgets(): Promise<FinanceBudget[]> {
    return Promise.resolve([...this.budgets])
  }

  getLegalCases(): Promise<LegalCase[]> {
    return Promise.resolve([...this.legalCases])
  }

  createLegalCase(data: Omit<LegalCase, 'id'>): Promise<LegalCase> {
    const item: LegalCase = {
      ...data,
      id: `case-${Date.now()}`
    }
    this.legalCases.push(item)
    this.persistAll()
    return Promise.resolve(item)
  }

  updateLegalCaseStatus(id: string, status: LegalCase['status']): Promise<LegalCase> {
    const item = this.legalCases.find(c => c.id === id)
    if (!item) throw new Error('Expediente no encontrado')
    item.status = status
    this.persistAll()
    return Promise.resolve(item)
  }

  getLegalContracts(): Promise<LegalContract[]> {
    return Promise.resolve([...this.legalContracts])
  }

  createLegalContract(data: Omit<LegalContract, 'id'>): Promise<LegalContract> {
    const item: LegalContract = {
      ...data,
      id: `cont-${Date.now()}`
    }
    this.legalContracts.push(item)
    this.persistAll()
    return Promise.resolve(item)
  }

  getLegalRequests(): Promise<LegalInternalRequest[]> {
    return Promise.resolve([...this.legalRequests])
  }

  createLegalRequest(data: Omit<LegalInternalRequest, 'id' | 'created_at' | 'status'>): Promise<LegalInternalRequest> {
    const req: LegalInternalRequest = {
      ...data,
      id: `lreq-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    this.legalRequests.push(req)
    this.persistAll()
    return Promise.resolve(req)
  }

  answerLegalRequest(id: string, responseText: string): Promise<LegalInternalRequest> {
    const req = this.legalRequests.find(r => r.id === id)
    if (!req) throw new Error('Solicitud no encontrada')
    req.status = 'answered'
    req.response = responseText
    this.persistAll()
    return Promise.resolve(req)
  }

  getOrgNotifications(scope?: string): Promise<OrgNotification[]> {
    if (scope && scope !== 'all') {
      return Promise.resolve(this.notifications.filter(n => n.recipient_scope === scope))
    }
    return Promise.resolve([...this.notifications])
  }

  markNotificationRead(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id)
    if (notif) notif.is_read = true
    this.persistAll()
    return Promise.resolve()
  }

  async createEmployeeWithCredentials(
    data: Omit<Employee, 'id' | 'created_at'>,
    customPassword?: string
  ): Promise<{ employee: Employee; credential: TemporaryCredential }> {
    const tempPass = (customPassword && customPassword.trim().length >= 6)
      ? customPassword.trim()
      : CryptoService.generateSecurePassword(14)

    try {
      const res = await fetch('/api/admin/employees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          password: tempPass
        })
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && json.employee && json.credential) {
          const emp = json.employee as Employee
          const cred = json.credential as TemporaryCredential

          this.employees = this.employees.filter(e => e.id !== emp.id && e.email.toLowerCase() !== emp.email.toLowerCase())
          this.employees.push(emp)

          this.credentials = this.credentials.filter(c => c.employee_id !== emp.id && c.email.toLowerCase() !== emp.email.toLowerCase())
          this.credentials.push(cred)

          const dept = this.departments.find(d => d.id === emp.department_id)
          if (dept) dept.employee_count = (dept.employee_count || 0) + 1

          if (emp.group_id) {
            const grp = this.groups.find(g => g.id === emp.group_id)
            if (grp) grp.member_count = (grp.member_count || 0) + 1
          }

          const pos = this.positions.find(p => p.id === emp.position_id)
          if (pos) pos.employee_count = (pos.employee_count || 0) + 1

          this.persistAll()
          return { employee: emp, credential: cred }
        }
      } else {
        const errJson = await res.json().catch(() => ({}))
        if (errJson.error) {
          throw new Error(errJson.error)
        }
      }
    } catch (apiErr: unknown) {
      if (apiErr instanceof Error && !apiErr.message.includes('fetch') && !apiErr.message.includes('NetworkError') && !apiErr.message.includes('Failed to fetch')) {
        throw apiErr
      }
    }

    const emp = await this.createEmployee(data)
    const credential: TemporaryCredential = {
      employee_id: emp.id,
      email: emp.email,
      full_name: emp.full_name,
      department_name: emp.department_name || 'Departamento General',
      position_title: emp.position_title || 'Colaborador',
      temporary_password: tempPass,
      must_change_password: true,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 30).toISOString()
    }

    const client = this.getClient()
    if (client) {
      try {
        await client.from('temporary_credentials').insert({
          id: `cred-${Date.now()}`,
          employee_id: emp.id,
          temp_password_hash: tempPass,
          expires_at: credential.expires_at,
          must_change_password: true
        })
      } catch {}
    }

    this.credentials = this.credentials.filter(c => c.employee_id !== emp.id)
    this.credentials.push(credential)
    this.persistAll()

    return { employee: emp, credential }
  }

  async generateTemporaryCredential(employeeId: string): Promise<TemporaryCredential> {
    const emp = this.employees.find(e => e.id === employeeId)
    if (!emp) throw new Error('Empleado no encontrado')

    const tempPass = CryptoService.generateSecurePassword(14)

    try {
      const res = await fetch('/api/admin/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: emp.id,
          password: tempPass
        })
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && json.credential) {
          const cred = json.credential as TemporaryCredential
          this.credentials = this.credentials.filter(c => c.employee_id !== emp.id)
          this.credentials.push(cred)
          this.persistAll()
          return cred
        }
      }
    } catch {}

    const credential: TemporaryCredential = {
      employee_id: emp.id,
      email: emp.email,
      full_name: emp.full_name,
      department_name: emp.department_name || 'Departamento General',
      position_title: emp.position_title || 'Colaborador',
      temporary_password: tempPass,
      must_change_password: true,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 30).toISOString()
    }

    const client = this.getClient()
    if (client) {
      try {
        client.from('temporary_credentials').insert({
          id: `cred-${Date.now()}`,
          employee_id: emp.id,
          temp_password_hash: tempPass,
          expires_at: credential.expires_at,
          must_change_password: true
        })
      } catch {}
    }

    this.credentials = this.credentials.filter(c => c.employee_id !== emp.id)
    this.credentials.push(credential)
    this.persistAll()

    return credential
  }

  getTemporaryCredential(employeeId: string): Promise<TemporaryCredential | null> {
    const c = this.credentials.find(x => x.employee_id === employeeId) || null
    return Promise.resolve(c)
  }

  async getSecurityIncidents(): Promise<SecurityIncident[]> {
    const client = this.getClient()
    if (client) {
      try {
        const { data } = await client.from('security_incidents').select('*').order('detected_at', { ascending: false })
        if (data && data.length > 0) {
          type SecRow = {
            id: string
            incident_code: string
            title: string
            severity: 'low' | 'medium' | 'high' | 'critical'
            category: string
            status: 'open' | 'investigating' | 'mitigated' | 'closed'
            description: string
            detected_at: string
            mitigated_at?: string
            mitigation_notes?: string
            affected_subsystems?: string[]
          }
          const mapped: SecurityIncident[] = (data as SecRow[]).map(r => ({
            id: r.id,
            incident_number: r.incident_code,
            title: r.title,
            severity: r.severity,
            category: (r.category as SecurityIncident['category']) || 'brute_force',
            status: r.status,
            assigned_group_id: 'grp-sec-ops',
            assigned_group_name: 'Security Operations Center (SOC)',
            source_ip: '198.51.100.42',
            description: r.description,
            reported_at: r.detected_at,
            resolved_at: r.mitigated_at,
            defensive_action: r.mitigation_notes
          }))
          this.securityIncidents = mapped
          this.persistAll()
          return mapped
        }
      } catch {}
    }
    return [...this.securityIncidents]
  }

  async createSecurityIncident(data: Omit<SecurityIncident, 'id' | 'reported_at'>): Promise<SecurityIncident> {
    const inc: SecurityIncident = {
      ...data,
      id: `inc-${Date.now()}`,
      reported_at: new Date().toISOString()
    }
    const client = this.getClient()
    if (client) {
      try {
        await client.from('security_incidents').insert({
          id: inc.id,
          incident_code: inc.incident_number,
          title: inc.title,
          severity: inc.severity,
          category: inc.category,
          status: inc.status,
          description: inc.description,
          detected_at: inc.reported_at,
          affected_subsystems: ['Gateway', 'Auth Service']
        })
      } catch {}
    }
    this.securityIncidents.unshift(inc)
    this.persistAll()
    return inc
  }

  async mitigateSecurityIncident(id: string, action: string): Promise<SecurityIncident> {
    const client = this.getClient()
    if (client) {
      try {
        await client.from('security_incidents').update({
          status: 'mitigated',
          mitigated_at: new Date().toISOString(),
          mitigation_notes: action
        }).eq('id', id)
      } catch {}
    }
    const inc = this.securityIncidents.find(i => i.id === id)
    if (inc) {
      inc.status = 'mitigated'
      inc.resolved_at = new Date().toISOString()
      inc.defensive_action = action
      this.persistAll()
      return inc
    }
    return {
      id,
      incident_number: 'SEC-RESOLVED',
      title: 'Incidente mitigado',
      severity: 'medium',
      category: 'brute_force',
      status: 'mitigated',
      assigned_group_id: 'grp-sec-ops',
      assigned_group_name: 'SOC Team',
      reported_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      source_ip: 'Neutralizada',
      description: 'Mitigación registrada exitosamente',
      defensive_action: action
    }
  }

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    const client = this.getClient()
    if (client) {
      try {
        const { data } = await client.from('security_events').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          type EvRow = {
            id: string
            event_type: string
            actor: string
            ip_address: string
            description: string
            severity: string
            created_at: string
          }
          const mapped: SecurityEvent[] = (data as EvRow[]).map(e => ({
            id: e.id,
            event_type: e.event_type === 'AUTH_SUCCESS' ? 'login_success' : 'login_failed',
            user_email: e.actor,
            ip_address: e.ip_address,
            user_agent: 'NEXORA Security Client / HTTP/2.0',
            status: e.severity === 'warning' ? 'blocked' : 'allowed',
            details: e.description,
            created_at: e.created_at
          }))
          this.securityEvents = mapped
          this.persistAll()
          return mapped
        }
      } catch {}
    }
    return [...this.securityEvents]
  }

  getDevProjects(): Promise<DevProject[]> {
    return Promise.resolve([...this.devProjects])
  }

  getDevTasks(): Promise<DevTask[]> {
    return Promise.resolve([...this.devTasks])
  }

  createDevTask(data: Omit<DevTask, 'id' | 'created_at'>): Promise<DevTask> {
    const task: DevTask = {
      ...data,
      id: `dtask-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    this.devTasks.unshift(task)
    this.persistAll()
    return Promise.resolve(task)
  }

  updateDevTaskStatus(id: string, status: DevTask['status']): Promise<DevTask> {
    const task = this.devTasks.find(t => t.id === id)
    if (!task) throw new Error('Tarea no encontrada')
    task.status = status
    this.persistAll()
    return Promise.resolve(task)
  }
}

export const orgService = new MockOrganizationService()