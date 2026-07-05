'use client'

import { useFinanceVisibility } from '@/lib/finance-visibility'

function formatarBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ValorMonetario({
  valor,
  sufixo,
  className,
}: {
  valor: number
  sufixo?: string
  className?: string
}) {
  const { visivel } = useFinanceVisibility()

  return (
    <span className={className}>
      {visivel ? formatarBRL(valor) : 'R$ ••••'}
      {sufixo ?? ''}
    </span>
  )
}
