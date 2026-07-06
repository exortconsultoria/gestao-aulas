'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  CalendarClock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { StatCard } from '@/components/stat-card'
import { ValorMonetario } from '@/components/valor-monetario'
import {
  PeriodoSelector,
  periodoMes,
  type Periodo,
  type TipoPeriodo,
} from '@/components/periodo-selector'

type Aula = {
  id: string
  data: string
  hora_inicio: string
  status: string
  valor: number | null
  // PostgREST retorna objeto (relação N:1); cast manual por falta de tipos gerados.
  aluno: { id: string; nome: string; bairro: string | null } | null
}

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function nomeMes(chave: string) {
  const [ano, mes] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
}

function BarraAnalise({
  rotulo,
  valor,
  pct,
}: {
  rotulo: string
  valor: number
  pct: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium text-foreground">{rotulo}</span>
        <ValorMonetario valor={valor} className="shrink-0 text-xs text-muted" />
      </div>
      <div className="h-2 rounded-full bg-surface-muted">
        <div
          className="h-2 rounded-full bg-primary-accent transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  )
}

function SecaoAnalise({
  titulo,
  historia,
  children,
}: {
  titulo: string
  historia: string | null
  children: React.ReactNode
}) {
  return (
    <section className="card-shadow flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
        {historia && <p className="mt-1 text-xs leading-relaxed text-muted">{historia}</p>}
      </div>
      {children}
    </section>
  )
}

function DashboardContent() {
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [aulas, setAulas] = useState<Aula[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoPeriodo>('mes')
  const [periodo, setPeriodo] = useState<Periodo>(periodoMes())

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email ?? ''
      const primeiroNome = email.split(/[.@]/)[0] ?? ''
      setNomeUsuario(
        primeiroNome ? primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1) : ''
      )
    })

    supabase
      .from('aulas')
      .select('id, data, hora_inicio, status, valor, aluno:alunos(id, nome, bairro)')
      .order('data')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setAulas(data as unknown as Aula[])
      })
  }, [])

  const analise = useMemo(() => {
    if (!aulas) return null

    const noPeriodo = aulas.filter((a) => a.data >= periodo.inicio && a.data <= periodo.fim)
    const produtivas = noPeriodo.filter((a) => a.status === 'agendada' || a.status === 'realizada')

    const receitaProjetada = produtivas.reduce((soma, a) => soma + Number(a.valor ?? 0), 0)
    const marcadas = noPeriodo.length
    const confirmadas = noPeriodo.filter((a) => a.status === 'realizada').length
    const canceladas = noPeriodo.filter(
      (a) => a.status === 'cancelada' || a.status === 'falta'
    ).length

    // Por aluno (no período)
    const porAluno = new Map<string, { nome: string; valor: number }>()
    for (const aula of produtivas) {
      if (!aula.aluno) continue
      const atual = porAluno.get(aula.aluno.id) ?? { nome: aula.aluno.nome, valor: 0 }
      atual.valor += Number(aula.valor ?? 0)
      porAluno.set(aula.aluno.id, atual)
    }
    const rankingAlunos = [...porAluno.values()].sort((a, b) => b.valor - a.valor).slice(0, 6)

    // Por bairro (no período)
    const porBairro = new Map<string, number>()
    let alunosSemBairro = 0
    for (const aula of produtivas) {
      if (!aula.aluno) continue
      const bairro = aula.aluno.bairro?.trim()
      if (!bairro) {
        alunosSemBairro++
        continue
      }
      porBairro.set(bairro, (porBairro.get(bairro) ?? 0) + Number(aula.valor ?? 0))
    }
    const rankingBairros = [...porBairro.entries()]
      .map(([bairro, valor]) => ({ bairro, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)

    // Por mês — últimos 6 meses (independente do período selecionado)
    const agora = new Date()
    const meses: { chave: string; valor: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      meses.push({ chave, valor: 0 })
    }
    for (const aula of aulas) {
      if (aula.status !== 'agendada' && aula.status !== 'realizada') continue
      const chave = aula.data.slice(0, 7)
      const mes = meses.find((m) => m.chave === chave)
      if (mes) mes.valor += Number(aula.valor ?? 0)
    }

    // Variação mensal (mês a mês, últimos 6)
    const variacoes: { chave: string; pct: number | null }[] = meses.map((mes, i) => {
      if (i === 0) return { chave: mes.chave, pct: null }
      const anterior = meses[i - 1].valor
      if (anterior === 0) return { chave: mes.chave, pct: null }
      return { chave: mes.chave, pct: ((mes.valor - anterior) / anterior) * 100 }
    })

    return {
      receitaProjetada,
      marcadas,
      confirmadas,
      canceladas,
      rankingAlunos,
      rankingBairros,
      alunosSemBairro,
      meses,
      variacoes,
    }
  }, [aulas, periodo])

  const historias = useMemo(() => {
    if (!analise) return null

    const totalAlunos = analise.rankingAlunos.reduce((s, a) => s + a.valor, 0)
    const top = analise.rankingAlunos[0]
    const historiaAlunos =
      top && totalAlunos > 0
        ? `${top.nome} concentra ${Math.round((top.valor / totalAlunos) * 100)}% da receita do período.`
        : 'Sem aulas com valor no período selecionado.'

    const topBairro = analise.rankingBairros[0]
    const historiaBairros = topBairro
      ? `${topBairro.bairro} é o bairro que mais gera receita no período.`
      : 'Cadastre o bairro dos alunos para desbloquear esta análise.'

    const melhorMes = [...analise.meses].sort((a, b) => b.valor - a.valor)[0]
    const historiaMeses =
      melhorMes && melhorMes.valor > 0
        ? `Seu melhor mês do semestre foi ${nomeMes(melhorMes.chave)}.`
        : 'Ainda não há receita registrada nos últimos 6 meses.'

    const ultimaVariacao = analise.variacoes[analise.variacoes.length - 1]
    const historiaVariacao =
      ultimaVariacao?.pct != null
        ? ultimaVariacao.pct >= 0
          ? `Sua receita cresceu ${ultimaVariacao.pct.toFixed(0)}% em relação ao mês anterior.`
          : `Sua receita caiu ${Math.abs(ultimaVariacao.pct).toFixed(0)}% em relação ao mês anterior.`
        : 'Sem base de comparação com o mês anterior ainda.'

    return { historiaAlunos, historiaBairros, historiaMeses, historiaVariacao }
  }, [analise])

  const maxAluno = Math.max(...(analise?.rankingAlunos.map((a) => a.valor) ?? [0]), 1)
  const maxBairro = Math.max(...(analise?.rankingBairros.map((b) => b.valor) ?? [0]), 1)
  const maxMes = Math.max(...(analise?.meses.map((m) => m.valor) ?? [0]), 1)

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">
          {saudacao()}
          {nomeUsuario ? `, ${nomeUsuario}` : ''}! Aqui está o retrato do seu negócio.
        </p>
      </div>

      <PeriodoSelector
        tipo={tipo}
        periodo={periodo}
        onChange={(novoTipo, novoPeriodo) => {
          setTipo(novoTipo)
          setPeriodo(novoPeriodo)
        }}
      />

      {erro && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro ao carregar dados: {erro}
        </p>
      )}

      {!erro && analise === null && <p className="text-sm text-muted">Carregando...</p>}

      {analise && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Receita projetada"
              value={<ValorMonetario valor={analise.receitaProjetada} />}
              hint="aulas marcadas e confirmadas"
            />
            <StatCard
              icon={CalendarClock}
              label="Aulas marcadas"
              value={String(analise.marcadas)}
              hint="todas no período"
            />
            <StatCard
              icon={CheckCircle2}
              label="Aulas confirmadas"
              value={String(analise.confirmadas)}
              hint="já realizadas"
            />
            <StatCard
              icon={XCircle}
              label="Aulas canceladas"
              value={String(analise.canceladas)}
              hint="inclui faltas"
              tone={analise.canceladas > 0 ? 'negative' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SecaoAnalise titulo="Receita por aluno" historia={historias?.historiaAlunos ?? null}>
              {analise.rankingAlunos.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma aula no período.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {analise.rankingAlunos.map((aluno) => (
                    <BarraAnalise
                      key={aluno.nome}
                      rotulo={aluno.nome}
                      valor={aluno.valor}
                      pct={(aluno.valor / maxAluno) * 100}
                    />
                  ))}
                </div>
              )}
            </SecaoAnalise>

            <SecaoAnalise titulo="Receita por bairro" historia={historias?.historiaBairros ?? null}>
              {analise.rankingBairros.length === 0 ? (
                <p className="text-sm text-muted">
                  Nenhum bairro registrado — preencha o campo Bairro no cadastro dos alunos.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {analise.rankingBairros.map((item) => (
                    <BarraAnalise
                      key={item.bairro}
                      rotulo={item.bairro}
                      valor={item.valor}
                      pct={(item.valor / maxBairro) * 100}
                    />
                  ))}
                </div>
              )}
            </SecaoAnalise>

            <SecaoAnalise titulo="Receita por mês" historia={historias?.historiaMeses ?? null}>
              <div className="flex h-32 items-end gap-2">
                {analise.meses.map((mes) => (
                  <div key={mes.chave} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-primary-accent transition-all"
                        style={{ height: `${Math.max((mes.valor / maxMes) * 100, 3)}%` }}
                        title={nomeMes(mes.chave)}
                      />
                    </div>
                    <span className="text-[11px] text-muted">{nomeMes(mes.chave)}</span>
                  </div>
                ))}
              </div>
            </SecaoAnalise>

            <SecaoAnalise
              titulo="Variação mensal"
              historia={historias?.historiaVariacao ?? null}
            >
              <div className="flex flex-col gap-2.5">
                {analise.variacoes.slice(1).map((variacao) => {
                  const Icone =
                    variacao.pct == null ? Minus : variacao.pct >= 0 ? TrendingUp : TrendingDown
                  const cor =
                    variacao.pct == null
                      ? 'text-muted'
                      : variacao.pct >= 0
                        ? 'text-primary'
                        : 'text-danger'
                  return (
                    <div
                      key={variacao.chave}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize text-foreground">{nomeMes(variacao.chave)}</span>
                      <span className={`flex items-center gap-1.5 font-medium ${cor}`}>
                        <Icone size={15} />
                        {variacao.pct == null
                          ? 'sem base'
                          : `${variacao.pct >= 0 ? '+' : ''}${variacao.pct.toFixed(0)}%`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </SecaoAnalise>
          </div>
        </>
      )}
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
