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
