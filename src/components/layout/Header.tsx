import { LogOut, ShieldCheck, ShoppingCart, Trophy } from 'lucide-react'
import type { User } from '../../types'

interface Props {
  user: User
  page: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

export default function Header({ user, page, onNavigate, onLogout }: Props) {
  return (
    <header className="bg-navy-700 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-white rounded-xl p-1.5 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="HSV Pegnitz 03 e.V."
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm text-white leading-tight">HSV Pegnitz 03</p>
          </div>
        </div>

        <nav className="flex gap-1 ml-3 flex-1">
          <NavBtn active={page === 'dashboard'} onClick={() => onNavigate('dashboard')}>
            Inventar
          </NavBtn>
          {(user.role === 'MEMBER' || user.role === 'ADMIN') && (
            <NavBtn active={page === 'shopping-list'} onClick={() => onNavigate('shopping-list')}>
              <ShoppingCart size={14} className="sm:hidden" />
              <span className="hidden sm:inline">Einkaufsliste</span>
            </NavBtn>
          )}
          <NavBtn active={page === 'turnier'} onClick={() => onNavigate('turnier')}>
            <Trophy size={14} className="sm:hidden" />
            <span className="hidden sm:inline">Veranstaltung</span>
          </NavBtn>
          {user.role === 'ADMIN' && (
            <NavBtn active={page === 'admin'} onClick={() => onNavigate('admin')}>
              <ShieldCheck size={14} className="sm:hidden" />
              <span className="hidden sm:inline">Admin</span>
            </NavBtn>
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials(user.username)}</span>
          </div>
          <span className="text-sm text-white font-medium hidden sm:block">{user.username}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/30 text-white text-sm hover:bg-navy-800 transition-colors ml-1"
            title="Abmelden"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-navy-800 font-semibold'
          : 'text-white/70 hover:text-white hover:bg-navy-800/40'
      }`}
    >
      {children}
    </button>
  )
}
