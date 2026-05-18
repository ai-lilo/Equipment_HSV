import { useState, FormEvent } from 'react'
import { LogIn } from 'lucide-react'

interface Props {
  onLogin: (username: string) => Promise<void>
  error: string | null
  loading: boolean
}

export default function Login({ onLogin, error, loading }: Props) {
  const [username, setUsername] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    await onLogin(username.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-700 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="HSV Pegnitz 03 e.V."
            className="h-24 w-24 object-contain mb-4"
          />
          <h1 className="text-3xl font-bold italic text-white text-center">
            Willkommen am Platz!
          </h1>
          <p className="text-navy-100 text-sm mt-2">HSV Pegnitz 03 e.V. · Inventarverwaltung</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Dein Benutzername"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            <LogIn size={18} />
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-xs text-navy-100 mt-4">
          Kein Passwort nötig — Benutzername reicht aus
        </p>
      </div>
    </div>
  )
}
