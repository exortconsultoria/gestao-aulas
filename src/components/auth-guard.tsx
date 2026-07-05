'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Home, Users, CalendarDays, Eye, EyeOff, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FinanceVisibilityProvider, useFinanceVisibility } from '@/lib/finance-visibility'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/aulas', label: 'Agenda', icon: CalendarDays },
]

function NavLink({ href, label, icon: Icon }: (typeof navItems)[number]) {
  const pathname = usePathname()
  const ativo = href === '/' ? pathname === '/' : pathname?.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        ativo
          ? 'bg-primary text-primary-contrast'
          : 'text-foreground/70 hover:bg-surface-muted hover:text-foreground'
      }`}
    >
      <Icon size={16} strokeWidth={2.25} />
      {label}
    </Link>
  )
}

function FinanceToggle() {
  const { visivel, alternar } = useFinanceVisibility()

  return (
    <button
      onClick={alternar}
      title={visivel ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
    >
      {visivel ? <Eye size={15} /> : <EyeOff size={15} />}
      <span className="hidden sm:inline">{visivel ? 'Valores visíveis' : 'Valores ocultos'}</span>
    </button>
  )
}

function TopBar({ email, onLogout }: { email: string | null; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap size={22} strokeWidth={2.25} />
          <span className="text-base font-semibold text-foreground">Gestão de Aulas</span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <FinanceToggle />
          {email && (
            <span className="hidden text-xs text-muted md:inline">{email}</span>
          )}
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
      <TopBar email={email} onLogout={handleLogout} />
      {children}
    </FinanceVisibilityProvider>
  )
}
