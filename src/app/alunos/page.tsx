'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, Mail, Phone, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth-guard'
import { SkeletonGrid } from '@/components/skeleton'
import { ValorMonetario } from '@/components/valor-monetario'

type Aluno = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  bairro: string | null
  tipo_cobranca: string
  valor_mensalidade: number | null
  valor_hora: number | null
  ativo: boolean
}

function AlunosContent() {
  const [alunos, setAlunos] = useState<Aluno[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('alunos')
      .select(
        'id, nome, email, telefone, bairro, tipo_cobranca, valor_mensalidade, valor_hora, ativo'
      )
      .order('nome')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAlunos(data)
      })
  }, [])

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cadastro de Alunos</h1>
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
          Erro ao carregar alunos: {error}
        </p>
      )}

      {!error && alunos === null && (
        <SkeletonGrid
          cards={4}
          cardClassName="h-36"
          gridClassName="grid grid-cols-1 gap-3 @xl:grid-cols-2"
        />
      )}

      {!error && alunos?.length === 0 && (
        <div className="card-shadow rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">Nenhum aluno cadastrado ainda.</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
        {alunos?.map((aluno) => {
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
              <div className="flex items-start justify-between">
                <span className="font-semibold text-foreground">{aluno.nome}</span>
                {!aluno.ativo && (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                    Inativo
                  </span>
                )}
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
