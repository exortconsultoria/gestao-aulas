-- ============================================================
-- Migração 005 — Origem do aluno
-- Rode no Supabase: SQL Editor > New query > cole > Run.
-- Necessária ANTES de publicar a versão com o flag de origem.
-- ============================================================

-- Origem do aluno: captado pela própria Sophia ou indicado pelo André
-- (que cobra percentual sobre as aulas — base para análise futura).
alter table public.alunos add column if not exists origem text not null default 'sophia'
  check (origem in ('sophia', 'andre'));
