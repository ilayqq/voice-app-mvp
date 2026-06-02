import './App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.tsx'
import Login from './pages/Login.tsx'
import { useEffect, useState } from 'react'
import './i18n.ts'
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import Products from "./pages/Products.tsx";
import ProductDetails from "./pages/ProductDetails.tsx";
import Incoming from "./pages/Incoming.tsx";
import Outgoing from "./pages/Outgoing.tsx";
import Employees from "./pages/Employees.tsx";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Загрузка...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
              <Dashboard />
          </ProtectedRoute>
        }
      />
        <Route
            path="/products"
            element={
                <ProtectedRoute>
                    <Products />
                </ProtectedRoute>
            }
        />
        <Route
            path="/products/:id"
            element={
                <ProtectedRoute>
                    <ProductDetails />
                </ProtectedRoute>
            }
        />
        <Route
            path="/incoming"
            element={
                <ProtectedRoute>
                    <Incoming />
                </ProtectedRoute>
            }
        />
        <Route
            path="/outgoing"
            element={
                <ProtectedRoute>
                    <Outgoing />
                </ProtectedRoute>
            }
        />
        <Route
            path="/profile"
            element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
            }
        />
        <Route
            path="/employees"
            element={
                <ProtectedRoute>
                    <Employees />
                </ProtectedRoute>
            }
        />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    document.documentElement.setAttribute('data-theme', theme)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
