-- ============================================================
-- Migração 002 — Financeiro e análises
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- Necessária ANTES de publicar a versão com dashboard/financeiro.
-- ============================================================

-- Bairro do aluno (análise "por bairro" no dashboard)
alter table public.alunos add column if not exists bairro text;

-- Custos registrados pela professora (página Financeiro)
create table if not exists public.custos (
  id          uuid primary key default gen_random_uuid(),
  data        date not null default current_date,
  categoria   text not null
                check (categoria in ('aula_perdida', 'uber', 'combustivel', 'outros')),
  descricao   text,
  valor       numeric(10,2) not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_custos_data on public.custos(data);

alter table public.custos enable row level security;
create policy "auth_all_custos" on public.custos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
