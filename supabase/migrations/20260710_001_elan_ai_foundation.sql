-- AI-016
-- Contrato inicial de persistencia para ELAN AI.
-- NO ejecutar automáticamente en producción.

create extension if not exists pgcrypto;

create table if not exists public.elan_ai_identities (
  identity_id uuid primary key default gen_random_uuid(),
  display_name text,
  phone text,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists elan_ai_identities_phone_uq
  on public.elan_ai_identities (phone)
  where phone is not null and phone <> '';

create unique index if not exists elan_ai_identities_email_uq
  on public.elan_ai_identities (lower(email))
  where email is not null and email <> '';

create table if not exists public.elan_ai_identity_links (
  link_id uuid primary key default gen_random_uuid(),
  identity_id uuid not null
    references public.elan_ai_identities(identity_id)
    on delete cascade,
  channel text not null,
  external_user_id text not null,
  created_at timestamptz not null default now(),
  unique (channel, external_user_id)
);

create index if not exists elan_ai_identity_links_identity_idx
  on public.elan_ai_identity_links (identity_id);

create table if not exists public.elan_ai_memory_sessions (
  session_id uuid primary key,
  identity_id uuid not null
    references public.elan_ai_identities(identity_id)
    on delete cascade,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (identity_id)
);

create table if not exists public.elan_ai_memory_messages (
  message_id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    references public.elan_ai_memory_sessions(session_id)
    on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists elan_ai_memory_messages_session_idx
  on public.elan_ai_memory_messages (session_id, created_at);

create table if not exists public.elan_ai_states (
  state_key text primary key,
  identity_id uuid
    references public.elan_ai_identities(identity_id)
    on delete cascade,
  version integer not null default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists elan_ai_states_identity_idx
  on public.elan_ai_states (identity_id);

create table if not exists public.elan_ai_knowledge (
  knowledge_id text primary key,
  title text not null,
  content text not null,
  source text not null,
  type text not null default 'document',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists elan_ai_knowledge_source_idx
  on public.elan_ai_knowledge (source);

create index if not exists elan_ai_knowledge_type_idx
  on public.elan_ai_knowledge (type);

create table if not exists public.elan_ai_health (
  id integer primary key default 1,
  status text not null default 'OK',
  checked_at timestamptz not null default now(),
  constraint elan_ai_health_singleton check (id = 1)
);

insert into public.elan_ai_health (id, status)
values (1, 'OK')
on conflict (id) do update
set status = excluded.status,
    checked_at = now();

alter table public.elan_ai_identities enable row level security;
alter table public.elan_ai_identity_links enable row level security;
alter table public.elan_ai_memory_sessions enable row level security;
alter table public.elan_ai_memory_messages enable row level security;
alter table public.elan_ai_states enable row level security;
alter table public.elan_ai_knowledge enable row level security;
alter table public.elan_ai_health enable row level security;

-- Sin políticas públicas en esta fase.
-- El acceso inicial será exclusivamente mediante backend seguro.