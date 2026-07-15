'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HandCoins, AlertCircle, PiggyBank, CheckCircle2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { StatCard } from '@/components/stat-card'
import { Skeleton, SkeletonGrid } from '@/components/skeleton'
import { ValorMonetario } from '@/components/valor-monetario'
import {
  PeriodoSelector,
  periodoMes,
  fmtISO,
  type Periodo,
  type TipoPeriodo,
} from '@/components/periodo-selector'
import {
  registrarRecebimentoAula,
  registrarRecebimentoMensalidade,
  excluirPagamento,
} from './actions'

type AlunoRec = {
  id: string
  nome: string
  tipo_cobranca: string
  valor_mensalidade: number | null
  dia_vencimento: number | null
  ativo: boolean
  created_at: string
}

type AulaRec = {
  id: string
  aluno_id: string
  data: string
  status: string
  valor: number | null
}

type Pagamento = {
  id: string
  aluno_id: string
  tipo: string
  referencia: string | null
  aula_id: string | null
  valor: number
  vencimento: string | null
  data_pagamento: string | null
  status: string
}

type ItemAReceber =
  | { tipo: 'aula'; aulaId: string; descricao: string; valor: number; referenciaData: string }
  | {
      tipo: 'mensalidade'
      referencia: string
      descricao: string
      valor: number
      vencimento: string
      referenciaData: string
    }

type GrupoAluno = { aluno: AlunoRec; itens: ItemAReceber[]; total: number }

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function nomeMesRef(referencia: string) {
  const [ano, mes] = referencia.split('-').map(Number)
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
  return `${nome}/${ano}`
}

function diasEntre(deISO: string, ateISO: string) {
  const [a1, m1, d1] = deISO.split('-').map(Number)
  const [a2, m2, d2] = ateISO.split('-').map(Number)
  const de = new Date(a1, m1 - 1, d1).getTime()
  const ate = new Date(a2, m2 - 1, d2).getTime()
  return Math.round((ate - de) / 86400000)
}

function mesesEntre(inicioYM: string, fimYM: string): string[] {
  const [anoI, mesI] = inicioYM.split('-').map(Number)
  const [anoF, mesF] = fimYM.split('-').map(Number)
  const meses: string[] = []
  let ano = anoI
  let mes = mesI
  while (ano < anoF || (ano === anoF && mes <= mesF)) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`)
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }
  return meses
}

function vencimentoDe(referencia: string, diaVencimento: number | null): string {
  const [ano, mes] = referencia.split('-').map(Number)
  const ultimoDia = new Date(ano, mes, 0).getDate()
  // Sem dia de vencimento definido, considera o fim do mês.
  const dia = Math.min(diaVencimento ?? ultimoDia, ultimoDia)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function LinhaPendencia({
  aluno,
  item,
  hoje,
  onDone,
}: {
  aluno: AlunoRec
  item: ItemAReceber
  hoje: string
  onDone: () => void
}) {
  const [salvando, setSalvando] = useState(false)

  let meta: { texto: string; vencida: boolean }
  if (item.tipo === 'aula') {
    const dias = diasEntre(item.referenciaData, hoje)
    meta = {
      texto: dias <= 0 ? 'aula de hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      vencida: dias > 14,
    }
  } else {
    const dias = diasEntre(item.vencimento, hoje)
    if (dias > 0) meta = { texto: `venceu há ${dias} ${dias === 1 ? 'dia' : 'dias'}`, vencida: true }
    else if (dias === 0) meta = { texto: 'vence hoje', vencida: false }
    else meta = { texto: `vence em ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, vencida: false }
  }

  async function receber() {
    setSalvando(true)
    if (item.tipo === 'aula') {
      await registrarRecebimentoAula({ alunoId: aluno.id, aulaId: item.aulaId, valor: item.valor })
    } else {
      await registrarRecebimentoMensalidade({
        alunoId: aluno.id,
        referencia: item.referencia,
        valor: item.valor,
        vencimento: item.vencimento,
      })
    }
    setSalvando(false)
    onDone()
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-foreground">{item.descricao}</span>
        <span className={`text-xs ${meta.vencida ? 'font-medium text-danger' : 'text-muted'}`}>
          {meta.texto}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ValorMonetario valor={item.valor} className="text-sm font-medium text-foreground" />
        <button
          onClick={receber}
          disabled={salvando}
          title="Registrar que este valor foi recebido"
          className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark transition-colors hover:bg-primary-accent/40 disabled:opacity-50"
        >
          <CheckCircle2 size={13} /> {salvando ? 'Salvando...' : 'Recebi'}
        </button>
      </div>
    </li>
  )
}

