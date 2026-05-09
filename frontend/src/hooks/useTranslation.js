import { useState, useEffect } from 'react'
import { LANGS } from '../utils/translations'

export function useTranslation() {
  const [lang, setLang] = useState(localStorage.getItem('gramdoc_lang') || 'en')
  const user = JSON.parse(localStorage.getItem('gramdoc_user') || '{}')
  const isDoc = user.role === 'doctor'

  // If user is a doctor, always force English UI
  const effectiveLang = isDoc ? 'en' : lang
  const t = LANGS[effectiveLang]?.ui || LANGS.en.ui

  const setLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('gramdoc_lang', newLang)
    // Dispatch custom event to notify other components if needed
    window.dispatchEvent(new Event('languageChange'))
  }

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('gramdoc_lang') || 'en')
    }
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  return { t, lang: effectiveLang, setLanguage, isDoc }
}
