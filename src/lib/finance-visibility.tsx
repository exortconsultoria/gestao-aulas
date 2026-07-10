'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'gestao-aulas:mostrar-financeiro'

type FinanceVisibilityContextValue = {
  visivel: boolean
  alternar: () => void
}

const FinanceVisibilityContext = createContext<FinanceVisibilityContextValue | null>(null)

export function FinanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [visivel, setVisivel] = useState(true)

  useEffect(() => {
    // Lê a preferência salva no navegador. Precisa começar com o default
    // (visível) para bater com o HTML estático pré-gerado e só então
    // sincronizar — por isso a exceção à regra do effect.
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo === '0') setVisivel(false)
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
