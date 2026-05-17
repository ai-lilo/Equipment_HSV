import { Dog, LogOut, ShieldCheck, LayoutDashboard, ShoppingCart, Trophy } from 'lucide-react'
import type { User } from '../../types'

interface Props {
  user: User
  page: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

const roleLabel: Record<string, string> = {
  VISITOR: 'Mitglied',
  MEMBER: 'Vorstandschaft',
  ADMIN: 'Admin',
}

export default function Header({ user, page, onNavigate, onLogout }: Props) {
  return (
    <header className="bg-blue-50 dark:bg-gray-900 border-b border-blue-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <Dog size={24} className="shrink-0 text-blue-800 dark:text-blue-400" />
        <span className="font-bold text-lg tracking-tight text-blue-800 dark:text-white hidden sm:block">HSV Pegnitz</span>

        <nav className="flex gap-1 ml-2 flex-1">
          <NavBtn active={page === 'dashboard'} onClick={() => onNavigate('dashboard')}>
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Inventar</span>
          </NavBtn>
          {(user.role === 'MEMBER' || user.role === 'ADMIN') && (
            <NavBtn active={page === 'shopping-list'} onClick={() => onNavigate('shopping-list')}>
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Einkaufsliste</span>
            </NavBtn>
          )}
          <NavBtn active={page === 'turnier'} onClick={() => onNavigate('turnier')}>
            <Trophy size={16} />
            <span className="hidden sm:inline">Veranstaltung</span>
          </NavBtn>
          {user.role === 'ADMIN' && (
            <NavBtn active={page === 'admin'} onClick={() => onNavigate('admin')}>
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </NavBtn>
          )}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className="text-xs text-blue-600 dark:text-blue-200 hidden sm:block">
            {user.username} · {roleLabel[user.role]}
          </span>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-blue-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-white/10 transition-colors"
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
        active
          ? 'bg-blue-100 text-blue-800 dark:bg-white/20 dark:text-white'
          : 'text-blue-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
