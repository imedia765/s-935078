
create table if not exists public.smtp_health_checks (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid references public.smtp_configurations(id),
  status text check (status in ('healthy', 'degraded', 'failing')),
  check_timestamp timestamptz not null default now(),
  response_time integer not null,
  success_rate numeric not null,
  error_details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add RLS policies
alter table public.smtp_health_checks enable row level security;

create policy "Allow authenticated users to view smtp_health_checks"
  on public.smtp_health_checks
  for select
  to authenticated
  using (true);

-- Create index for faster queries
create index idx_smtp_health_checks_timestamp 
  on public.smtp_health_checks(check_timestamp desc);

create index idx_smtp_health_checks_config 
  on public.smtp_health_checks(configuration_id);
