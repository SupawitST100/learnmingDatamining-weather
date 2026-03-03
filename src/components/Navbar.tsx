// src/components/Navbar.tsx  (replace existing)
import { Link, useLocation } from 'react-router-dom'
import { CloudRain, LayoutDashboard, Brain, Info, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/',           label: 'หน้าหลัก',  icon: CloudRain },
    { to: '/prediction', label: 'ทำนาย',      icon: Brain },
    { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    // { to: '/about',      label: 'เกี่ยวกับ',  icon: Info },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <CloudRain className="w-6 h-6 text-primary" />
          <span>WeatherML</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Mobile menu */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
