import { AuthGuard } from '@/components/auth-guard'
import { AlunoForm } from '../aluno-form'

export default function NovoAlunoPage() {
  return (
    <AuthGuard>
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cadastrar aluno</h1>
          <p className="mt-1 text-sm text-muted">
            Preencha os dados do aluno e a forma de cobrança.
          </p>
        </div>
        <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
          <AlunoForm />
        </div>
      </main>
    </AuthGuard>
  )
}
