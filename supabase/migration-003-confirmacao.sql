-- ============================================================
-- Migração 003 — Confirmação de aulas via WhatsApp
-- Rode no Supabase: SQL Editor > New query > cole > Run.
-- Necessária ANTES de publicar a versão com a central de confirmações.
-- ============================================================

-- Registra quando a confirmação da aula foi enviada ao aluno (null = nunca).
alter table public.aulas add column if not exists confirmacao_enviada_em timestamptz;
