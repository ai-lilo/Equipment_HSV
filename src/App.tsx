import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Header from './components/layout/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import ShoppingList from './pages/ShoppingList'
import Tournament from './pages/Tournament'

function getUrlFilter() {
  const params = new URLSearchParams(window.location.search)
  return {
    room: params.get('room') ?? undefined,
    cabinet: params.get('cabinet') ?? undefined,
  }
}

export default function App() {
  const { user, loading, error, login, logout } = useAuth()
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
      />
      <main>
        {page === 'dashboard' && (
          <Dashboard user={user} filterRoom={urlFilter.room} filterCabinet={urlFilter.cabinet} />
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
