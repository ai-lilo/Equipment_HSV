import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
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
  const { user, loading, error, otpEmail, sendOTP, verifyOTP, resetOTP, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const urlFilter = getUrlFilter()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/Equipment_HSV/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    let hiddenAt: number | null = null

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (document.visibilityState === 'visible' && hiddenAt !== null) {
        if (Date.now() - hiddenAt > 30_000) {
          window.location.reload()
        }
        hiddenAt = null
      }
    }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (loading && !user) {
    return <div className="min-h-screen bg-navy-700" />
  }

  if (!user) {
    return <Login otpEmail={otpEmail} onSendOTP={sendOTP} onVerifyOTP={verifyOTP} onResetOTP={resetOTP} error={error} loading={loading} />
  }

  return (
    <div className="min-h-screen bg-cream-50 transition-colors">
      <Toaster position="top-center" richColors closeButton />
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
