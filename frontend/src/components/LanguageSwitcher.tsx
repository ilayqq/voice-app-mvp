import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

const languages = [
  { code: 'kk', label: 'Қазақша' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.split('-')[0] ?? 'ru'

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          className={current === lang.code ? 'active' : ''}
          aria-pressed={current === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
