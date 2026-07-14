-- ============================================================
-- Migração 004 — Telefone do responsável
-- Rode no Supabase: SQL Editor > New query > cole > Run.
-- Necessária ANTES de publicar a versão com escolha de destinatário.
-- ============================================================

-- Telefone do responsável pelo aluno (usado na confirmação via WhatsApp
-- quando o aluno não tem telefone próprio, ou como destinatário alternativo).
alter table public.alunos add column if not exists telefone_responsavel text;
