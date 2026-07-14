'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarPlus,
  CalendarDays,
  CalendarClock,
  List,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  UserX,
  Undo2,
  Maximize2,
  X,
  MessageCircle,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { Skeleton } from '@/components/skeleton'
import { ValorMonetario } from '@/components/valor-monetario'
import { fmtISO } from '@/components/periodo-selector'
import { linkWhatsApp, mensagemConfirmacao } from '@/lib/whatsapp'
import { AulaForm } from './aula-form'
import {
  atualizarStatusAula,
  reagendarAula,
  registrarConfirmacao,
  type StatusAula,
} from './actions'

type Aluno = { id: string; nome: string }

type AulaComAluno = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string | null
  status: StatusAula
  valor: number | null
  observacoes: string | null
  confirmacao_enviada_em: string | null
  // PostgREST retorna objeto (relação N:1); cast manual por falta de tipos gerados.
  aluno: { nome: string; telefone: string | null } | null
}

const statusLabel: Record<StatusAula, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  falta: 'Falta',
}

const chipPorStatus: Record<StatusAula, string> = {
  agendada: 'bg-primary-light text-primary-dark',
  realizada: 'bg-primary-accent/30 text-primary-dark',
  cancelada: 'bg-danger-light text-danger line-through',
  falta: 'bg-danger-light text-danger',
}

