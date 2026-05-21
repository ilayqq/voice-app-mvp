import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(phoneNumber, password)
      } else {
        await register(phoneNumber, password, name || undefined)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
              style={{
                clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        <div className="mx-auto max-w-md px-4 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl font-semibold text-white lg:text-7xl">
              Speak Stock
            </h1>
            <form
                onSubmit={handleSubmit}
                className="mx-auto mt-8 w-full max-w-sm space-y-3 sm:space-y-4"
            >
              {!isLogin && (
                  <input
                      type="text"
                      placeholder={t("login.name_placeholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none ring-1 ring-white/20 focus:ring-indigo-500"
                  />
              )}

              <input
                  type="tel"
                  placeholder={t("login.phone_placeholder") + " *"}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full rounded-md bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none ring-1 ring-white/20 focus:ring-indigo-500"
              />

              <input
                  type="password"
                  placeholder={t("login.password_placeholder") + " *"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none ring-1 ring-white/20 focus:ring-indigo-500"
              />

              {error && (
                  <div className="text-sm text-red-400">
                    {error}
                  </div>
              )}

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-indigo-500 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {loading
                    ? t("login.loading")
                    : isLogin
                        ? t('login.login_button')
                        : t('login.register_button')}
              </button>

              <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="text-sm/6 font-semibold text-white"
              >
                {isLogin ? t('login.register_button') + " →" : t('login.login_button') + " →"}
              </button>
            </form>
          </div>
        </div>
        <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
              style={{
                clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
      </div>
  )
}
