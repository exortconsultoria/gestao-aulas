'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarPlus, CheckCircle2, XCircle, UserX, Undo2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { ValorMonetario } from '@/components/valor-monetario'
import { AulaForm } from './aula-form'
import { atualizarStatusAula, type StatusAula } from './actions'

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

type Aluno = { id: string; nome: string }

type AulaComAluno = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string | null
  status: StatusAula
  valor: number | null
  // PostgREST retorna objeto (relação N:1), não array — supabase-js sem
  // tipos gerados infere array por padrão; o shape real em runtime é objeto.
  aluno: { nome: string } | null
}

const colunas: { status: StatusAula; titulo: string; corBarra: string }[] = [
  { status: 'agendada', titulo: 'Agendada', corBarra: 'bg-primary-accent' },
  { status: 'realizada', titulo: 'Realizada', corBarra: 'bg-muted' },
  { status: 'cancelada', titulo: 'Cancelada', corBarra: 'bg-danger' },
  { status: 'falta', titulo: 'Falta', corBarra: 'bg-danger' },
]

function AulaCard({ aula, onChange }: { aula: AulaComAluno; onChange: () => void }) {
  const [salvando, setSalvando] = useState(false)

  async function mudarStatus(status: StatusAula) {
    setSalvando(true)
    await atualizarStatusAula(aula.id, status)
    setSalvando(false)
    onChange()
  }

  return (
    <li className="card-shadow card-shadow-hover flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <span className="font-semibold text-foreground">{aula.aluno?.nome ?? 'Aluno removido'}</span>
      <span className="text-xs text-muted">
        {formatarData(aula.data)} às {aula.hora_inicio?.slice(0, 5)}
        {aula.hora_fim ? ` – ${aula.hora_fim.slice(0, 5)}` : ''}
      </span>
      {aula.valor != null && (
        <ValorMonetario valor={Number(aula.valor)} className="text-xs font-medium text-primary" />
      )}

      <div className="mt-1 flex flex-wrap gap-1.5 border-t border-border pt-2">
        {aula.status === 'agendada' ? (
          <>
            <button
              disabled={salvando}
              onClick={() => mudarStatus('realizada')}
              title="Marcar como realizada"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-primary-light hover:text-primary-dark disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> Realizada
            </button>
            <button
              disabled={salvando}
              onClick={() => mudarStatus('falta')}
              title="Marcar falta do aluno"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
            >
              <UserX size={13} /> Falta
            </button>
            <button
              disabled={salvando}
              onClick={() => mudarStatus('cancelada')}
              title="Cancelar aula"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
            >
              <XCircle size={13} /> Cancelar
            </button>
          </>
        ) : (
          <button
            disabled={salvando}
            onClick={() => mudarStatus('agendada')}
            title="Reabrir aula"
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            <Undo2 size={13} /> Reabrir
          </button>
        )}
      </div>
    </li>
  )
}

function AulasContent() {
  const [alunos, setAlunos] = useState<Aluno[] | null>(null)
  const [erroAlunos, setErroAlunos] = useState<string | null>(null)
  const [aulas, setAulas] = useState<AulaComAluno[] | null>(null)
  const [erroAulas, setErroAulas] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const fetchAulas = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('aulas')
      .select('id, data, hora_inicio, hora_fim, status, valor, aluno:alunos(nome)')
      .order('data')
      .order('hora_inicio')
      .then(({ data, error }) => {
        if (error) setErroAulas(error.message)
        else setAulas(data as unknown as AulaComAluno[])
      })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('alunos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data, error }) => {
        if (error) setErroAlunos(error.message)
        else setAlunos(data)
      })
    fetchAulas()
  }, [fetchAulas])

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda de aulas</h1>
          <p className="mt-1 text-sm text-muted">
            Acompanhe e organize suas aulas como um quadro de tarefas.
          </p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark"
        >
          <CalendarPlus size={16} />
          {mostrarForm ? 'Fechar formulário' : 'Marcar aula'}
        </button>
      </div>

      {erroAlunos && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro ao carregar alunos: {erroAlunos}
        </p>
      )}

      {mostrarForm && !erroAlunos && alunos !== null && (
        <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
          <AulaForm
            alunos={alunos}
            onCreated={() => {
              fetchAulas()
              setMostrarForm(false)
            }}
          />
        </div>
      )}

      {erroAulas && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro ao carregar aulas: {erroAulas}
        </p>
      )}

      {aulas === null && !erroAulas && <p className="text-sm text-muted">Carregando...</p>}

      {aulas !== null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colunas.map((coluna) => {
            const itens = aulas.filter((a) => a.status === coluna.status)
            return (
              <div key={coluna.status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${coluna.corBarra}`} />
                  <h2 className="text-sm font-semibold text-foreground">{coluna.titulo}</h2>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                    {itens.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-3">
                  {itens.length === 0 && (
                    <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                      Nenhuma aula
                    </li>
                  )}
                  {itens.map((aula) => (
                    <AulaCard key={aula.id} aula={aula} onChange={fetchAulas} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default function AulasPage() {
  return (
    <AuthGuard>
      <AulasContent />
    </AuthGuard>
  )
}
