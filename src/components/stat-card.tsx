'use client'

import type { ElementType, ReactNode } from 'react'

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: ElementType
  label: string
  value: ReactNode
  hint?: string
  tone?: 'default' | 'positive' | 'negative'
}) {
  const iconTone =
    tone === 'negative'
      ? 'bg-danger-light text-danger'
      : 'bg-primary-light text-primary'

  return (
    <div className="card-shadow flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
      >
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="truncate text-lg font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {hint && <span className="mt-0.5 text-[11px] leading-tight text-muted">{hint}</span>}
      </div>
    </div>
  )
}
