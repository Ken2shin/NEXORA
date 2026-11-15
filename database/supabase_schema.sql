CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('request_created', 'status_changed', 'general');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  image_path TEXT NOT NULL,
  price_amount NUMERIC(10, 2),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE SEQUENCE IF NOT EXISTS service_request_seq START 1;

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(20) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  previous_status request_status,
  new_status request_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL DEFAULT 'general',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON public.service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_status ON public.service_requests(client_id, status);
CREATE INDEX IF NOT EXISTS idx_request_attachments_request_id ON public.request_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_status_history_request_id ON public.request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_services_updated_at ON public.services;
CREATE TRIGGER tr_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER tr_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_auth_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_employee(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'employee') AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role := 'client';
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    avatar_path,
    is_active
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    assigned_role,
    NULL,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    notification_type
  ) VALUES (
    NEW.id,
    'Bienvenido a NEXORA',
    'Tu cuenta ha sido creada exitosamente. Explora nuestros servicios disponibles.',
    'general'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    seq_val := nextval('service_request_seq');
    NEW.request_number := '#' || lpad(seq_val::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_generate_request_number ON public.service_requests;
CREATE TRIGGER tr_generate_request_number
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_number();

CREATE OR REPLACE FUNCTION public.update_request_status_atomic(
  p_request_id UUID,
  p_new_status request_status,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_caller_role user_role;
  v_old_status request_status;
  v_client_id UUID;
  v_request_number VARCHAR(20);
  v_service_name TEXT;
  v_status_label TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id AND is_active = true;
  IF v_caller_role NOT IN ('admin', 'employee') THEN
    RAISE EXCEPTION 'Permisos insuficientes para modificar el estado de la solicitud';
  END IF;

  SELECT sr.status, sr.client_id, sr.request_number, s.name
  INTO v_old_status, v_client_id, v_request_number, v_service_name
  FROM public.service_requests sr
  JOIN public.services s ON s.id = sr.service_id
  WHERE sr.id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF v_old_status = p_new_status THEN
    RETURN jsonb_build_object('success', true, 'message', 'El estado ya es el solicitado');
  END IF;

  UPDATE public.service_requests
  SET status = p_new_status,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  INSERT INTO public.request_status_history (
    request_id,
    previous_status,
    new_status,
    changed_by,
    note
  ) VALUES (
    p_request_id,
    v_old_status,
    p_new_status,
    v_caller_id,
    p_note
  );

  IF p_new_status = 'in_progress' THEN
    v_status_label := 'está en proceso';
  ELSIF p_new_status = 'completed' THEN
    v_status_label := 'ha sido finalizada';
  ELSE
    v_status_label := 'ha pasado a pendiente';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    request_id,
    title,
    message,
    notification_type
  ) VALUES (
    v_client_id,
    p_request_id,
    'Actualización de tu solicitud',
    'Tu solicitud ' || v_request_number || ' de ' || v_service_name || ' ' || v_status_label || '.',
    'status_changed'
  );

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_caller_id,
    'UPDATE_REQUEST_STATUS',
    'service_requests',
    p_request_id,
    jsonb_build_object(
      'previous_status', v_old_status,
      'new_status', p_new_status,
      'note', p_note
    )
  );

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'new_status', p_new_status);
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_self_or_staff" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR public.is_admin_or_employee(auth.uid())
  );

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "categories_select_all" ON public.service_categories;
CREATE POLICY "categories_select_all" ON public.service_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "categories_staff_manage" ON public.service_categories;
CREATE POLICY "categories_staff_manage" ON public.service_categories
  FOR ALL
  USING (public.is_admin_or_employee(auth.uid()))
  WITH CHECK (public.is_admin_or_employee(auth.uid()));

DROP POLICY IF EXISTS "services_select_client" ON public.services;
CREATE POLICY "services_select_client" ON public.services
  FOR SELECT
  USING (
    is_active = true OR public.is_admin_or_employee(auth.uid())
  );

DROP POLICY IF EXISTS "services_staff_manage" ON public.services;
CREATE POLICY "services_staff_manage" ON public.services
  FOR ALL
  USING (public.is_admin_or_employee(auth.uid()))
  WITH CHECK (public.is_admin_or_employee(auth.uid()));

DROP POLICY IF EXISTS "requests_select_policy" ON public.service_requests;
CREATE POLICY "requests_select_policy" ON public.service_requests
  FOR SELECT
  USING (
    client_id = auth.uid() OR public.is_admin_or_employee(auth.uid())
  );

