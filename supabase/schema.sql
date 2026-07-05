-- ============================================================
-- Gestão de Aulas — schema inicial
-- Rode este arquivo no Supabase: painel do projeto > SQL Editor > New query
-- Cole tudo e clique em "Run".
-- ============================================================

-- ---------- ALUNOS ----------
create table if not exists public.alunos (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  email             text,
  telefone          text,
  data_nascimento   date,
  -- 'mensalista' = paga valor fixo por mês | 'por_aula' = paga por aula dada
  tipo_cobranca     text not null default 'por_aula'
                      check (tipo_cobranca in ('mensalista', 'por_aula')),
  valor_mensalidade numeric(10,2),                       -- usado quando mensalista
  dia_vencimento    int check (dia_vencimento between 1 and 31),
  valor_hora        numeric(10,2),                       -- usado quando por_aula
  ativo             boolean not null default true,
  observacoes       text,
  created_at        timestamptz not null default now()
);

-- ---------- AULAS (particulares, 1 a 1) ----------
create table if not exists public.aulas (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  data          date not null,
  hora_inicio   time not null,
  hora_fim      time,
  status        text not null default 'agendada'
                  check (status in ('agendada', 'realizada', 'cancelada', 'falta')),
  valor         numeric(10,2),                           -- valor desta aula (cobrança por aula)
  observacoes   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_aulas_aluno on public.aulas(aluno_id);
create index if not exists idx_aulas_data  on public.aulas(data);

-- ---------- PAGAMENTOS ----------
create table if not exists public.pagamentos (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  tipo           text not null default 'mensalidade'
                   check (tipo in ('mensalidade', 'avulso')),
  referencia     text,                                   -- ex.: '2026-07' para mensalidade
  aula_id        uuid references public.aulas(id) on delete set null, -- avulso ligado a uma aula
  valor          numeric(10,2) not null,
  vencimento     date,
  data_pagamento date,                                   -- null = ainda não pago
  status         text not null default 'pendente'
                   check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  observacoes    text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_pagamentos_aluno  on public.pagamentos(aluno_id);
create index if not exists idx_pagamentos_status on public.pagamentos(status);

-- ============================================================
-- SEGURANÇA (Row Level Security)
-- ------------------------------------------------------------
-- ⚠️ TEMPORÁRIO: liberado para desenvolvimento enquanto ainda não há login.
-- Na Fase 6 (autenticação) vamos SUBSTITUIR estas políticas por regras
-- que restringem os dados ao usuário dono, ANTES de publicar o app.
-- ============================================================
alter table public.alunos     enable row level security;
alter table public.aulas      enable row level security;
alter table public.pagamentos enable row level security;

create policy "dev_all_alunos"     on public.alunos     for all using (true) with check (true);
create policy "dev_all_aulas"      on public.aulas      for all using (true) with check (true);
create policy "dev_all_pagamentos" on public.pagamentos for all using (true) with check (true);
