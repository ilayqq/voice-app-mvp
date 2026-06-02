import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient } from '../services/api'
import type { AuthResponse, UpdateUserRequest, CompanyInfo } from '../services/api'

interface User {
  id: number
  phone_number: string
  full_name?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  company: CompanyInfo | null
  isOwner: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (phoneNumber: string, password: string) => Promise<void>
  register: (phoneNumber: string, password: string, fullName: string, companyName: string) => Promise<void>
  logout: () => void
  updateUser: (data: UpdateUserRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function applyAuthResponse(
  response: AuthResponse,
  setUser: (u: User) => void,
  setCompany: (c: CompanyInfo) => void,
  phone: string,
) {
  localStorage.setItem('auth_token', response.token)
  localStorage.setItem('auth_phone', phone)
  setUser({
    id: response.user.id,
    phone_number: response.user.phone_number,
    full_name: response.user.full_name,
  })
  setCompany(response.company)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const phone = localStorage.getItem('auth_phone')

      if (token && phone) {
        try {
          const currentUser = await apiClient.getUserByPhone(phone)
          setUser({
            id: currentUser.id,
            phone_number: currentUser.phone_number,
            full_name: currentUser.full_name,
          })
          const companyInfo = await apiClient.getCompany()
          setCompany(companyInfo)
        } catch {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_phone')
          setUser(null)
          setCompany(null)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (phone_number: string, password: string) => {
    const response = await apiClient.login({ phone_number, password })
    applyAuthResponse(response, setUser, setCompany, phone_number)
  }

  const register = async (phone_number: string, password: string, fullName: string, companyName: string) => {
    const response = await apiClient.register({
      phone_number,
      password,
      full_name: fullName || undefined,
      company_name: companyName,
    })
    applyAuthResponse(response, setUser, setCompany, phone_number)
  }

  const updateUser = async (data: UpdateUserRequest) => {
    const updated = await apiClient.updateUser(data)
    if (data.phone_number) {
      localStorage.setItem('auth_phone', data.phone_number)
    }
    setUser(prev => prev ? { ...prev, ...updated, full_name: updated.full_name } : prev)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_phone')
    setUser(null)
    setCompany(null)
  }

  const isOwner = company?.role === 'owner'

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isOwner,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
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