DROP POLICY IF EXISTS "requests_insert_client" ON public.service_requests;
CREATE POLICY "requests_insert_client" ON public.service_requests
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
  );

DROP POLICY IF EXISTS "requests_staff_update" ON public.service_requests;
CREATE POLICY "requests_staff_update" ON public.service_requests
  FOR UPDATE
  USING (public.is_admin_or_employee(auth.uid()))
  WITH CHECK (public.is_admin_or_employee(auth.uid()));

DROP POLICY IF EXISTS "attachments_select_policy" ON public.request_attachments;
CREATE POLICY "attachments_select_policy" ON public.request_attachments
  FOR SELECT
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_attachments.request_id AND (sr.client_id = auth.uid() OR public.is_admin_or_employee(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "attachments_insert_policy" ON public.request_attachments;
CREATE POLICY "attachments_insert_policy" ON public.request_attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_attachments.request_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "status_history_select_policy" ON public.request_status_history;
CREATE POLICY "status_history_select_policy" ON public.request_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_status_history.request_id AND (sr.client_id = auth.uid() OR public.is_admin_or_employee(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request_attachments',
  'request_attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "storage_upload_policy" ON storage.objects;
CREATE POLICY "storage_upload_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'request_attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_select_policy" ON storage.objects;
CREATE POLICY "storage_select_policy" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'request_attachments' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin_or_employee(auth.uid())
    )
  );

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_requests TO authenticated;
GRANT SELECT, INSERT ON public.request_attachments TO authenticated;
GRANT SELECT ON public.request_status_history TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_request_status_atomic(UUID, request_status, TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.intake_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  schema_definition JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'medium',
  first_response_hours INTEGER NOT NULL DEFAULT 4,
  resolution_hours INTEGER NOT NULL DEFAULT 24,
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.delivery_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.service_requests(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deliverable_notes TEXT,
  accepted_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  correction_requested BOOLEAN NOT NULL DEFAULT false,
  correction_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps JSONB NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.service_requests(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_request ON public.request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_sla_service ON public.sla_policies(service_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_articles(category);

ALTER TABLE public.intake_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.intake_templates TO authenticated, anon;
GRANT SELECT ON public.sla_policies TO authenticated, anon;
GRANT SELECT ON public.knowledge_articles TO authenticated, anon;
GRANT SELECT, INSERT ON public.request_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.delivery_acceptances TO authenticated;
GRANT SELECT, INSERT ON public.satisfaction_surveys TO authenticated;



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


CREATE TABLE IF NOT EXISTS public.conversations (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id VARCHAR(50) REFERENCES public.departments(id) ON DELETE SET NULL,
  group_id VARCHAR(50) REFERENCES public.work_groups(id) ON DELETE SET NULL,
  assigned_to VARCHAR(50) REFERENCES public.employees(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  satisfaction_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(50) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_role VARCHAR(20) NOT NULL DEFAULT 'client',
  message_type VARCHAR(30) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  iv VARCHAR(100),
  encryption_key_id VARCHAR(100),
  deleted_for_client BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_keys (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  raw_key TEXT NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-GCM-256',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_transfers (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  from_department_id VARCHAR(50),
  to_department_id VARCHAR(50) NOT NULL,
  from_employee_id VARCHAR(50),
  to_employee_id VARCHAR(50),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id VARCHAR(50) PRIMARY KEY,
  incident_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  category VARCHAR(50) NOT NULL DEFAULT 'access_attempt',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  mitigated_at TIMESTAMPTZ,
  mitigation_notes TEXT,
  affected_subsystems JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id VARCHAR(50) PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  actor VARCHAR(150) NOT NULL,
  ip_address VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dev_projects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  repository VARCHAR(200) NOT NULL,
  active_sprint VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dev_tasks (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  assigned_to_name VARCHAR(150) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'backlog',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.temporary_credentials (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  temp_password_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_request ON public.conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dept ON public.conversations(department_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sec_incidents_status ON public.security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_project ON public.dev_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_temp_cred_employee ON public.temporary_credentials(employee_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_credentials ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversation_messages TO authenticated;
GRANT ALL ON public.conversation_keys TO authenticated;
GRANT ALL ON public.conversation_transfers TO authenticated;
GRANT ALL ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_events TO authenticated;
GRANT ALL ON public.dev_projects TO authenticated;
GRANT ALL ON public.dev_tasks TO authenticated;
GRANT ALL ON public.temporary_credentials TO authenticated;
