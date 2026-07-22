-- NovaSprout Learning Stripe database schema
-- Intended for Supabase Postgres.

create table if not exists public.stripe_payments (
  id bigint generated always as identity primary key,
  customer_name text,
  customer_email text,
  stripe_customer_id text,
  stripe_session_id text not null unique,
  amount numeric(12, 2) not null,
  currency text not null default 'usd',
  dba_name text not null,
  product_name text not null,
  payment_date timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists stripe_payments_dba_name_idx
  on public.stripe_payments (dba_name);

create index if not exists stripe_payments_payment_date_idx
  on public.stripe_payments (payment_date);

create index if not exists stripe_payments_customer_email_idx
  on public.stripe_payments (customer_email);

-- Financial records are server-only. The service-role key used by the
-- NovaSprout API bypasses RLS; browser-facing Supabase roles receive no policy.
alter table public.stripe_payments enable row level security;
revoke all on table public.stripe_payments from anon, authenticated;
grant select, insert on table public.stripe_payments to service_role;
grant usage, select on sequence public.stripe_payments_id_seq to service_role;

create table if not exists public.stripe_subscriptions (
  id bigint generated always as identity primary key,
  stripe_subscription_id text not null unique,
  stripe_customer_id text,
  customer_name text,
  customer_email text,
  status text not null,
  dba_name text not null,
  product_name text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_subscriptions_status_idx
  on public.stripe_subscriptions (status);

create index if not exists stripe_subscriptions_dba_name_idx
  on public.stripe_subscriptions (dba_name);

alter table public.stripe_subscriptions enable row level security;
revoke all on table public.stripe_subscriptions from anon, authenticated;
grant select, insert, update on table public.stripe_subscriptions to service_role;
grant usage, select on sequence public.stripe_subscriptions_id_seq to service_role;

-- Optional: keep updated_at fresh on updates.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_stripe_subscriptions_updated_at on public.stripe_subscriptions;

create trigger set_stripe_subscriptions_updated_at
before update on public.stripe_subscriptions
for each row
execute function public.set_updated_at();

-- A consumable App Store purchase starts one lesson pipeline. The same signed
-- transaction may finish its visual deck for six hours, but cannot start a
-- second lesson.
create table if not exists public.apple_iap_lesson_uses (
  id bigint generated always as identity primary key,
  transaction_id text not null unique,
  product_id text not null,
  active_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists apple_iap_lesson_uses_active_until_idx
  on public.apple_iap_lesson_uses (active_until);

alter table public.apple_iap_lesson_uses enable row level security;
revoke all on table public.apple_iap_lesson_uses from anon, authenticated;
grant select, insert on table public.apple_iap_lesson_uses to service_role;
grant usage, select on sequence public.apple_iap_lesson_uses_id_seq to service_role;

create table if not exists public.apple_iap_subscription_usage (
  transaction_id text primary key,
  product_id text not null,
  lessons_used integer not null default 0 check (lessons_used >= 0),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.apple_iap_subscription_usage enable row level security;
revoke all on table public.apple_iap_subscription_usage from anon, authenticated;
grant select, insert, update on table public.apple_iap_subscription_usage to service_role;

create or replace function public.claim_apple_subscription_lesson(
  p_transaction_id text,
  p_product_id text,
  p_expires_at timestamptz,
  p_lesson_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
begin
  insert into public.apple_iap_subscription_usage (
    transaction_id,
    product_id,
    lessons_used,
    expires_at
  ) values (
    p_transaction_id,
    p_product_id,
    1,
    p_expires_at
  )
  on conflict (transaction_id) do update
    set lessons_used = public.apple_iap_subscription_usage.lessons_used + 1,
        expires_at = excluded.expires_at,
        updated_at = now()
    where public.apple_iap_subscription_usage.lessons_used < p_lesson_limit;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.claim_apple_subscription_lesson(text, text, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.claim_apple_subscription_lesson(text, text, timestamptz, integer)
  to service_role;

-- Free Demo Class requests submitted through the website intake form.
create table if not exists public.demo_requests (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  grade_level text not null,
  subject text not null,
  goal text not null,
  availability text not null,
  timezone text not null,
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists demo_requests_email_created_at_idx
  on public.demo_requests (email, created_at desc);

create index if not exists demo_requests_status_created_at_idx
  on public.demo_requests (status, created_at desc);

alter table public.demo_requests enable row level security;
revoke all on table public.demo_requests from anon, authenticated;
grant select, insert, update on table public.demo_requests to service_role;
grant usage, select on sequence public.demo_requests_id_seq to service_role;
