import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Upload,
  Activity,
  Settings,
  Plus,
  Cpu,
} from 'lucide-react'
import { Outlet } from '@tanstack/react-router'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/' },
  { icon: Upload,          label: 'New Patient',  to: '/upload' },
  { icon: Activity,        label: 'Case History', to: '/history' },
  { icon: Settings,        label: 'Settings',     to: '/settings' },
]

const pageTitles: Record<string, string> = {
  '/':         'Dashboard',
  '/upload':   'New Patient',
  '/history':  'Case History',
  '/settings': 'Settings',
}

function getTitle(pathname: string): string {
  if (pathname.startsWith('/run/'))     return 'Agent Execution'
  if (pathname.startsWith('/results/')) return 'Results'
  return pageTitles[pathname] ?? 'Hospital Autopilot'
}

export default function AppLayout() {
  const routerState = useRouterState()
  const pathname    = routerState.location.pathname

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className="w-64 h-screen flex flex-col flex-shrink-0 border-r border-border"
        style={{ background: 'hsl(var(--sidebar))' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <span className="text-base">🏥</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground tracking-tight">
              Hospital
            </p>
            <p className="text-xs font-semibold leading-tight text-primary tracking-wider uppercase">
              Autopilot
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ icon: Icon, label, to }) => {
            const isActive =
              to === '/'
                ? pathname === '/'
                : pathname.startsWith(to)

            return (
              <Link
                key={to}
                to={to}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                ].join(' ')}
              >
                <Icon
                  size={16}
                  className={[
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  ].join(' ')}
                />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer badge */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border">
            <Cpu size={12} className="text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-mono">
              Powered by Amazon Nova
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border glass flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-foreground">
              {getTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* System status */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-muted-foreground font-medium">System Online</span>
            </div>

            <div className="w-px h-5 bg-border" />

            {/* New patient CTA */}
            <Link to="/upload">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]">
                <Plus size={14} />
                New Patient
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
