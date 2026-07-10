'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'gestao-aulas:modo-visual'

type Modo = 'desktop' | 'mobile'

type ViewModeContextValue = {
  modo: Modo
  alternar: () => void
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>('desktop')

  useEffect(() => {
    // Lê a preferência salva. Começa em 'desktop' (default combinado) para
    // bater com o HTML pré-gerado e só então sincroniza — daí a exceção.
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo === 'mobile') setModo('mobile')
  }, [])

  function alternar() {
    setModo((atual) => {
      const novo = atual === 'desktop' ? 'mobile' : 'desktop'
      window.localStorage.setItem(STORAGE_KEY, novo)
      return novo
    })
  }

  return (
    <ViewModeContext.Provider value={{ modo, alternar }}>{children}</ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode precisa estar dentro de ViewModeProvider')
  return ctx
}
