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

function dataISOLocal(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Mensagem de confirmação com referência dinâmica ao dia:
 * aula hoje → "hoje às HH:MM" · aula amanhã → "amanhã às HH:MM" ·
 * mais distante → "no dia DD/MM às HH:MM".
 */
export function mensagemConfirmacao(
  aula: {
    data: string
    hora_inicio: string
    aluno: { nome: string } | null
  },
  agora: Date = new Date()
): string {
  const hora = aula.hora_inicio.slice(0, 5)
  const primeiroNome = aula.aluno?.nome.trim().split(/\s+/)[0] ?? ''

  const hoje = dataISOLocal(agora)
  const amanhaDate = new Date(agora)
  amanhaDate.setDate(agora.getDate() + 1)
  const amanha = dataISOLocal(amanhaDate)

  let quando: string
  if (aula.data === hoje) {
    quando = `hoje às ${hora}`
  } else if (aula.data === amanha) {
    quando = `amanhã às ${hora}`
  } else {
    const [, mes, dia] = aula.data.split('-')
    quando = `no dia ${dia}/${mes} às ${hora}`
  }

  return `Olá${primeiroNome ? `, ${primeiroNome}` : ''}! Passando pra confirmar nossa aula ${quando}.`
}
