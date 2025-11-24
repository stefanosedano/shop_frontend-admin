'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslations, Translations, getBrowserLanguage } from '../lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [t, setT] = useState<Translations>(getTranslations('en'))

  useEffect(() => {
    // Load saved language from localStorage or use browser language
    const savedLanguage = localStorage.getItem('admin_language') as Language
    const initialLanguage = savedLanguage || getBrowserLanguage()
    setLanguageState(initialLanguage)
    setT(getTranslations(initialLanguage))
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setT(getTranslations(lang))
    localStorage.setItem('admin_language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
