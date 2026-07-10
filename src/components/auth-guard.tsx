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
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  CircleUserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FinanceVisibilityProvider, useFinanceVisibility } from '@/lib/finance-visibility'
import { ViewModeProvider, useViewMode } from '@/lib/view-mode'

const SIDEBAR_STORAGE_KEY = 'gestao-aulas:menu-lateral'

const navItems = [
  { href: '/', label: 'Visão Geral', icon: Home },
  { href: '/aulas', label: 'Gestão de Aulas', icon: CalendarDays },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/alunos', label: 'Cadastro de Alunos', icon: Users },
]

function useRotaAtiva(href: string) {
  const pathname = usePathname()
  return href === '/' ? pathname === '/' : Boolean(pathname?.startsWith(href))
}

function nomeDoEmail(email: string | null) {
  const prefixo = email?.split(/[.@]/)[0] ?? ''
  return prefixo ? prefixo.charAt(0).toUpperCase() + prefixo.slice(1) : 'Usuária'
}

function classeItem(ativo: boolean, expandida: boolean) {
  return `flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors ${
    expandida ? 'px-3' : 'justify-center px-0'
  } ${
    ativo
      ? 'bg-primary-accent text-foreground'
      : 'text-foreground/70 hover:bg-surface-muted hover:text-foreground'
  }`
}

function SideLink({
  href,
  label,
  icon: Icon,
  expandida,
  onNavigate,
}: (typeof navItems)[number] & { expandida: boolean; onNavigate?: () => void }) {
  const ativo = useRotaAtiva(href)

  return (
    <Link
      href={href}
      title={expandida ? undefined : label}
      onClick={onNavigate}
      className={classeItem(ativo, expandida)}
    >
      <Icon size={18} strokeWidth={2.25} className="shrink-0" />
      {expandida && <span className="truncate">{label}</span>}
    </Link>
  )
}

function BotaoOlho({ fixo = false }: { fixo?: boolean }) {
  const { visivel, alternar } = useFinanceVisibility()

  return (
    <button
      onClick={alternar}
      title={visivel ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
      className={`${
        fixo ? 'card-shadow fixed right-6 top-8 z-20' : ''
      } flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary`}
    >
      {visivel ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  )
}

function ViewItem({ expandida }: { expandida: boolean }) {
  const { modo, alternar } = useViewMode()
  const mobile = modo === 'mobile'
  const label = mobile ? 'Versão desktop' : 'Versão celular'

  return (
    <button
      onClick={alternar}
      title={expandida ? undefined : label}
      className={classeItem(false, expandida)}
    >
      {mobile ? (
        <Monitor size={18} className="shrink-0" />
      ) : (
        <Smartphone size={18} className="shrink-0" />
      )}
      {expandida && <span className="truncate">{label}</span>}
    </button>
  )
}

function ConfigMenu({
  nome,
  onLogout,
  expandida,
}: {
  nome: string
  onLogout: () => void
  expandida: boolean
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        title={expandida ? undefined : 'Configurações'}
        className={classeItem(aberto, expandida)}
      >
        <Settings size={18} className="shrink-0" />
        {expandida && <span className="truncate">Configurações</span>}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAberto(false)} />
          <div
            className={`card-shadow absolute z-30 w-52 rounded-xl border border-border bg-surface p-1.5 ${
              expandida ? 'bottom-full left-0 mb-2' : 'bottom-0 left-full ml-2'
            }`}
          >
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground">
              <CircleUserRound size={17} className="shrink-0 text-primary" />
              {nome}
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-danger-light hover:text-danger"
            >
              <LogOut size={16} className="shrink-0" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ConteudoMenu({
  nome,
  onLogout,
  expandida,
  onNavigate,
}: {
  nome: string
  onLogout: () => void
  expandida: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 px-2 pt-2">
        {navItems.map((item) => (
          <SideLink key={item.href} {...item} expandida={expandida} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="flex flex-col gap-1 border-t border-border px-2 py-3">
        <ViewItem expandida={expandida} />
        <ConfigMenu nome={nome} onLogout={onLogout} expandida={expandida} />
      </div>
    </>
  )
}

function Sidebar({ nome, onLogout }: { nome: string; onLogout: () => void }) {
  const [expandida, setExpandida] = useState(true)

  useEffect(() => {
    // Lê a preferência salva; default expandida (bate com o HTML pré-gerado).
    const salvo = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo === 'recolhido') setExpandida(false)
  }, [])

  function alternar() {
    setExpandida((atual) => {
      const nova = !atual
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, nova ? 'expandido' : 'recolhido')
      return nova
    })
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 ${
        expandida ? 'w-60' : 'w-16'
      }`}
    >
      <div
        className={`flex items-center px-3 py-4 ${
          expandida ? 'justify-between' : 'flex-col gap-3'
        }`}
      >
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap size={22} strokeWidth={2.25} className="shrink-0" />
          {expandida && (
            <span className="truncate text-sm font-semibold text-foreground">
              Gestão de Aulas
            </span>
          )}
        </div>
        <button
          onClick={alternar}
          title={expandida ? 'Recolher menu' : 'Expandir menu'}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          {expandida ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      <ConteudoMenu nome={nome} onLogout={onLogout} expandida={expandida} />
    </aside>
  )
}

function MobileHeader({ nome, onLogout }: { nome: string; onLogout: () => void }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAberto(true)}
              title="Abrir menu"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap size={20} strokeWidth={2.25} />
              <span className="text-sm font-semibold text-foreground">Gestão de Aulas</span>
            </div>
          </div>
          <BotaoOlho />
        </div>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setAberto(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-4 text-primary">
              <GraduationCap size={22} strokeWidth={2.25} />
              <span className="text-sm font-semibold text-foreground">Gestão de Aulas</span>
            </div>
            <ConteudoMenu
              nome={nome}
              onLogout={onLogout}
              expandida
              onNavigate={() => setAberto(false)}
            />
          </aside>
        </div>
      )}
    </>
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
  const nome = nomeDoEmail(email)

  if (modo === 'mobile') {
    return (
      <>
        <MobileHeader nome={nome} onLogout={onLogout} />
        <div className="@container mx-auto w-full max-w-md pb-24">{children}</div>
      </>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar nome={nome} onLogout={onLogout} />
      {/* @container: os grids das páginas respondem à largura desta área,
          não do viewport — o modo celular colapsa tudo para uma coluna. */}
      <div className="@container min-w-0 flex-1 pb-24">
        {/* Olhinho na altura do cabeçalho das páginas, do lado direito */}
        <BotaoOlho fixo />
        {children}
      </div>
    </div>
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
