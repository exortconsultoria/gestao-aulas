'use client'

import type { ElementType } from 'react'

/** Botão de ação flutuante, redondo com efeito 3D (gradiente + relevo). */
export function BotaoFlutuante({
  icon: Icon,
  label,
  ativo = false,
  onClick,
}: {
  icon: ElementType
  label: string
  ativo?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-dark text-primary-contrast transition-all duration-150 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.25),0_10px_22px_rgba(31,42,36,0.35),0_4px_8px_rgba(31,42,36,0.25)] hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2),0_4px_10px_rgba(31,42,36,0.3)]"
    >
      <Icon
        size={24}
        strokeWidth={2.5}
        className={`transition-transform duration-200 ${ativo ? 'rotate-45' : ''}`}
      />
    </button>
  )
}
