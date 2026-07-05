'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CriarAulaState = {
  error?: string
  success?: boolean
}

export async function criarAula(
  _prevState: CriarAulaState,
  formData: FormData
): Promise<CriarAulaState> {
  const alunoId = formData.get('aluno_id')?.toString()
  const data = formData.get('data')?.toString()
  const horaInicio = formData.get('hora_inicio')?.toString()

  if (!alunoId) return { error: 'Selecione o aluno.' }
  if (!data) return { error: 'Informe a data da aula.' }
  if (!horaInicio) return { error: 'Informe o horário de início.' }

  const horaFim = formData.get('hora_fim')?.toString()
  const valor = formData.get('valor')?.toString()

  const supabase = await createClient()
  const { error } = await supabase.from('aulas').insert({
    aluno_id: alunoId,
    data,
    hora_inicio: horaInicio,
    hora_fim: horaFim || null,
    valor: valor ? Number(valor) : null,
    observacoes: formData.get('observacoes')?.toString() || null,
  })

  if (error) {
    return { error: `Erro ao salvar: ${error.message}` }
  }

  revalidatePath('/aulas')
  return { success: true }
}
