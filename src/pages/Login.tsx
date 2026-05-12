import { useState, FormEvent } from 'react'
import { Dog, LogIn } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-600 text-white rounded-full p-4 mb-4">
            <Dog size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            HSV Pegnitz
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Inventarverwaltung</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Dein Benutzername"
              autoFocus
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            <LogIn size={18} />
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Kein Passwort nötig — Benutzername reicht aus
        </p>
      </div>
    </div>
  )
}
