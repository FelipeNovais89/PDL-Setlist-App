import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         label: 'Home',    icon: '🏠' },
  { to: '/editor',   label: 'Editor',  icon: '🎵' },
  { to: '/database', label: 'Músicas', icon: '🎸' },
  { to: '/ocr',      label: 'OCR',     icon: '📷' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-950 border-t border-zinc-800 flex z-40 safe-area-bottom">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`
          }
        >
          <span className="text-xl leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
