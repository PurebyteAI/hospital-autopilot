import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'

import AppLayout    from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import UploadPage   from './pages/UploadPage'
import AgentRunPage from './pages/AgentRunPage'
import ResultsPage  from './pages/ResultsPage'
import HistoryPage  from './pages/HistoryPage'

/* ── Root route (wraps everything in AppLayout) ─────────────── */
const rootRoute = createRootRoute({
  component: () => (
    <AppLayout />
  ),
})

/* ── Child routes ────────────────────────────────────────────── */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadPage,
})

const agentRunRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/run/$caseId',
  component: AgentRunPage,
})

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/results/$runId',
  component: ResultsPage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
})

/* ── Settings placeholder ────────────────────────────────────── */
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <div className="p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-fade-in-up">
      <span className="text-3xl">⚙️</span>
      <p className="font-medium text-foreground">Settings</p>
      <p className="text-sm">Coming soon</p>
    </div>
  ),
})

/* ── Route tree ──────────────────────────────────────────────── */
const routeTree = rootRoute.addChildren([
  indexRoute,
  uploadRoute,
  agentRunRoute,
  resultsRoute,
  historyRoute,
  settingsRoute,
])

/* ── Router ──────────────────────────────────────────────────── */
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
