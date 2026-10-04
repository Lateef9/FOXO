-- Primer Copilot schema (run in Supabase SQL editor)

create table members (
  id text primary key,
  pseudo_id text not null,
  name text not null, age int, sex text, city text, phone text, email text,
  goals text, symptoms text[] default '{}', history_text text,
  status text not null default 'report_received'
);

create table member_markers (
  member_id text references members(id) on delete cascade,
  code text not null, value numeric not null, unit text,
  primary key (member_id, code)
);

create table analyses (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(id) on delete cascade,
  result jsonb not null, created_at timestamptz default now()
);

create table playbooks (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(id) on delete cascade,
  analysis_id uuid references analyses(id),
  status text not null default 'draft',
  approved_by text, approved_at timestamptz,
  unscheduled jsonb default '[]', created_at timestamptz default now()
);

create table playbook_items (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid references playbooks(id) on delete cascade,
  item_key text, week_from int, week_to int, category text, title text,
  why_this text, wording_source text, cluster text, rule_ids text[],
  source text, evidence_strength text, warning text,
  requires_doctor_dose boolean default false,
  state text not null default 'pending', edited_text text
);

create table audit_log (
  id bigserial primary key, actor text not null,
  member_id text, action text not null, at timestamptz default now()
);

create table llm_cache (hash text primary key, response jsonb not null);
