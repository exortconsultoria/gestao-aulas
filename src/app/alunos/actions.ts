import { createClient } from '@/lib/supabase/client'

export type CriarAlunoState = {
  error?: string
  success?: boolean
  submissionId: number
}

export async function criarAluno(
  prevState: CriarAlunoState,
  formData: FormData
): Promise<CriarAlunoState> {
  const nome = formData.get('nome')?.toString().trim()
  if (!nome) {
    return { error: 'Informe o nome do aluno.', submissionId: prevState.submissionId }
  }

  const tipoCobranca = formData.get('tipo_cobranca')?.toString() ?? 'por_aula'
  const valorMensalidade = formData.get('valor_mensalidade')?.toString()
  const diaVencimento = formData.get('dia_vencimento')?.toString()
  const valorHora = formData.get('valor_hora')?.toString()

  const supabase = createClient()
  const { error } = await supabase.from('alunos').insert({
    nome,
    email: formData.get('email')?.toString() || null,
    telefone: formData.get('telefone')?.toString() || null,
    data_nascimento: formData.get('data_nascimento')?.toString() || null,
    tipo_cobranca: tipoCobranca,
    valor_mensalidade:
      tipoCobranca === 'mensalista' && valorMensalidade ? Number(valorMensalidade) : null,
    dia_vencimento:
      tipoCobranca === 'mensalista' && diaVencimento ? Number(diaVencimento) : null,
    valor_hora: tipoCobranca === 'por_aula' && valorHora ? Number(valorHora) : null,
    observacoes: formData.get('observacoes')?.toString() || null,
  })

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, submissionId: prevState.submissionId }
  }

  return { success: true, submissionId: prevState.submissionId + 1 }
}
