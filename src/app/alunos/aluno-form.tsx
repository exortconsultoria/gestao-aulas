'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { criarAluno, type CriarAlunoState } from './actions'

const initialState: CriarAlunoState = { submissionId: 0 }

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light'
const labelClass = 'text-sm font-medium text-foreground'

function TipoCobrancaFields() {
  const [tipoCobranca, setTipoCobranca] = useState<'por_aula' | 'mensalista'>('por_aula')

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>Tipo de cobrança</legend>
        <div className="flex gap-4 text-sm text-foreground">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo_cobranca"
              value="por_aula"
              checked={tipoCobranca === 'por_aula'}
              onChange={() => setTipoCobranca('por_aula')}
              className="accent-primary"
            />
            Por aula
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo_cobranca"
              value="mensalista"
              checked={tipoCobranca === 'mensalista'}
              onChange={() => setTipoCobranca('mensalista')}
              className="accent-primary"
            />
            Mensalista
          </label>
        </div>
      </fieldset>

      {tipoCobranca === 'por_aula' ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="valor_hora" className={labelClass}>
            Valor por aula (R$)
          </label>
          <input
            id="valor_hora"
            name="valor_hora"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="valor_mensalidade" className={labelClass}>
              Valor da mensalidade (R$)
            </label>
            <input
              id="valor_mensalidade"
              name="valor_mensalidade"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dia_vencimento" className={labelClass}>
              Dia de vencimento
            </label>
            <input
              id="dia_vencimento"
              name="dia_vencimento"
              type="number"
              min="1"
              max="31"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </>
  )
}

export function AlunoForm() {
  const [state, formAction, pending] = useActionState(criarAluno, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className={labelClass}>
          Nome *
        </label>
        <input id="nome" name="nome" type="text" required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="telefone" className={labelClass}>
            Telefone
          </label>
          <input id="telefone" name="telefone" type="tel" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="data_nascimento" className={labelClass}>
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          className={inputClass}
        />
      </div>

      <TipoCobrancaFields key={state.submissionId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="observacoes" className={labelClass}>
          Observações
        </label>
        <textarea id="observacoes" name="observacoes" rows={3} className={inputClass} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-dark">
          Aluno cadastrado com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Cadastrar aluno'}
      </button>
    </form>
  )
}
