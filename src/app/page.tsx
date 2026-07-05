import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Gestão de Aulas</h1>
      <div className="flex gap-3">
        <Link
          href="/alunos"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Ver alunos
        </Link>
        <Link
          href="/aulas"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Agenda de aulas
        </Link>
      </div>
    </main>
  );
}
