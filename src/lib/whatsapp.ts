/** Normaliza um telefone brasileiro para o formato do wa.me (dígitos com 55). */
export function normalizarTelefone(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null
  // Já tem o código do país
  if (digitos.startsWith('55') && digitos.length >= 12) return digitos
  // DDD + número (fixo ou celular)
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  return digitos
}

/** Monta o link click-to-chat do WhatsApp com a mensagem pré-preenchida. */
export function linkWhatsApp(telefone: string, mensagem: string): string | null {
  const numero = normalizarTelefone(telefone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

/** Mensagem padrão de confirmação de aula. */
export function mensagemConfirmacao(aula: {
  data: string
  hora_inicio: string
  aluno: { nome: string } | null
}): string {
  const [ano, mes, dia] = aula.data.split('-').map(Number)
  const dataObj = new Date(ano, mes - 1, dia)
  const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dataCurta = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
  const primeiroNome = aula.aluno?.nome.trim().split(/\s+/)[0] ?? ''

  return (
    `Olá${primeiroNome ? `, ${primeiroNome}` : ''}! 👋 ` +
    `Passando para confirmar nossa aula de ${diaSemana} (${dataCurta}) ` +
    `às ${aula.hora_inicio.slice(0, 5)}. ` +
    `Qualquer imprevisto é só me avisar. Até lá! 😊`
  )
}
