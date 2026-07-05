'use client'

import { useEffect, useState, type ElementType } from 'react'
import Link from 'next/link'
import { Users, CalendarClock, CalendarPlus, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'

type ProximaAula = {
  data: string
  hora_inicio: string
  aluno: { nome: string } | null
}

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className="card-shadow flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-lg font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}

function DashboardContent() {
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [totalAlunos, setTotalAlunos] = useState<number | null>(null)
  const [totalAgendadas, setTotalAgendadas] = useState<number | null>(null)
  const [proximaAula, setProximaAula] = useState<ProximaAula | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email ?? ''
      setNomeUsuario(email.split('@')[0] ?? '')
    })

    supabase
      .from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true)
      .then(({ count }) => setTotalAlunos(count ?? 0))

    const hoje = new Date().toISOString().slice(0, 10)

    supabase
      .from('aulas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'agendada')
      .gte('data', hoje)
      .then(({ count }) => setTotalAgendadas(count ?? 0))

    supabase
      .from('aulas')
      .select('data, hora_inicio, aluno:alunos(nome)')
      .eq('status', 'agendada')
      .gte('data', hoje)
      .order('data')
      .order('hora_inicio')
      .limit(1)
      .then(({ data }) => {
        const linha = (data as unknown as ProximaAula[] | null)?.[0]
        setProximaAula(linha ?? null)
      })
  }, [])

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {saudacao()}
          {nomeUsuario ? `, ${nomeUsuario}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-muted">
          Aqui está um resumo do que está acontecendo nas suas aulas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Alunos ativos"
          value={totalAlunos === null ? '...' : String(totalAlunos)}
        />
        <StatCard
          icon={CalendarClock}
          label="Aulas agendadas"
          value={totalAgendadas === null ? '...' : String(totalAgendadas)}
        />
        <StatCard
          icon={CalendarClock}
          label="Próxima aula"
          value={
            proximaAula === undefined
              ? '...'
              : proximaAula === null
                ? 'Nenhuma'
                : `${formatarData(proximaAula.data)} · ${proximaAula.hora_inicio.slice(0, 5)}`
          }
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/alunos/novo"
            className="card-shadow card-shadow-hover flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
          >
            <UserPlus size={18} className="text-primary" />
            Cadastrar aluno
          </Link>
          <Link
            href="/aulas"
            className="card-shadow card-shadow-hover flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
          >
            <CalendarPlus size={18} className="text-primary" />
            Marcar aula
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
