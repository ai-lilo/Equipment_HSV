import { Dog, Moon, Sun, LogOut, ShieldCheck, LayoutDashboard, DoorOpen } from 'lucide-react'
import type { User } from '../../types'

interface Props {
  user: User
  page: string
  onNavigate: (page: string) => void
  onLogout: () => void
  darkMode: boolean
  onToggleDark: () => void
}

const roleLabel: Record<string, string> = {
  VISITOR: 'Besucher',
  MEMBER: 'Mitglied',
  ADMIN: 'Admin',
}

export default function Header({ user, page, onNavigate, onLogout, darkMode, onToggleDark }: Props) {
  return (
    <header className="bg-blue-800 dark:bg-blue-950 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <Dog size={24} className="shrink-0" />
        <span className="font-bold text-lg tracking-tight hidden sm:block">HSV Pegnitz</span>

        <nav className="flex gap-1 ml-2 flex-1">
          <NavBtn active={page === 'dashboard'} onClick={() => onNavigate('dashboard')}>
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Inventar</span>
          </NavBtn>
          {(user.role === 'MEMBER' || user.role === 'ADMIN') && (
            <NavBtn active={page === 'rooms'} onClick={() => onNavigate('rooms')}>
              <DoorOpen size={16} />
              <span className="hidden sm:inline">Räume</span>
            </NavBtn>
          )}
          {user.role === 'ADMIN' && (
            <NavBtn active={page === 'admin'} onClick={() => onNavigate('admin')}>
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </NavBtn>
          )}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className="text-xs text-blue-200 hidden sm:block">
            {user.username} · {roleLabel[user.role]}
          </span>
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-900 transition-colors"
            title={darkMode ? 'Hellmodus' : 'Dunkelmmodus'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-900 transition-colors"
            title="Abmelden"
          >
            <LogOut size={18} />
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
        active ? 'bg-white/20' : 'hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
