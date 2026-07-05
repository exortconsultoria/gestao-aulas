import Link from 'next/link'
import { AlunoForm } from '../aluno-form'

export default function NovoAlunoPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cadastrar aluno</h1>
        <Link href="/alunos" className="text-sm underline">
          Ver alunos
        </Link>
      </div>
      <AlunoForm />
    </main>
  )
}
