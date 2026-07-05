'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light'
const labelClass = 'text-sm font-medium text-foreground'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha incorretos.')
      return
    }
    router.replace('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-accent text-foreground card-shadow">
            <GraduationCap size={26} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Gestão de Aulas</h1>
          <p className="text-sm text-muted">Entre para organizar suas aulas e alunos</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-shadow flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className={labelClass}>
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputClass}
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
