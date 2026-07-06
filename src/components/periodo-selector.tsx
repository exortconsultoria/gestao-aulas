'use client'

import { useState } from 'react'

export type Periodo = { inicio: string; fim: string }
export type TipoPeriodo = 'hoje' | 'semana' | 'mes' | 'custom'

export function fmtISO(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function periodoHoje(): Periodo {
  const hoje = fmtISO(new Date())
  return { inicio: hoje, fim: hoje }
}

export function periodoSemana(): Periodo {
  const agora = new Date()
  const diaSemana = (agora.getDay() + 6) % 7 // segunda = 0
  const inicio = new Date(agora)
  inicio.setDate(agora.getDate() - diaSemana)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  return { inicio: fmtISO(inicio), fim: fmtISO(fim) }
}

export function periodoMes(): Periodo {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
  return { inicio: fmtISO(inicio), fim: fmtISO(fim) }
}

const opcoes: { tipo: TipoPeriodo; label: string }[] = [
  { tipo: 'hoje', label: 'Hoje' },
  { tipo: 'semana', label: 'Esta semana' },
  { tipo: 'mes', label: 'Este mês' },
  { tipo: 'custom', label: 'Personalizado' },
]

const inputClass =
  'rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-primary'

export function PeriodoSelector({
  tipo,
  periodo,
  onChange,
}: {
  tipo: TipoPeriodo
  periodo: Periodo
  onChange: (tipo: TipoPeriodo, periodo: Periodo) => void
}) {
  const [customInicio, setCustomInicio] = useState(periodo.inicio)
  const [customFim, setCustomFim] = useState(periodo.fim)

  function selecionar(novoTipo: TipoPeriodo) {
    if (novoTipo === 'hoje') onChange('hoje', periodoHoje())
    else if (novoTipo === 'semana') onChange('semana', periodoSemana())
    else if (novoTipo === 'mes') onChange('mes', periodoMes())
    else onChange('custom', { inicio: customInicio, fim: customFim })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-fit rounded-full border border-border bg-surface p-0.5">
        {opcoes.map((opcao) => (
          <button
            key={opcao.tipo}
            onClick={() => selecionar(opcao.tipo)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              tipo === opcao.tipo
                ? 'bg-primary text-primary-contrast'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {opcao.label}
          </button>
        ))}
      </div>

      {tipo === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>De</span>
          <input
            type="date"
            value={customInicio}
            onChange={(e) => {
              setCustomInicio(e.target.value)
              if (e.target.value && customFim)
                onChange('custom', { inicio: e.target.value, fim: customFim })
            }}
            className={inputClass}
          />
          <span>até</span>
          <input
            type="date"
            value={customFim}
            onChange={(e) => {
              setCustomFim(e.target.value)
              if (customInicio && e.target.value)
                onChange('custom', { inicio: customInicio, fim: e.target.value })
            }}
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}
