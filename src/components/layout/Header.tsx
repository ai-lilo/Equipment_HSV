import { LogOut, ShieldCheck, LayoutDashboard, ShoppingCart, Trophy } from 'lucide-react'
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
    <header className="bg-navy-700 shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="HSV Pegnitz 03 e.V."
          className="h-8 w-8 object-contain shrink-0"
        />
        <span className="font-bold text-lg tracking-tight text-white hidden sm:block">HSV Pegnitz</span>

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
          <span className="text-xs text-navy-100 hidden sm:block">
            {user.username} · {roleLabel[user.role]}
          </span>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-navy-100 hover:bg-navy-800 transition-colors"
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
          ? 'bg-navy-800 text-white'
          : 'text-navy-100 hover:bg-navy-800 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
