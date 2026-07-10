'use client'

import { useActionState, useEffect, useRef } from 'react'
import { criarAula, type CriarAulaState } from './actions'

const initialState: CriarAulaState = { submissionId: 0 }

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light'
const labelClass = 'text-sm font-medium text-foreground'

type Aluno = { id: string; nome: string }

export function AulaForm({ alunos, onCreated }: { alunos: Aluno[]; onCreated?: () => void }) {
  const [state, formAction, pending] = useActionState(criarAula, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      onCreated?.()
    }
  }, [state.success, onCreated])

  if (alunos.length === 0) {
    return (
      <p className="text-sm text-muted">Cadastre um aluno antes de marcar aulas.</p>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="aluno_id" className={labelClass}>
          Aluno *
        </label>
        <select id="aluno_id" name="aluno_id" required className={inputClass}>
          <option value="">Selecione...</option>
          {alunos.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data" className={labelClass}>
            Data *
          </label>
          <input id="data" name="data" type="date" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hora_inicio" className={labelClass}>
            Início *
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hora_fim" className={labelClass}>
            Fim
          </label>
          <input id="hora_fim" name="hora_fim" type="time" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="valor" className={labelClass}>
          Valor da aula (R$)
        </label>
        <input
          id="valor"
          name="valor"
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="observacoes" className={labelClass}>
          Observações
        </label>
        <textarea id="observacoes" name="observacoes" rows={2} className={inputClass} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-dark">
          Aula marcada com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Marcar aula'}
      </button>
    </form>
  )
}
