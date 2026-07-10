'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Home,
  Users,
  CalendarDays,
  Wallet,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  Monitor,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FinanceVisibilityProvider, useFinanceVisibility } from '@/lib/finance-visibility'
import { ViewModeProvider, useViewMode } from '@/lib/view-mode'

const navItems = [
  { href: '/', label: 'Visão Geral', curto: 'Visão', icon: Home },
  { href: '/aulas', label: 'Gestão de Aulas', curto: 'Aulas', icon: CalendarDays },
  { href: '/financeiro', label: 'Financeiro', curto: 'Financeiro', icon: Wallet },
  { href: '/alunos', label: 'Cadastro de Alunos', curto: 'Alunos', icon: Users },
]

function useRotaAtiva(href: string) {
  const pathname = usePathname()
  return href === '/' ? pathname === '/' : Boolean(pathname?.startsWith(href))
}

function NavLink({ href, label, icon: Icon }: (typeof navItems)[number]) {
  const ativo = useRotaAtiva(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        ativo
          ? 'bg-primary-accent text-foreground'
          : 'text-foreground/70 hover:bg-surface-muted hover:text-foreground'
      }`}
    >
      <Icon size={16} strokeWidth={2.25} />
      {label}
    </Link>
  )
}

function BottomLink({ href, curto, icon: Icon }: (typeof navItems)[number]) {
  const ativo = useRotaAtiva(href)

  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors ${
        ativo ? 'bg-primary-light text-primary-dark' : 'text-muted hover:text-foreground'
      }`}
    >
      <Icon size={18} strokeWidth={2.25} />
      {curto}
    </Link>
  )
}

function FinanceToggle({ compacto = false }: { compacto?: boolean }) {
  const { visivel, alternar } = useFinanceVisibility()

  return (
    <button
      onClick={alternar}
      title={visivel ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
    >
      {visivel ? <Eye size={15} /> : <EyeOff size={15} />}
      {!compacto && (
        <span className="hidden sm:inline">
          {visivel ? 'Valores visíveis' : 'Valores ocultos'}
        </span>
      )}
    </button>
  )
}

function ViewToggle() {
  const { modo, alternar } = useViewMode()
  const mobile = modo === 'mobile'

  return (
    <button
      onClick={alternar}
      title={mobile ? 'Versão desktop' : 'Versão celular'}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
    >
      {mobile ? <Monitor size={15} /> : <Smartphone size={15} />}
    </button>
  )
}

function TopBar({ email, onLogout }: { email: string | null; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap size={22} strokeWidth={2.25} />
          <span className="text-base font-semibold text-foreground">Gestão de Aulas</span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <FinanceToggle />
          <ViewToggle />
          {email && <span className="hidden text-xs text-muted xl:inline">{email}</span>}
          <button
            onClick={onLogout}
            title="Sair"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-danger-light hover:text-danger"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function MobileTopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap size={20} strokeWidth={2.25} />
          <span className="text-sm font-semibold text-foreground">Gestão de Aulas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FinanceToggle compacto />
          <ViewToggle />
          <button
            onClick={onLogout}
            title="Sair"
            className="flex items-center rounded-full border border-border bg-surface px-3 py-2 text-muted transition-colors hover:border-danger hover:text-danger"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-stretch gap-1 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => (
          <BottomLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  )
}

function Shell({
  email,
  onLogout,
  children,
}: {
  email: string | null
  onLogout: () => void
  children: ReactNode
}) {
  const { modo } = useViewMode()
  const mobile = modo === 'mobile'

  return (
    <>
      {mobile ? <MobileTopBar onLogout={onLogout} /> : <TopBar email={email} onLogout={onLogout} />}
      {/* @container faz os grids das páginas responderem à largura deste
          wrapper (container queries), não à do viewport — assim o modo
          celular colapsa tudo para uma coluna mesmo em telas largas. */}
      <div className={mobile ? '@container mx-auto w-full max-w-md pb-24' : '@container'}>
        {children}
      </div>
      {mobile && <BottomNav />}
    </>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'authed' | 'anon'>('checking')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'authed' : 'anon')
      setEmail(data.session?.user.email ?? null)
      if (!data.session) router.replace('/login')
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      if (!session) {
        setStatus('anon')
        router.replace('/login')
      } else {
        setStatus('authed')
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  if (status !== 'authed') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">Verificando login...</p>
      </div>
    )
  }

  return (
    <FinanceVisibilityProvider>
      <ViewModeProvider>
        <Shell email={email} onLogout={handleLogout}>
          {children}
        </Shell>
      </ViewModeProvider>
    </FinanceVisibilityProvider>
  )
}
