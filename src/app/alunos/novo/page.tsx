import { AlunoForm } from '../aluno-form'

export default function NovoAlunoPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Cadastrar aluno</h1>
      <AlunoForm />
    </main>
  )
}
