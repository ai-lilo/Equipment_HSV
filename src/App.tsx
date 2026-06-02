import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import Header from './components/layout/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import ShoppingList from './pages/ShoppingList'
import Tournament from './pages/Tournament'
import Instructions from './pages/Instructions'

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
    const THRESHOLD = 5_000

    // Heartbeat: detect process suspension (most reliable on iOS)
    let lastTick = Date.now()
    const heartbeat = setInterval(() => {
      const now = Date.now()
      if (now - lastTick > THRESHOLD) {
        window.location.reload()
        return
      }
      lastTick = now
    }, 2000)

    // visibilitychange: screen lock / app switch
    let hiddenAt: number | null = null
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (document.visibilityState === 'visible' && hiddenAt !== null) {
        if (Date.now() - hiddenAt > THRESHOLD) {
          window.location.reload()
          return
        }
        hiddenAt = null
      }
    }

    // pageshow with persisted=true: BFCache restore on iOS
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-navy-700 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/Equipment_HSV/logo.png" alt="" className="w-16 h-16 rounded-xl opacity-90" />
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    )
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
        {page === 'instructions' && (
          <Instructions user={user} />
        )}
      </main>
    </div>
  )
}
