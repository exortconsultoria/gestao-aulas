import { createClient } from '@/lib/supabase/client'

export type CriarAulaState = {
  error?: string
  success?: boolean
  submissionId: number
}

export async function criarAula(
  prevState: CriarAulaState,
  formData: FormData
): Promise<CriarAulaState> {
  const alunoId = formData.get('aluno_id')?.toString()
  const data = formData.get('data')?.toString()
  const horaInicio = formData.get('hora_inicio')?.toString()

  if (!alunoId) return { error: 'Selecione o aluno.', submissionId: prevState.submissionId }
  if (!data) return { error: 'Informe a data da aula.', submissionId: prevState.submissionId }
  if (!horaInicio)
    return { error: 'Informe o horário de início.', submissionId: prevState.submissionId }

  const horaFim = formData.get('hora_fim')?.toString()
  const valor = formData.get('valor')?.toString()

  const supabase = createClient()
  const { error } = await supabase.from('aulas').insert({
    aluno_id: alunoId,
    data,
    hora_inicio: horaInicio,
    hora_fim: horaFim || null,
    valor: valor ? Number(valor) : null,
    observacoes: formData.get('observacoes')?.toString() || null,
  })

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, submissionId: prevState.submissionId }
  }

  return { success: true, submissionId: prevState.submissionId + 1 }
}

export type StatusAula = 'agendada' | 'realizada' | 'cancelada' | 'falta'

export async function atualizarStatusAula(id: string, status: StatusAula) {
  const supabase = createClient()
  return supabase.from('aulas').update({ status }).eq('id', id)
}

export async function reagendarAula(
  id: string,
  dados: { data: string; hora_inicio: string; hora_fim: string | null }
) {
  const supabase = createClient()
  // Remarcar devolve a aula ao status 'agendada': uma aula cancelada ou com
  // falta que foi remarcada deixa de contar como perda ("cancelada" fica
  // reservada para aulas que geraram prejuízo, sem remarcação).
  return supabase.from('aulas').update({ ...dados, status: 'agendada' }).eq('id', id)
}
