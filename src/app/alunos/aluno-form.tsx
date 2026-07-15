'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { criarAluno, atualizarAluno, type CriarAlunoState } from './actions'

const initialState: CriarAlunoState = { submissionId: 0 }

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light'
const labelClass = 'text-sm font-medium text-foreground'

export type AlunoEditavel = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  telefone_responsavel: string | null
  data_nascimento: string | null
  bairro: string | null
  origem: string
  tipo_cobranca: string
  valor_mensalidade: number | null
  dia_vencimento: number | null
  observacoes: string | null
  ativo: boolean
}

function TipoCobrancaFields({
  inicial = 'por_aula',
  valorMensalidade,
  diaVencimento,
}: {
  inicial?: 'por_aula' | 'mensalista'
  valorMensalidade?: number | null
  diaVencimento?: number | null
}) {
  const [tipoCobranca, setTipoCobranca] = useState<'por_aula' | 'mensalista'>(inicial)

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
        <p className="text-sm text-muted">
          O valor de cada aula é definido na hora de marcá-la, na Agenda.
        </p>
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
              defaultValue={valorMensalidade ?? undefined}
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
              defaultValue={diaVencimento ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </>
  )
}

export function AlunoForm({
  aluno,
  onSaved,
}: {
  aluno?: AlunoEditavel
  onSaved?: () => void
}) {
  const action = useMemo(
    () => (aluno ? atualizarAluno.bind(null, aluno.id) : criarAluno),
    [aluno]
  )
  const [state, formAction, pending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const editando = Boolean(aluno)

  useEffect(() => {
    if (!state.success) return
    if (editando) {
      onSaved?.()
    } else {
      formRef.current?.reset()
    }
  }, [state.success, state.submissionId, editando, onSaved])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className={labelClass}>
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={aluno?.nome}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={aluno?.email ?? undefined}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="telefone" className={labelClass}>
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            placeholder="(DDD) 99999-9999"
            defaultValue={aluno?.telefone ?? undefined}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="telefone_responsavel" className={labelClass}>
          Telefone do responsável
        </label>
        <input
          id="telefone_responsavel"
          name="telefone_responsavel"
          type="tel"
          placeholder="(DDD) 99999-9999 — usado na confirmação quando o aluno não tem telefone"
          defaultValue={aluno?.telefone_responsavel ?? undefined}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data_nascimento" className={labelClass}>
            Data de nascimento
          </label>
          <input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={aluno?.data_nascimento ?? undefined}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bairro" className={labelClass}>
            Bairro
          </label>
          <input
            id="bairro"
            name="bairro"
            type="text"
            defaultValue={aluno?.bairro ?? undefined}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>Origem do aluno</legend>
        <div className="flex gap-4 text-sm text-foreground">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="origem"
              value="sophia"
              defaultChecked={aluno?.origem !== 'andre'}
              className="accent-primary"
            />
            Sophia (própria)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="origem"
              value="andre"
              defaultChecked={aluno?.origem === 'andre'}
              className="accent-primary"
            />
            Indicação do André
          </label>
        </div>
      </fieldset>

      <TipoCobrancaFields
        key={state.submissionId}
        inicial={aluno?.tipo_cobranca === 'mensalista' ? 'mensalista' : 'por_aula'}
        valorMensalidade={aluno?.valor_mensalidade}
        diaVencimento={aluno?.dia_vencimento}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="observacoes" className={labelClass}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={aluno?.observacoes ?? undefined}
          className={inputClass}
        />
      </div>

      {editando && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={aluno?.ativo}
            className="accent-primary"
          />
          Aluno ativo (aparece na Agenda para marcar aulas)
        </label>
      )}

      {state.error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state.success && !editando && (
        <p className="rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-dark">
          Aluno cadastrado com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar aluno'}
      </button>
    </form>
  )
}
