import { createClient } from '@/lib/supabase/client'
import { fmtISO } from '@/components/periodo-selector'

/** Registra o recebimento de uma aula avulsa (aluno cobrado por aula). */
export async function registrarRecebimentoAula(dados: {
  alunoId: string
  aulaId: string
  valor: number
}) {
  const supabase = createClient()
  return supabase.from('pagamentos').insert({
    aluno_id: dados.alunoId,
    tipo: 'avulso',
    aula_id: dados.aulaId,
    valor: dados.valor,
    data_pagamento: fmtISO(new Date()),
    status: 'pago',
  })
}

/** Registra o recebimento da mensalidade de um mês (referencia = 'AAAA-MM'). */
export async function registrarRecebimentoMensalidade(dados: {
  alunoId: string
  referencia: string
  valor: number
  vencimento: string | null
}) {
  const supabase = createClient()
  return supabase.from('pagamentos').insert({
    aluno_id: dados.alunoId,
    tipo: 'mensalidade',
    referencia: dados.referencia,
    valor: dados.valor,
    vencimento: dados.vencimento,
    data_pagamento: fmtISO(new Date()),
    status: 'pago',
  })
}

/** Exclui um recebimento registrado (desfazer). */
export async function excluirPagamento(id: string) {
  const supabase = createClient()
  return supabase.from('pagamentos').delete().eq('id', id)
}
