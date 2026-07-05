import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Gestão de Aulas</h1>
      <Link
        href="/alunos/novo"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Cadastrar aluno
      </Link>
    </main>
  );
}
