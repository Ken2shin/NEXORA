CREATE TABLE IF NOT EXISTS public.departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  manager_id VARCHAR(50),
  objectives TEXT NOT NULL,
  functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.work_groups (
  id VARCHAR(50) PRIMARY KEY,
  department_id VARCHAR(50) NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  leader_id VARCHAR(50),
  objective TEXT NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  member_count INTEGER NOT NULL DEFAULT 0,
  services_assigned JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.positions (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  department_id VARCHAR(50) NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  hierarchy_level VARCHAR(30) NOT NULL DEFAULT 'mid',
  description TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_education VARCHAR(200) NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  supervisor_position_id VARCHAR(50) REFERENCES public.positions(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.employees (
  id VARCHAR(50) PRIMARY KEY,
  internal_id VARCHAR(30) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  avatar_url TEXT,
  hire_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  department_id VARCHAR(50) NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  group_id VARCHAR(50) REFERENCES public.work_groups(id) ON DELETE SET NULL,
  position_id VARCHAR(50) NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  profession VARCHAR(150) NOT NULL,
  career VARCHAR(150) NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  years_experience INTEGER NOT NULL DEFAULT 0,
  responsibility_level VARCHAR(30) NOT NULL DEFAULT 'junior',
  supervisor_id VARCHAR(50) REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.hr_leaves (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(30) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.hr_vacancies (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  department_id VARCHAR(50) NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  position_id VARCHAR(50) NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  openings_count INTEGER NOT NULL DEFAULT 1,
  candidates_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.hr_performance_reviews (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(150) NOT NULL,
  period VARCHAR(50) NOT NULL,
  score NUMERIC(3,1) NOT NULL,
  goals_met JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  department_id VARCHAR(50) REFERENCES public.departments(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  concept TEXT NOT NULL,
  reference_code VARCHAR(100) NOT NULL,
  receipt_filename TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
);

CREATE TABLE IF NOT EXISTS public.finance_invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  concept TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.finance_budgets (
  id VARCHAR(50) PRIMARY KEY,
  department_id VARCHAR(50) NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  period VARCHAR(30) NOT NULL,
  allocated_amount NUMERIC(12,2) NOT NULL,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS public.legal_cases (
  id VARCHAR(50) PRIMARY KEY,
  case_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  case_type VARCHAR(50) NOT NULL,
  responsible_lawyer VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  opening_date DATE NOT NULL,
  due_date DATE,
  description TEXT NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.legal_contracts (
  id VARCHAR(50) PRIMARY KEY,
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  parties JSONB NOT NULL DEFAULT '[]'::jsonb,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(30) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.legal_internal_requests (
  id VARCHAR(50) PRIMARY KEY,
  request_number VARCHAR(50) NOT NULL UNIQUE,
  requester_name VARCHAR(150) NOT NULL,
  requester_dept VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.org_notifications (
  id VARCHAR(50) PRIMARY KEY,
  recipient_scope VARCHAR(20) NOT NULL DEFAULT 'personal',
  target_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(50),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_group ON public.employees(group_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_workgroups_department ON public.work_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_department ON public.positions(department_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_department ON public.finance_transactions(department_id);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_client ON public.finance_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_contracts_status ON public.legal_contracts(status);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_internal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.departments TO authenticated, anon;
GRANT SELECT ON public.work_groups TO authenticated, anon;
GRANT SELECT ON public.positions TO authenticated, anon;
GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.work_groups TO authenticated;
GRANT ALL ON public.positions TO authenticated;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.hr_leaves TO authenticated;
GRANT ALL ON public.hr_vacancies TO authenticated;
GRANT ALL ON public.hr_performance_reviews TO authenticated;
GRANT ALL ON public.finance_transactions TO authenticated;
GRANT ALL ON public.finance_invoices TO authenticated;
GRANT ALL ON public.finance_budgets TO authenticated;
GRANT ALL ON public.legal_cases TO authenticated;
GRANT ALL ON public.legal_contracts TO authenticated;
GRANT ALL ON public.legal_internal_requests TO authenticated;
GRANT ALL ON public.org_notifications TO authenticated;
