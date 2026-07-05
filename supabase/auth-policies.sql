-- ============================================================
-- Trava o acesso ao banco: só usuários autenticados podem
-- ler/escrever. Rode isso no SQL Editor do Supabase, substituindo
-- as políticas temporárias "libera tudo" criadas em schema.sql.
-- ============================================================

drop policy if exists "dev_all_alunos" on public.alunos;
drop policy if exists "dev_all_aulas" on public.aulas;
drop policy if exists "dev_all_pagamentos" on public.pagamentos;

create policy "auth_all_alunos" on public.alunos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_aulas" on public.aulas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_pagamentos" on public.pagamentos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
