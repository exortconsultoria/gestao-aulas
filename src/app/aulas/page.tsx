import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AulaForm } from './aula-form'

const statusLabel: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  falta: 'Falta',
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

type AulaComAluno = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string | null
  status: string
  valor: number | null
  // PostgREST retorna objeto (relação N:1), não array — supabase-js sem
  // tipos gerados infere array por padrão; o shape real em runtime é objeto.
  aluno: { nome: string } | null
}

export default async function AulasPage() {
  const supabase = await createClient()

  const [{ data: alunos, error: erroAlunos }, { data: aulas, error: erroAulas }] =
    await Promise.all([
      supabase.from('alunos').select('id, nome').eq('ativo', true).order('nome'),
      supabase
        .from('aulas')
        .select('id, data, hora_inicio, hora_fim, status, valor, aluno:alunos(nome)')
        .order('data')
        .order('hora_inicio') as unknown as Promise<{
        data: AulaComAluno[] | null
        error: { message: string } | null
      }>,
    ])

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agenda de aulas</h1>
        <Link href="/alunos" className="text-sm underline">
          Ver alunos
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Marcar aula</h2>
        {erroAlunos && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            Erro ao carregar alunos: {erroAlunos.message}
          </p>
        )}
        {!erroAlunos && <AulaForm alunos={alunos ?? []} />}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Aulas marcadas</h2>
        {erroAulas && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            Erro ao carregar aulas: {erroAulas.message}
          </p>
        )}
        {!erroAulas && aulas?.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Nenhuma aula marcada ainda.</p>
        )}
        <ul className="flex flex-col gap-2">
          {aulas?.map((aula) => (
            <li
              key={aula.id}
              className="flex items-center justify-between rounded-md border border-black/10 px-4 py-3 dark:border-white/15"
            >
              <div className="flex flex-col">
                <span className="font-medium">{aula.aluno?.nome ?? 'Aluno removido'}</span>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {formatarData(aula.data)} às {aula.hora_inicio?.slice(0, 5)}
                  {aula.hora_fim ? ` – ${aula.hora_fim.slice(0, 5)}` : ''}
                  {aula.valor != null ? ` · R$ ${Number(aula.valor).toFixed(2)}` : ''}
                </span>
              </div>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
                {statusLabel[aula.status] ?? aula.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
