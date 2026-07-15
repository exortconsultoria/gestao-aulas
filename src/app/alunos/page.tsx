'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, Mail, Phone, MapPin, Pencil, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { SkeletonGrid } from '@/components/skeleton'
import { ValorMonetario } from '@/components/valor-monetario'
import { excluirAluno } from './actions'
import { AlunoForm, type AlunoEditavel } from './aluno-form'

function AlunosContent() {
  const [alunos, setAlunos] = useState<AlunoEditavel[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const fetchAlunos = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('alunos')
      .select(
        'id, nome, email, telefone, telefone_responsavel, data_nascimento, bairro, origem, tipo_cobranca, valor_mensalidade, dia_vencimento, observacoes, ativo'
      )
      .order('nome')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAlunos(data as AlunoEditavel[])
      })
  }, [])

  useEffect(() => {
    fetchAlunos()
  }, [fetchAlunos])

  async function handleExcluir(aluno: AlunoEditavel) {
    const confirmado = window.confirm(
      `Excluir ${aluno.nome}?\n\nATENÇÃO: todas as aulas e pagamentos deste aluno também serão apagados, inclusive do histórico financeiro.\n\nPara manter o histórico, prefira editar o aluno e desmarcar "Aluno ativo".`
    )
    if (!confirmado) return
    const { error } = await excluirAluno(aluno.id)
    if (error) setError(error.message)
    else fetchAlunos()
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Alunos</h1>
          <p className="mt-1 text-sm text-muted">
            {alunos === null
              ? 'Todos os alunos cadastrados na plataforma.'
              : alunos.length === 0
                ? 'Cadastre seu primeiro aluno para começar.'
                : `${alunos.length} ${alunos.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}, ${alunos.filter((a) => a.ativo).length} em atividade.`}
          </p>
        </div>
        <Link
          href="/alunos/novo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark"
        >
          <UserPlus size={16} />
          Cadastrar aluno
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          Erro: {error}
        </p>
      )}

      {!error && alunos === null && (
        <SkeletonGrid
          cards={4}
          cardClassName="h-36"
          gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-2"
        />
      )}

      {!error && alunos?.length === 0 && (
        <div className="card-shadow rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">Nenhum aluno cadastrado ainda.</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {alunos?.map((aluno) => {
          if (editandoId === aluno.id) {
            return (
              <li
                key={aluno.id}
                className="card-shadow rounded-2xl border border-primary/40 bg-surface p-5 sm:col-span-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Editar aluno</span>
                  <button
                    onClick={() => setEditandoId(null)}
                    title="Fechar edição sem salvar"
                    className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
                <AlunoForm
                  aluno={aluno}
                  onSaved={() => {
                    setEditandoId(null)
                    fetchAlunos()
                  }}
                />
              </li>
            )
          }

          const cobranca =
            aluno.tipo_cobranca === 'mensalista' ? (
              aluno.valor_mensalidade != null ? (
                <ValorMonetario valor={Number(aluno.valor_mensalidade)} sufixo=" / mês" />
              ) : (
                'Mensalista (sem valor definido)'
              )
            ) : (
              'Cobrança por aula'
            )

          return (
            <li
              key={aluno.id}
              className="card-shadow card-shadow-hover flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-foreground">{aluno.nome}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {aluno.origem === 'andre' && (
                    <span
                      title="Aluno indicado pelo André"
                      className="mr-1 rounded-full bg-primary-light px-2 py-0.5 text-xs text-primary-dark"
                    >
                      via André
                    </span>
                  )}
                  {!aluno.ativo && (
                    <span className="mr-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                      Inativo
                    </span>
                  )}
                  <button
                    onClick={() => setEditandoId(aluno.id)}
                    title="Editar aluno"
                    className="rounded-full p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary-dark"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleExcluir(aluno)}
                    title="Excluir aluno"
                    className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger-light hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <span className="text-sm font-medium text-primary">{cobranca}</span>
              <div className="flex flex-col gap-1 border-t border-border pt-2 text-xs text-muted">
                {aluno.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={12} /> {aluno.email}
                  </span>
                )}
                {aluno.telefone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} /> {aluno.telefone}
                  </span>
                )}
                {aluno.telefone_responsavel && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} /> {aluno.telefone_responsavel} (responsável)
                  </span>
                )}
                {aluno.bairro && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} /> {aluno.bairro}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

export default function AlunosPage() {
  return (
    <AuthGuard>
      <AlunosContent />
    </AuthGuard>
  )
}
