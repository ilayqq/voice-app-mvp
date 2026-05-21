import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient } from '../services/api'
import type { AuthResponse, UpdateUserRequest } from '../services/api'

interface User {
  id: string
  phone_number: string
  full_name?: string
  avatar?: string // будет использоваться когда бэк поддержит загрузку
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phoneNumber: string, password: string) => Promise<void>
  register: (phoneNumber: string, password: string, name?: string) => Promise<void>
  logout: () => void
  updateUser: (data: UpdateUserRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const phone = localStorage.getItem('auth_phone')

      if (token && phone) {
        try {
          const currentUser = await apiClient.getUserByPhone(phone)
          setUser(currentUser)
        } catch {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_phone')
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (phone_number: string, password: string) => {
    const response: AuthResponse = await apiClient.login({ phone_number, password })
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('auth_phone', phone_number)
    setUser(response.user || { id: phone_number, phone_number })
  }

  const register = async (phone_number: string, password: string, name?: string) => {
    const response: AuthResponse = await apiClient.register({ phone_number, password, name })
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('auth_phone', phone_number)
    setUser(response.user || { id: phone_number, phone_number, name })
  }

  const updateUser = async (data: UpdateUserRequest) => {
    const updated = await apiClient.updateUser(data)
    // Если поменялся телефон — обновляем в localStorage
    if (data.phone_number) {
      localStorage.setItem('auth_phone', data.phone_number)
    }
    setUser(prev => prev ? { ...prev, ...updated } : prev)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_phone')
    setUser(null)
  }

  return (
      <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
        {children}
      </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}