function RecebimentosContent() {
  const [alunos, setAlunos] = useState<AlunoRec[] | null>(null)
  const [aulas, setAulas] = useState<AulaRec[] | null>(null)
  const [pagamentos, setPagamentos] = useState<Pagamento[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoPeriodo>('mes')
  const [periodo, setPeriodo] = useState<Periodo>(periodoMes())

  const hoje = useMemo(() => fmtISO(new Date()), [])

  const fetchDados = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('alunos')
      .select('id, nome, tipo_cobranca, valor_mensalidade, dia_vencimento, ativo, created_at')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setAlunos(data as AlunoRec[])
      })
    supabase
      .from('aulas')
      .select('id, aluno_id, data, status, valor')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setAulas(data as AulaRec[])
      })
    supabase
      .from('pagamentos')
      .select('id, aluno_id, tipo, referencia, aula_id, valor, vencimento, data_pagamento, status')
      .order('data_pagamento', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setPagamentos(data as Pagamento[])
      })
  }, [])

  useEffect(() => {
    fetchDados()
  }, [fetchDados])

  const analise = useMemo(() => {
    if (!alunos || !aulas || !pagamentos) return null

    const pagos = pagamentos.filter((p) => p.status === 'pago')
    const aulasPagas = new Set(pagos.map((p) => p.aula_id).filter(Boolean))
    const mensalidadesPagas = new Set(
      pagos.filter((p) => p.tipo === 'mensalidade' && p.referencia).map(
        (p) => `${p.aluno_id}|${p.referencia}`
      )
    )
    const mesAtual = hoje.slice(0, 7)

    const grupos: GrupoAluno[] = []

    for (const aluno of alunos) {
      const itens: ItemAReceber[] = []
      const aulasDoAluno = aulas
        .filter((a) => a.aluno_id === aluno.id)
        .sort((a, b) => a.data.localeCompare(b.data))

      if (aluno.tipo_cobranca === 'mensalista' && aluno.valor_mensalidade != null) {
        // Cobrança esperada mês a mês, do início do vínculo até hoje (ou até
        // a última aula, se o aluno foi desativado).
        const primeiroMes = aulasDoAluno[0]?.data.slice(0, 7) ?? aluno.created_at.slice(0, 7)
        const ultimoMes = aluno.ativo
          ? mesAtual
          : (aulasDoAluno[aulasDoAluno.length - 1]?.data.slice(0, 7) ?? null)

        if (ultimoMes) {
          for (const mes of mesesEntre(primeiroMes, ultimoMes)) {
            if (mensalidadesPagas.has(`${aluno.id}|${mes}`)) continue
            itens.push({
              tipo: 'mensalidade',
              referencia: mes,
              descricao: `Mensalidade de ${nomeMesRef(mes)}`,
              valor: Number(aluno.valor_mensalidade),
              vencimento: vencimentoDe(mes, aluno.dia_vencimento),
              referenciaData: `${mes}-01`,
            })
          }
        }
      } else {
        // Cobrança por aula: toda aula realizada com valor e sem pagamento.
        for (const aula of aulasDoAluno) {
          if (aula.status !== 'realizada') continue
          if (aula.valor == null || Number(aula.valor) <= 0) continue
          if (aulasPagas.has(aula.id)) continue
          itens.push({
            tipo: 'aula',
            aulaId: aula.id,
            descricao: `Aula de ${formatarData(aula.data)}`,
            valor: Number(aula.valor),
            referenciaData: aula.data,
          })
        }
      }

      if (itens.length > 0) {
        itens.sort((a, b) => a.referenciaData.localeCompare(b.referenciaData))
        grupos.push({
          aluno,
          itens,
          total: itens.reduce((s, i) => s + i.valor, 0),
        })
      }
    }

    grupos.sort((a, b) => b.total - a.total)

    const totalAReceber = grupos.reduce((s, g) => s + g.total, 0)
    const vencidas = grupos.flatMap((g) =>
      g.itens.filter((i) => i.tipo === 'mensalidade' && diasEntre(i.vencimento, hoje) > 0)
    )
    const totalVencido = vencidas.reduce((s, i) => s + i.valor, 0)

    const recebidosPeriodo = pagos
      .filter(
        (p) =>
          p.data_pagamento && p.data_pagamento >= periodo.inicio && p.data_pagamento <= periodo.fim
      )
      .sort((a, b) => (b.data_pagamento ?? '').localeCompare(a.data_pagamento ?? ''))
    const totalRecebidoPeriodo = recebidosPeriodo.reduce((s, p) => s + Number(p.valor), 0)

    const maisAntiga = grupos
      .flatMap((g) => g.itens.map((i) => ({ nome: g.aluno.nome, item: i })))
      .sort((a, b) => a.item.referenciaData.localeCompare(b.item.referenciaData))[0]

    return {
      grupos,
      totalAReceber,
      vencidas,
      totalVencido,
      recebidosPeriodo,
      totalRecebidoPeriodo,
      maisAntiga,
    }
  }, [alunos, aulas, pagamentos, hoje, periodo])

  const nomePorAluno = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const aluno of alunos ?? []) mapa.set(aluno.id, aluno.nome)
    return mapa
  }, [alunos])

  async function handleExcluirPagamento(id: string) {
    if (!window.confirm('Excluir este recebimento? O valor volta para "a receber".')) return
    await excluirPagamento(id)
    fetchDados()
  }

  function descricaoPagamento(pagamento: Pagamento) {
    if (pagamento.tipo === 'mensalidade' && pagamento.referencia)
      return `Mensalidade de ${nomeMesRef(pagamento.referencia)}`
    const aula = aulas?.find((a) => a.id === pagamento.aula_id)
    return aula ? `Aula de ${formatarData(aula.data)}` : 'Recebimento avulso'
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recebimentos</h1>
        <p className="mt-1 text-sm text-muted">
          {analise === null ? (
            'Tudo que você tem a receber e tudo que já entrou.'
          ) : analise.totalAReceber === 0 ? (
            'Tudo em dia: nenhum valor pendente. 🎉'
          ) : (
            <>
              Você tem <ValorMonetario valor={analise.totalAReceber} /> a receber de{' '}
              {analise.grupos.length}{' '}
              {analise.grupos.length === 1 ? 'aluno' : 'alunos'}
              {analise.vencidas.length > 0 && (
                <>
                  {' — '}
                  <span className="font-medium text-danger">
                    {analise.vencidas.length}{' '}
                    {analise.vencidas.length === 1
                      ? 'mensalidade vencida'
                      : 'mensalidades vencidas'}
                  </span>
                </>
              )}
              .
            </>
          )}
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
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">Erro: {erro}</p>
      )}

      {!erro && analise === null && (
        <>
          <SkeletonGrid
            cards={3}
            cardClassName="h-24"
            gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
          />
          <Skeleton className="h-64" />
        </>
      )}

      {analise && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={HandCoins}
              label="A receber"
              value={<ValorMonetario valor={analise.totalAReceber} />}
              hint="aulas realizadas + mensalidades (independe do período)"
            />
            <StatCard
              icon={AlertCircle}
              label="Vencido"
              value={<ValorMonetario valor={analise.totalVencido} />}
              hint="mensalidades após o vencimento"
              tone={analise.totalVencido > 0 ? 'negative' : 'default'}
            />
            <StatCard
              icon={PiggyBank}
              label="Recebido no período"
              value={<ValorMonetario valor={analise.totalRecebidoPeriodo} />}
              hint={`${analise.recebidosPeriodo.length} ${analise.recebidosPeriodo.length === 1 ? 'recebimento' : 'recebimentos'}`}
            />
          </div>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">A receber</h2>
              <p className="mt-0.5 text-xs text-muted">
                {analise.grupos.length === 0
                  ? 'Nenhuma pendência — todos os alunos estão em dia.'
                  : analise.maisAntiga
                    ? `A pendência mais antiga é de ${analise.maisAntiga.nome} (${analise.maisAntiga.item.descricao.toLowerCase()}).`
                    : ''}
              </p>
            </div>

            {analise.grupos.length === 0 ? (
              <div className="card-shadow rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                <p className="text-sm text-muted">Nada a receber no momento. 🎉</p>
              </div>
            ) : (
              analise.grupos.map((grupo) => (
                <div
                  key={grupo.aluno.id}
                  className="card-shadow rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{grupo.aluno.nome}</span>
                    <ValorMonetario
                      valor={grupo.total}
                      className="text-sm font-semibold text-primary"
                    />
                  </div>
                  <ul className="divide-y divide-border">
                    {grupo.itens.map((item) => (
                      <LinhaPendencia
                        key={item.tipo === 'aula' ? item.aulaId : item.referencia}
                        aluno={grupo.aluno}
                        item={item}
                        hoje={hoje}
                        onDone={fetchDados}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recebidos no período</h2>
              <p className="mt-0.5 text-xs text-muted">
                {analise.recebidosPeriodo.length === 0 ? (
                  'Nenhum recebimento no período selecionado.'
                ) : (
                  <>
                    {analise.recebidosPeriodo.length}{' '}
                    {analise.recebidosPeriodo.length === 1 ? 'recebimento' : 'recebimentos'}{' '}
                    somando <ValorMonetario valor={analise.totalRecebidoPeriodo} />.
                  </>
                )}
              </p>
            </div>

            {analise.recebidosPeriodo.length > 0 && (
              <div className="card-shadow rounded-2xl border border-border bg-surface p-5">
                <ul className="divide-y divide-border">
                  {analise.recebidosPeriodo.map((pagamento) => (
                    <li
                      key={pagamento.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {nomePorAluno.get(pagamento.aluno_id) ?? 'Aluno removido'}
                        </span>
                        <span className="text-xs text-muted">
                          {descricaoPagamento(pagamento)}
                          {pagamento.data_pagamento &&
                            ` · recebido em ${formatarData(pagamento.data_pagamento)}`}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ValorMonetario
                          valor={Number(pagamento.valor)}
                          className="text-sm font-medium text-foreground"
                        />
                        <button
                          onClick={() => handleExcluirPagamento(pagamento.id)}
                          title="Excluir recebimento (desfaz)"
                          className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger-light hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default function RecebimentosPage() {
  return (
    <AuthGuard>
      <RecebimentosContent />
    </AuthGuard>
  )
}
