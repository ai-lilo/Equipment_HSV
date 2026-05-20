import { useState } from 'react'
import { LogIn, Mail, ArrowLeft } from 'lucide-react'

interface Props {
  otpEmail: string | null
  onSendOTP: (email: string) => Promise<void>
  onVerifyOTP: (token: string) => Promise<void>
  onResetOTP: () => void
  error: string | null
  loading: boolean
}

export default function Login({ otpEmail, onSendOTP, onVerifyOTP, onResetOTP, error, loading }: Props) {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  async function handleSendOTP(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!email.trim()) return
    await onSendOTP(email.trim())
  }

  async function handleVerifyOTP(e: { preventDefault(): void }) {
    e.preventDefault()
    if (token.length < 6) return
    await onVerifyOTP(token.trim())
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

        {!otpEmail ? (
          <form onSubmit={handleSendOTP} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  autoFocus
                  className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              <LogIn size={18} />
              {loading ? 'Sende Code…' : 'Code senden'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Du erhältst einen 6-stelligen Code per E-Mail.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Code gesendet an <strong>{otpEmail}</strong>. Bitte E-Mails prüfen.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-stelliger Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-lg px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || token.length < 6}
              className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              <LogIn size={18} />
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>

            <button
              type="button"
              onClick={onResetOTP}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} /> Andere E-Mail verwenden
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
