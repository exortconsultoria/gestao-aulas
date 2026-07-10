'use client'

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Wallet,
  PiggyBank,
  HandCoins,
  Receipt,
  ReceiptText,
  Percent,
  Plus,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { BotaoFlutuante } from '@/components/botao-flutuante'
import { StatCard } from '@/components/stat-card'
import { Skeleton, SkeletonGrid } from '@/components/skeleton'
import { ValorMonetario } from '@/components/valor-monetario'
import {
  PeriodoSelector,
  periodoMes,
  type Periodo,
  type TipoPeriodo,
} from '@/components/periodo-selector'
import {
  criarCusto,
  excluirCusto,
  categoriasCusto,
  type CategoriaCusto,
  type CriarCustoState,
} from './actions'

type Aula = { id: string; data: string; status: string; valor: number | null }

type Custo = {
  id: string
  data: string
  categoria: CategoriaCusto
  descricao: string | null
  valor: number
}

const labelCategoria = Object.fromEntries(
  categoriasCusto.map((c) => [c.valor, c.label])
) as Record<CategoriaCusto, string>

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light'
const labelClass = 'text-sm font-medium text-foreground'

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const initialCustoState: CriarCustoState = { submissionId: 0 }

function CustoForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(criarCusto, initialCustoState)
  const formRef = useRef<HTMLFormElement>(null)
  const [categoria, setCategoria] = useState<CategoriaCusto>('aula_perdida')

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      onCreated()
    }
  }, [state.success, state.submissionId, onCreated])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data" className={labelClass}>
            Data *
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className={labelClass}>
            Categoria *
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaCusto)}
            className={inputClass}
          >
            {categoriasCusto.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="valor" className={labelClass}>
            Valor (R$) *
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descricao" className={labelClass}>
          Nome do custo *
        </label>
        <input
          id="descricao"
          name="descricao"
          type="text"
          required
          placeholder="Ex.: corrida até a aula da Maria"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-dark">
          Custo registrado com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Registrar custo'}
      </button>
    </form>
  )
}

