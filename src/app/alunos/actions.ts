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

  const supabase = createClient()
  const { error } = await supabase.from('alunos').insert({
    nome,
    email: formData.get('email')?.toString() || null,
    telefone: formData.get('telefone')?.toString() || null,
    data_nascimento: formData.get('data_nascimento')?.toString() || null,
    bairro: formData.get('bairro')?.toString().trim() || null,
    tipo_cobranca: tipoCobranca,
    valor_mensalidade:
      tipoCobranca === 'mensalista' && valorMensalidade ? Number(valorMensalidade) : null,
    dia_vencimento:
      tipoCobranca === 'mensalista' && diaVencimento ? Number(diaVencimento) : null,
    // valor_hora não é mais coletado no cadastro — o valor de cada aula é
    // definido individualmente ao marcá-la (tabela `aulas`, campo `valor`).
    valor_hora: null,
    observacoes: formData.get('observacoes')?.toString() || null,
  })

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, submissionId: prevState.submissionId }
  }

  return { success: true, submissionId: prevState.submissionId + 1 }
}

export async function atualizarAluno(
  id: string,
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

  const supabase = createClient()
  const { error } = await supabase
    .from('alunos')
    .update({
      nome,
      email: formData.get('email')?.toString() || null,
      telefone: formData.get('telefone')?.toString() || null,
      data_nascimento: formData.get('data_nascimento')?.toString() || null,
      bairro: formData.get('bairro')?.toString().trim() || null,
      tipo_cobranca: tipoCobranca,
      valor_mensalidade:
        tipoCobranca === 'mensalista' && valorMensalidade ? Number(valorMensalidade) : null,
      dia_vencimento:
        tipoCobranca === 'mensalista' && diaVencimento ? Number(diaVencimento) : null,
      ativo: formData.get('ativo') != null,
      observacoes: formData.get('observacoes')?.toString() || null,
    })
    .eq('id', id)

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, submissionId: prevState.submissionId }
  }

  return { success: true, submissionId: prevState.submissionId + 1 }
}

export async function excluirAluno(id: string) {
  const supabase = createClient()
  // As tabelas aulas/pagamentos têm ON DELETE CASCADE — excluir o aluno
  // apaga também todo o histórico dele. A UI avisa antes de confirmar.
  return supabase.from('alunos').delete().eq('id', id)
}
