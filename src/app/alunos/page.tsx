import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AlunosPage() {
  const supabase = await createClient()
  const { data: alunos, error } = await supabase
    .from('alunos')
    .select('id, nome, email, telefone, tipo_cobranca, valor_mensalidade, valor_hora, ativo')
    .order('nome')

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Alunos</h1>
        <div className="flex gap-3">
          <Link href="/aulas" className="text-sm underline self-center">
            Agenda
          </Link>
          <Link
            href="/alunos/novo"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Cadastrar aluno
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          Erro ao carregar alunos: {error.message}
        </p>
      )}

      {!error && alunos?.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Nenhum aluno cadastrado ainda.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {alunos?.map((aluno) => {
          const valor =
            aluno.tipo_cobranca === 'mensalista'
              ? aluno.valor_mensalidade != null
                ? `R$ ${Number(aluno.valor_mensalidade).toFixed(2)} / mês`
                : 'Mensalista (sem valor definido)'
              : aluno.valor_hora != null
                ? `R$ ${Number(aluno.valor_hora).toFixed(2)} / aula`
                : 'Por aula (sem valor definido)'

          return (
            <li
              key={aluno.id}
              className="flex flex-col gap-1 rounded-md border border-black/10 px-4 py-3 dark:border-white/15"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{aluno.nome}</span>
                {!aluno.ativo && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
                    Inativo
                  </span>
                )}
              </div>
              <span className="text-sm text-black/60 dark:text-white/60">{valor}</span>
              {(aluno.email || aluno.telefone) && (
                <span className="text-sm text-black/60 dark:text-white/60">
                  {[aluno.email, aluno.telefone].filter(Boolean).join(' · ')}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
