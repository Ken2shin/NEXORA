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
