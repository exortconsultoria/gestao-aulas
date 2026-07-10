import { createClient } from '@/lib/supabase/client'

export type CategoriaCusto = 'aula_perdida' | 'uber' | 'combustivel' | 'outros'

export const categoriasCusto: { valor: CategoriaCusto; label: string }[] = [
  { valor: 'aula_perdida', label: 'Aulas perdidas' },
  { valor: 'uber', label: 'Uber' },
  { valor: 'combustivel', label: 'Combustível' },
  { valor: 'outros', label: 'Outros' },
]

export type CriarCustoState = {
  error?: string
  success?: boolean
  submissionId: number
}

export async function criarCusto(
  prevState: CriarCustoState,
  formData: FormData
): Promise<CriarCustoState> {
  const data = formData.get('data')?.toString()
  const categoria = formData.get('categoria')?.toString()
  const valor = formData.get('valor')?.toString()
  const descricao = formData.get('descricao')?.toString().trim()

  if (!data) return { error: 'Informe a data do custo.', submissionId: prevState.submissionId }
  if (!categoria)
    return { error: 'Selecione a categoria.', submissionId: prevState.submissionId }
  if (!valor || Number(valor) <= 0)
    return { error: 'Informe um valor maior que zero.', submissionId: prevState.submissionId }
  if (!descricao)
    return { error: 'Informe o nome do custo.', submissionId: prevState.submissionId }

  const supabase = createClient()
  const { error } = await supabase.from('custos').insert({
    data,
    categoria,
    descricao: descricao || null,
    valor: Number(valor),
  })

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, submissionId: prevState.submissionId }
  }

  return { success: true, submissionId: prevState.submissionId + 1 }
}

export async function excluirCusto(id: string) {
  const supabase = createClient()
  return supabase.from('custos').delete().eq('id', id)
}