const badgePorStatus: Record<StatusAula, string> = {
  agendada: 'bg-primary-light text-primary-dark',
  realizada: 'bg-primary-accent/30 text-primary-dark',
  cancelada: 'bg-danger-light text-danger',
  falta: 'bg-danger-light text-danger',
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function nomeDataLonga(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

const inputReagendarClass =
  'rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-primary'

function ReagendarForm({
  aula,
  onDone,
  onCancel,
}: {
  aula: AulaComAluno
  onDone: () => void
  onCancel: () => void
}) {
  const [data, setData] = useState(aula.data)
  const [inicio, setInicio] = useState(aula.hora_inicio.slice(0, 5))
  const [fim, setFim] = useState(aula.hora_fim?.slice(0, 5) ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (!data || !inicio) {
      setErro('Informe a nova data e o horário de início.')
      return
    }
    setSalvando(true)
    const { error } = await reagendarAula(aula.id, {
      data,
      hora_inicio: inicio,
      hora_fim: fim || null,
    })
    setSalvando(false)
    if (error) {
      setErro(`Erro ao reagendar: ${error.message}`)
      return
    }
    onDone()
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-medium text-foreground">Reagendar para:</span>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={inputReagendarClass}
        />
        <input
          type="time"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          title="Horário de início"
          className={inputReagendarClass}
        />
        <span>até</span>
        <input
          type="time"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
          title="Horário de término (opcional)"
          className={inputReagendarClass}
        />
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={onCancel}
            disabled={salvando}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
      {erro && (
        <p className="rounded-lg bg-danger-light px-3 py-1.5 text-xs text-danger">{erro}</p>
      )}
    </div>
  )
}

function AcoesStatus({
  aula,
  onChange,
}: {
  aula: AulaComAluno
  onChange: () => void
}) {
  const [salvando, setSalvando] = useState(false)

  async function mudarStatus(status: StatusAula) {
    setSalvando(true)
    await atualizarStatusAula(aula.id, status)
    setSalvando(false)
    onChange()
  }

  if (aula.status !== 'agendada') {
    return (
      <button
        disabled={salvando}
        onClick={() => mudarStatus('agendada')}
        title="Reabrir aula"
        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
      >
        <Undo2 size={13} /> Reabrir
      </button>
    )
  }

  return (
    <>
      <button
        disabled={salvando}
        onClick={() => mudarStatus('realizada')}
        title="Marcar como realizada"
        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-primary-light hover:text-primary-dark disabled:opacity-50"
      >
        <CheckCircle2 size={13} /> Realizada
      </button>
      <button
        disabled={salvando}
        onClick={() => mudarStatus('falta')}
        title="Marcar falta do aluno"
        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
      >
        <UserX size={13} /> Falta
      </button>
      <button
        disabled={salvando}
        onClick={() => mudarStatus('cancelada')}
        title="Cancelar aula"
        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
      >
        <XCircle size={13} /> Cancelar
      </button>
    </>
  )
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BotaoConfirmarWhatsApp({
  aula,
  onChange,
}: {
  aula: AulaComAluno
  onChange: () => void
}) {
  const link = aula.aluno?.telefone
    ? linkWhatsApp(aula.aluno.telefone, mensagemConfirmacao(aula))
    : null

  if (aula.status !== 'agendada') return null

  if (!link) {
    return (
      <span
        title="Cadastre o telefone do aluno (com DDD) para confirmar pelo WhatsApp"
        className="rounded-full px-2 py-1 text-xs text-muted/60"
      >
        sem telefone
      </span>
    )
  }

  const jaEnviada = Boolean(aula.confirmacao_enviada_em)

  async function enviar() {
    window.open(link!, '_blank', 'noopener')
    await registrarConfirmacao(aula.id)
    onChange()
  }

  return (
    <button
      onClick={enviar}
      title={
        jaEnviada
          ? `Confirmação enviada em ${formatarDataHora(aula.confirmacao_enviada_em!)} — reenviar`
          : 'Enviar confirmação pelo WhatsApp'
      }
      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
        jaEnviada
          ? 'bg-primary-light text-primary-dark hover:bg-primary-accent/40'
          : 'text-muted hover:bg-primary-light hover:text-primary-dark'
      }`}
    >
      {jaEnviada ? <Check size={13} /> : <MessageCircle size={13} />}
      {jaEnviada ? 'Confirmada' : 'Confirmar'}
    </button>
  )
}

function CentralConfirmacoes({
  aulas,
  onChange,
}: {
  aulas: AulaComAluno[]
  onChange: () => void
}) {
  const amanha = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return fmtISO(d)
  }, [])

  const deAmanha = useMemo(
    () =>
      aulas
        .filter((a) => a.data === amanha && a.status === 'agendada')
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    [aulas, amanha]
  )

  if (deAmanha.length === 0) return null

  const confirmadas = deAmanha.filter((a) => a.confirmacao_enviada_em).length
  const historia =
    confirmadas === deAmanha.length
      ? 'Todas confirmadas — amanhã está garantido! ✅'
      : `${deAmanha.length} ${deAmanha.length === 1 ? 'aula' : 'aulas'} amanhã · ${confirmadas} ${confirmadas === 1 ? 'confirmada' : 'confirmadas'}.`

  return (
    <section className="card-shadow rounded-2xl border border-primary/30 bg-primary-light/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Confirmações de amanhã</h2>
      </div>
      <p className="mb-3 text-xs text-muted">{historia}</p>
      <ul className="flex flex-col gap-1.5">
        {deAmanha.map((aula) => (
          <li
            key={aula.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2"
          >
            <span className="text-sm text-foreground">
              <span className="font-medium tabular-nums">{aula.hora_inicio.slice(0, 5)}</span>
              {' · '}
              {aula.aluno?.nome ?? 'Aluno removido'}
            </span>
            <BotaoConfirmarWhatsApp aula={aula} onChange={onChange} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CalendarioMensal({
  aulas,
  mesAncora,
  onNavegar,
  onSelecionarDia,
  mostrarNomes = true,
  telaCheia = false,
}: {
  aulas: AulaComAluno[]
  mesAncora: Date
  onNavegar: (delta: number | 'hoje') => void
  onSelecionarDia: (data: string) => void
  mostrarNomes?: boolean
  telaCheia?: boolean
}) {
  const ano = mesAncora.getFullYear()
  const mes = mesAncora.getMonth()

  const celulas = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1)
    const offset = (primeiroDia.getDay() + 6) % 7 // segunda = 0
    const totalDias = new Date(ano, mes + 1, 0).getDate()

    const dias: (string | null)[] = []
    for (let i = 0; i < offset; i++) dias.push(null)
    for (let dia = 1; dia <= totalDias; dia++) {
      dias.push(fmtISO(new Date(ano, mes, dia)))
    }
    while (dias.length % 7 !== 0) dias.push(null)
    return dias
  }, [ano, mes])

  const aulasPorDia = useMemo(() => {
    const mapa = new Map<string, AulaComAluno[]>()
    for (const aula of aulas) {
      const lista = mapa.get(aula.data) ?? []
      lista.push(aula)
      mapa.set(aula.data, lista)
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }
    return mapa
  }, [aulas])

  const hoje = fmtISO(new Date())
  const tituloMes = mesAncora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="card-shadow rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize text-foreground">{tituloMes}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavegar('hoje')}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
          >
            Hoje
          </button>
          <button
            onClick={() => onNavegar(-1)}
            title="Mês anterior"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onNavegar(1)}
            title="Próximo mês"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            {dia}
          </div>
        ))}

        {celulas.map((data, indice) => {
          const alturaCelula = telaCheia ? 'min-h-24 sm:min-h-32' : 'min-h-20'

          if (!data) {
            return <div key={`vazio-${indice}`} className={`${alturaCelula} rounded-lg`} />
          }

          const doDia = aulasPorDia.get(data) ?? []
          const visiveis = doDia.slice(0, telaCheia ? 5 : 3)
          const extras = doDia.length - visiveis.length
          const ehHoje = data === hoje
          const temAulas = doDia.length > 0

          return (
            <div
              key={data}
              role={temAulas ? 'button' : undefined}
              tabIndex={temAulas ? 0 : undefined}
              onClick={temAulas ? () => onSelecionarDia(data) : undefined}
              onKeyDown={
                temAulas
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelecionarDia(data)
                    }
                  : undefined
              }
              title={temAulas ? 'Ver detalhes das aulas deste dia' : undefined}
              className={`flex ${alturaCelula} flex-col gap-1 rounded-lg border p-1.5 ${
                ehHoje ? 'border-primary bg-primary-light/40' : 'border-border bg-background/60'
              } ${
                temAulas
                  ? 'cursor-pointer transition-shadow hover:ring-2 hover:ring-primary-accent focus:outline-none focus:ring-2 focus:ring-primary'
                  : ''
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  ehHoje ? 'text-primary-dark' : 'text-muted'
                }`}
              >
                {Number(data.slice(8, 10))}
              </span>
              {visiveis.map((aula) => (
                <span
                  key={aula.id}
                  title={`${aula.hora_inicio.slice(0, 5)} — ${aula.aluno?.nome ?? 'Aluno removido'} (${statusLabel[aula.status]})`}
                  className={`truncate rounded px-1 py-0.5 font-medium leading-tight ${
                    telaCheia ? 'text-xs' : 'text-[10px]'
                  } ${chipPorStatus[aula.status]}`}
                >
                  {aula.hora_inicio.slice(0, 5)}
                  {mostrarNomes && ` ${aula.aluno?.nome ?? '—'}`}
                </span>
              ))}
              {extras > 0 && (
                <span className="text-[10px] font-medium text-muted">+{extras} mais</span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted">
        Toque em um dia com aulas para ver os detalhes.
      </p>
    </div>
  )
}

function DetalhesDia({
  data,
  aulas,
  onChange,
  onClose,
}: {
  data: string
  aulas: AulaComAluno[]
  onChange: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="card-shadow relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold capitalize text-foreground">{nomeDataLonga(data)}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {aulas.length === 0
                ? 'Nenhuma aula neste dia.'
                : `${aulas.length} ${aulas.length === 1 ? 'aula' : 'aulas'} neste dia.`}
            </p>
          </div>
          <button
            onClick={onClose}
            title="Fechar detalhes"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {aulas.map((aula) => (
            <ItemAula key={aula.id} aula={aula} onChange={onChange} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function ItemAula({ aula, onChange }: { aula: AulaComAluno; onChange: () => void }) {
  const [reagendando, setReagendando] = useState(false)

  return (
    <li className="card-shadow flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {aula.aluno?.nome ?? 'Aluno removido'}
          </span>
          <span className="text-xs text-muted">
            {formatarData(aula.data)} · {aula.hora_inicio.slice(0, 5)}
            {aula.hora_fim ? ` – ${aula.hora_fim.slice(0, 5)}` : ''}
            {aula.valor != null && (
              <>
                {' · '}
                <ValorMonetario valor={Number(aula.valor)} />
              </>
            )}
          </span>
          {aula.observacoes && (
            <span className="mt-0.5 text-xs italic text-muted">{aula.observacoes}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgePorStatus[aula.status]}`}
          >
            {statusLabel[aula.status]}
          </span>
          <div className="flex gap-1">
            <BotaoConfirmarWhatsApp aula={aula} onChange={onChange} />
            {aula.status === 'agendada' && (
              <button
                onClick={() => setReagendando((v) => !v)}
                title="Reagendar esta aula"
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                  reagendando
                    ? 'bg-primary-light text-primary-dark'
                    : 'text-muted hover:bg-primary-light hover:text-primary-dark'
                }`}
              >
                <CalendarClock size={13} /> Reagendar
              </button>
            )}
            <AcoesStatus aula={aula} onChange={onChange} />
          </div>
        </div>
      </div>

      {reagendando && (
        <ReagendarForm
          aula={aula}
          onDone={() => {
            setReagendando(false)
            onChange()
          }}
          onCancel={() => setReagendando(false)}
        />
      )}
    </li>
  )
}

function ListaAulas({
  aulas,
  onChange,
}: {
  aulas: AulaComAluno[]
  onChange: () => void
}) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, AulaComAluno[]>()
    for (const aula of aulas) {
      const lista = mapa.get(aula.data) ?? []
      lista.push(aula)
      mapa.set(aula.data, lista)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, lista]) => ({
        data,
        lista: lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
      }))
  }, [aulas])

  if (grupos.length === 0) {
    return (
      <div className="card-shadow rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">Nenhuma aula marcada ainda.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <section key={grupo.data} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {nomeDataLonga(grupo.data)}
          </h3>
          <ul className="flex flex-col gap-2">
            {grupo.lista.map((aula) => (
              <ItemAula key={aula.id} aula={aula} onChange={onChange} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function AulasContent() {
  const [alunos, setAlunos] = useState<Aluno[] | null>(null)
  const [erroAlunos, setErroAlunos] = useState<string | null>(null)
  const [aulas, setAulas] = useState<AulaComAluno[] | null>(null)
  const [erroAulas, setErroAulas] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [visao, setVisao] = useState<'calendario' | 'lista'>('calendario')
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [telaCheia, setTelaCheia] = useState(false)
  const [mostrarNomes, setMostrarNomes] = useState(false)
  const [mesAncora, setMesAncora] = useState(() => {
    const agora = new Date()
    return new Date(agora.getFullYear(), agora.getMonth(), 1)
  })

  // Se o usuário sair da tela cheia nativa (ex.: tecla Esc), fecha o overlay.
  useEffect(() => {
    function aoMudarFullscreen() {
      if (!document.fullscreenElement) setTelaCheia(false)
    }
    document.addEventListener('fullscreenchange', aoMudarFullscreen)
    return () => document.removeEventListener('fullscreenchange', aoMudarFullscreen)
  }, [])

  function abrirTelaCheia() {
    setTelaCheia(true)
    setMostrarNomes(false) // privacidade: ao exibir para um aluno, nomes ocultos
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  function fecharTelaCheia() {
    setTelaCheia(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  const fetchAulas = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('aulas')
      .select(
        'id, data, hora_inicio, hora_fim, status, valor, observacoes, confirmacao_enviada_em, aluno:alunos(nome, telefone)'
      )
      .order('data')
      .order('hora_inicio')
      .then(({ data, error }) => {
        if (error) setErroAulas(error.message)
        else setAulas(data as unknown as AulaComAluno[])
      })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('alunos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data, error }) => {
        if (error) setErroAlunos(error.message)
        else setAlunos(data)
      })
    fetchAulas()
  }, [fetchAulas])

  function navegarMes(delta: number | 'hoje') {
    if (delta === 'hoje') {
      const agora = new Date()
      setMesAncora(new Date(agora.getFullYear(), agora.getMonth(), 1))
    } else {
      setMesAncora((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))
    }
  }

  const subtitulo = useMemo(() => {
    if (!aulas) return 'Suas aulas organizadas no calendário do mês.'
    if (visao === 'lista') {
      if (aulas.length === 0) return 'Nenhuma aula marcada ainda.'
      return `${aulas.length} ${aulas.length === 1 ? 'aula marcada' : 'aulas marcadas'} no total.`
    }
    const chaveMes = `${mesAncora.getFullYear()}-${String(mesAncora.getMonth() + 1).padStart(2, '0')}`
    const noMes = aulas.filter((a) => a.data.startsWith(chaveMes)).length
    const nomeMesAtual = mesAncora.toLocaleDateString('pt-BR', { month: 'long' })
    if (noMes === 0) return `Nenhuma aula em ${nomeMesAtual} — agenda livre.`
    return `${noMes} ${noMes === 1 ? 'aula' : 'aulas'} em ${nomeMesAtual}.`
  }, [aulas, visao, mesAncora])

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="mt-1 text-sm text-muted">{subtitulo}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
            <button
              onClick={() => setVisao('calendario')}
              title="Visualizar como calendário"
              className={`rounded-full p-1.5 transition-colors ${
                visao === 'calendario'
                  ? 'bg-primary text-primary-contrast'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <CalendarDays size={15} />
            </button>
            <button
              onClick={() => setVisao('lista')}
              title="Visualizar como lista"
              className={`rounded-full p-1.5 transition-colors ${
                visao === 'lista'
                  ? 'bg-primary text-primary-contrast'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <List size={15} />
            </button>
          </div>
          {visao === 'calendario' && (
            <button
              onClick={abrirTelaCheia}
              title="Calendário em tela cheia (para mostrar disponibilidade)"
              className="rounded-full border border-border bg-surface p-2 text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <Maximize2 size={15} />
            </button>
          )}
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark"
          >
            <CalendarPlus size={16} />
            {mostrarForm ? 'Fechar' : 'Marcar aula'}
          </button>
        </div>
      </div>

      {erroAlunos && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro ao carregar alunos: {erroAlunos}
        </p>
      )}

      {mostrarForm && !erroAlunos && alunos !== null && (
        <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
          <AulaForm
            alunos={alunos}
            onCreated={() => {
              fetchAulas()
              setMostrarForm(false)
            }}
          />
        </div>
      )}

      {erroAulas && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro ao carregar aulas: {erroAulas}
        </p>
      )}

      {aulas === null && !erroAulas && <Skeleton className="h-96" />}

      {aulas !== null && <CentralConfirmacoes aulas={aulas} onChange={fetchAulas} />}

      {aulas !== null &&
        (visao === 'calendario' ? (
          <CalendarioMensal
            aulas={aulas}
            mesAncora={mesAncora}
            onNavegar={navegarMes}
            onSelecionarDia={setDiaSelecionado}
          />
        ) : (
          <ListaAulas aulas={aulas} onChange={fetchAulas} />
        ))}

      {telaCheia && aulas !== null && (
        <div className="fixed inset-0 z-40 flex flex-col gap-4 overflow-y-auto bg-background p-4 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Disponibilidade</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarNomes((v) => !v)}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {mostrarNomes ? 'Ocultar nomes' : 'Mostrar nomes'}
              </button>
              <button
                onClick={fecharTelaCheia}
                title="Sair da tela cheia"
                className="rounded-full border border-border bg-surface p-2 text-muted transition-colors hover:border-danger hover:text-danger"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <CalendarioMensal
            aulas={aulas}
            mesAncora={mesAncora}
            onNavegar={navegarMes}
            onSelecionarDia={setDiaSelecionado}
            mostrarNomes={mostrarNomes}
            telaCheia
          />
        </div>
      )}

      {diaSelecionado && aulas !== null && (
        <DetalhesDia
          data={diaSelecionado}
          aulas={aulas.filter((a) => a.data === diaSelecionado)}
          onChange={fetchAulas}
          onClose={() => setDiaSelecionado(null)}
        />
      )}
    </main>
  )
}

export default function AulasPage() {
  return (
    <AuthGuard>
      <AulasContent />
    </AuthGuard>
  )
}