function FinanceiroContent() {
  const [aulas, setAulas] = useState<Aula[] | null>(null)
  const [custos, setCustos] = useState<Custo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoPeriodo>('mes')
  const [periodo, setPeriodo] = useState<Periodo>(periodoMes())
  const [mostrarForm, setMostrarForm] = useState(false)

  const fetchDados = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('aulas')
      .select('id, data, status, valor')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setAulas(data as Aula[])
      })
    supabase
      .from('custos')
      .select('id, data, categoria, descricao, valor')
      .order('data', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setCustos(data as Custo[])
      })
  }, [])

  useEffect(() => {
    fetchDados()
  }, [fetchDados])

  const resumo = useMemo(() => {
    if (!aulas || !custos) return null

    const aulasPeriodo = aulas.filter((a) => a.data >= periodo.inicio && a.data <= periodo.fim)
    const custosPeriodo = custos.filter(
      (c) => c.data >= periodo.inicio && c.data <= periodo.fim
    )

    const somaAulas = (filtro: (a: Aula) => boolean) =>
      aulasPeriodo.filter(filtro).reduce((s, a) => s + Number(a.valor ?? 0), 0)

    const valorProjetado = somaAulas((a) => a.status === 'agendada' || a.status === 'realizada')
    const valorRecebido = somaAulas((a) => a.status === 'realizada')
    const valorAReceber = somaAulas((a) => a.status === 'agendada')

    const custoEfetivo = custosPeriodo.reduce((s, c) => s + Number(c.valor), 0)
    const perdasProjetadas = somaAulas((a) => a.status === 'cancelada' || a.status === 'falta')
    const custoProjetado = custoEfetivo + perdasProjetadas

    const lucro = valorRecebido - custoEfetivo
    const margem = valorRecebido > 0 ? (lucro / valorRecebido) * 100 : null

    const porCategoria = categoriasCusto
      .map((c) => ({
        categoria: c.valor,
        label: c.label,
        valor: custosPeriodo
          .filter((custo) => custo.categoria === c.valor)
          .reduce((s, custo) => s + Number(custo.valor), 0),
      }))
      .filter((c) => c.valor > 0)
      .sort((a, b) => b.valor - a.valor)

    return {
      valorProjetado,
      valorRecebido,
      valorAReceber,
      custoProjetado,
      custoEfetivo,
      lucro,
      margem,
      custosPeriodo,
      porCategoria,
    }
  }, [aulas, custos, periodo])

  const historia = useMemo(() => {
    if (!resumo) return null
    if (resumo.valorRecebido === 0 && resumo.custoEfetivo === 0)
      return 'Sem movimentação financeira no período selecionado.'
    if (resumo.margem == null)
      return 'Você registrou custos, mas ainda não há receita confirmada no período.'
    if (resumo.margem >= 70)
      return `Excelente: sua margem no período é de ${resumo.margem.toFixed(0)}%.`
    if (resumo.margem >= 40)
      return `Sua margem no período é de ${resumo.margem.toFixed(0)}% — operação saudável.`
    if (resumo.margem >= 0)
      return `Atenção: sua margem no período é de apenas ${resumo.margem.toFixed(0)}%.`
    return 'Alerta: os custos superaram a receita no período.'
  }, [resumo])

  const historiaCustos = useMemo(() => {
    if (!resumo || resumo.custosPeriodo.length === 0)
      return 'Registre aulas perdidas, deslocamentos e outros gastos.'
    const top = resumo.porCategoria[0]
    const total = resumo.custoEfetivo
    if (!top || total === 0) return 'Registre aulas perdidas, deslocamentos e outros gastos.'
    const pct = Math.round((top.valor / total) * 100)
    const quantidade = resumo.custosPeriodo.length
    return `${quantidade} ${quantidade === 1 ? 'custo registrado' : 'custos registrados'} — ${top.label} responde por ${pct}% do total.`
  }, [resumo])

  const maxCategoria = Math.max(...(resumo?.porCategoria.map((c) => c.valor) ?? [0]), 1)

  async function handleExcluir(id: string) {
    await excluirCusto(id)
    fetchDados()
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        <p className="mt-1 text-sm text-muted">
          {historia ?? 'Receitas, custos e lucratividade do seu negócio.'}
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

      {!erro && resumo === null && (
        <>
          <SkeletonGrid
            cards={6}
            cardClassName="h-24"
            gridClassName="grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3"
          />
          <Skeleton className="h-48" />
        </>
      )}

      {resumo && (
        <>
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Valor projetado"
              value={<ValorMonetario valor={resumo.valorProjetado} />}
              hint="aulas marcadas + confirmadas"
            />
            <StatCard
              icon={PiggyBank}
              label="Valor recebido"
              value={<ValorMonetario valor={resumo.valorRecebido} />}
              hint="aulas já realizadas"
            />
            <StatCard
              icon={HandCoins}
              label="Valor a receber"
              value={<ValorMonetario valor={resumo.valorAReceber} />}
              hint="aulas ainda agendadas"
            />
            <StatCard
              icon={Receipt}
              label="Custo projetado"
              value={<ValorMonetario valor={resumo.custoProjetado} />}
              hint="custos + perdas sem remarcação (faltas e cancelamentos)"
              tone={resumo.custoProjetado > 0 ? 'negative' : 'default'}
            />
            <StatCard
              icon={ReceiptText}
              label="Custo efetivo"
              value={<ValorMonetario valor={resumo.custoEfetivo} />}
              hint="custos registrados no período"
              tone={resumo.custoEfetivo > 0 ? 'negative' : 'default'}
            />
            <StatCard
              icon={Percent}
              label="Lucratividade"
              value={
                <span className="flex items-baseline gap-2">
                  <ValorMonetario valor={resumo.lucro} />
                  {resumo.margem != null && (
                    <span
                      className={`text-xs font-semibold ${
                        resumo.margem >= 0 ? 'text-primary' : 'text-danger'
                      }`}
                    >
                      {resumo.margem.toFixed(0)}%
                    </span>
                  )}
                </span>
              }
              hint="recebido − custo efetivo"
              tone={resumo.lucro < 0 ? 'negative' : 'default'}
            />
          </div>

          <section className="card-shadow flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Custos do período</h2>
              <p className="mt-1 text-xs text-muted">{historiaCustos}</p>
            </div>

            {mostrarForm && (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <CustoForm onCreated={fetchDados} />
              </div>
            )}

            {resumo.porCategoria.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Análise por categoria
                </h3>
                {resumo.porCategoria.map((item) => (
                  <div key={item.categoria} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <ValorMonetario
                        valor={item.valor}
                        className="shrink-0 text-xs text-muted"
                      />
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-danger/50 transition-all"
                        style={{ width: `${Math.max((item.valor / maxCategoria) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resumo.custosPeriodo.length === 0 ? (
              <p className="text-sm text-muted">Nenhum custo registrado no período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-semibold">Data</th>
                      <th className="py-2 pr-3 font-semibold">Nome do custo</th>
                      <th className="py-2 pr-3 font-semibold">Categoria</th>
                      <th className="py-2 pr-3 text-right font-semibold">Valor</th>
                      <th className="py-2">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.custosPeriodo.map((custo) => (
                      <tr key={custo.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap py-2.5 pr-3 text-muted">
                          {formatarData(custo.data)}
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-foreground">
                          {custo.descricao ?? '—'}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground/80">
                            {labelCategoria[custo.categoria]}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          <ValorMonetario
                            valor={Number(custo.valor)}
                            className="font-medium text-foreground"
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleExcluir(custo.id)}
                            title="Excluir custo"
                            className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger-light hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <BotaoFlutuante
        icon={Plus}
        label={mostrarForm ? 'Fechar formulário' : 'Registrar custo'}
        ativo={mostrarForm}
        onClick={() => setMostrarForm((v) => !v)}
      />
    </main>
  )
}

export default function FinanceiroPage() {
  return (
    <AuthGuard>
      <FinanceiroContent />
    </AuthGuard>
  )
}
