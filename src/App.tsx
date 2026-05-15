import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Header from './components/layout/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Admin from './pages/Admin'
import ShoppingList from './pages/ShoppingList'
import Tournament from './pages/Tournament'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('hsv_dark')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('hsv_dark', String(dark))
  }, [dark])

  return [dark, () => setDark(d => !d)] as const
}

function getUrlFilter() {
  const params = new URLSearchParams(window.location.search)
  return {
    room: params.get('room') ?? undefined,
    cabinet: params.get('cabinet') ?? undefined,
  }
}

export default function App() {
  const { user, loading, error, login, logout } = useAuth()
  const [dark, toggleDark] = useDarkMode()
  const [page, setPage] = useState('dashboard')
  const urlFilter = getUrlFilter()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/Equipment_HSV/sw.js').catch(() => {})
    }
  }, [])

  if (!user) {
    return <Login onLogin={login} error={error} loading={loading} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        user={user}
        page={page}
        onNavigate={setPage}
        onLogout={logout}
        darkMode={dark}
        onToggleDark={toggleDark}
      />
      <main>
        {page === 'dashboard' && (
          <Dashboard user={user} filterRoom={urlFilter.room} filterCabinet={urlFilter.cabinet} />
        )}
        {page === 'rooms' && (user.role === 'MEMBER' || user.role === 'ADMIN') && (
          <Rooms user={user} />
        )}
        {page === 'admin' && user.role === 'ADMIN' && (
          <Admin user={user} />
        )}
        {page === 'shopping-list' && (user.role === 'MEMBER' || user.role === 'ADMIN') && (
          <ShoppingList user={user} />
        )}
        {page === 'turnier' && (
          <Tournament user={user} onNavigate={setPage} />
        )}
      </main>
    </div>
  )
}
