'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'gestao-aulas:mostrar-financeiro'

type FinanceVisibilityContextValue = {
  visivel: boolean
  alternar: () => void
}

const FinanceVisibilityContext = createContext<FinanceVisibilityContextValue | null>(null)

export function FinanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    // Lê a preferência salva no navegador. Precisa começar com `false` (para
    // bater com o HTML estático pré-gerado) e só então sincronizar — por
    // isso a exceção à regra de não chamar setState dentro de effect.
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo === '1') setVisivel(true)
  }, [])

  function alternar() {
    setVisivel((atual) => {
      const novo = !atual
      window.localStorage.setItem(STORAGE_KEY, novo ? '1' : '0')
      return novo
    })
  }

  return (
    <FinanceVisibilityContext.Provider value={{ visivel, alternar }}>
      {children}
    </FinanceVisibilityContext.Provider>
  )
}

export function useFinanceVisibility() {
  const ctx = useContext(FinanceVisibilityContext)
  if (!ctx) {
    throw new Error('useFinanceVisibility precisa estar dentro de FinanceVisibilityProvider')
  }
  return ctx
}
