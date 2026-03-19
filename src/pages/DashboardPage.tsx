import { Link } from '@tanstack/react-router'
import {
  FileText,
  CheckCircle,
  Zap,
  Bot,
  ArrowRight,
  Brain,
  ShieldCheck,
  CalendarClock,
  UploadCloud,
  Clock,
  TrendingUp,
} from 'lucide-react'

import { useCases, useAgentRuns } from '../hooks/useCases'

const agents = [
  {
    icon: Brain,
    name: 'Clinical Agent',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    description: 'Analyzes patient reports, extracts diagnoses, ICD-10 codes, and recommends procedures using medical AI.',
  },
  {
    icon: ShieldCheck,
    name: 'Insurance Agent',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
    description: 'Validates insurance coverage, submits pre-authorization requests, and returns approval status.',
  },
  {
    icon: CalendarClock,
    name: 'Scheduling Agent',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    description: 'Books the optimal appointment slot, assigns surgeon and OR room, sends confirmation.',
  },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'Pending',    cls: 'bg-muted text-muted-foreground' },
    processing: { label: 'Processing', cls: 'bg-primary/20 text-primary' },
    completed:  { label: 'Completed',  cls: 'bg-green-500/20 text-green-400' },
    failed:     { label: 'Failed',     cls: 'bg-destructive/20 text-destructive' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function InsuranceBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '✓ Approved', cls: 'bg-green-500/20 text-green-400' },
    denied:   { label: '✗ Denied',   cls: 'bg-destructive/20 text-destructive' },
    pending:  { label: '⏳ Pending',  cls: 'bg-yellow-500/20 text-yellow-400' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  delay: string
}) {
  return (
    <div
      className={`animate-fade-in-up ${delay} bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color} mb-3`}>
          <Icon size={18} />
        </div>
        <TrendingUp size={14} className="text-muted-foreground/40" />
      </div>
      <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: cases = [], isLoading: casesLoading } = useCases()
  const { data: runs = [], isLoading: runsLoading } = useAgentRuns()

  const totalCases    = cases.length
  const approvedCount = runs.filter(r => r.insuranceStatus === 'approved').length
  const recentCases   = [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  const isLoading = casesLoading || runsLoading

  const runByCase: Record<string, (typeof runs)[number]> = {}
  for (const r of runs) runByCase[r.caseId] = r

  const isEmpty = !isLoading && totalCases === 0

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-7xl mx-auto">

      {/* ── Stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Cases"
          value={isLoading ? '…' : totalCases}
          sub="All time"
          color="bg-primary/10 border border-primary/20 text-primary"
          delay="stagger-1"
        />
        <StatCard
          icon={CheckCircle}
          label="Authorizations Approved"
          value={isLoading ? '…' : approvedCount}
          sub="Insurance approved"
          color="bg-green-500/10 border border-green-500/20 text-green-400"
          delay="stagger-2"
        />
        <StatCard
          icon={Clock}
          label="Avg Processing Time"
          value="< 30s"
          sub="Per case"
          color="bg-accent/10 border border-accent/20 text-accent"
          delay="stagger-3"
        />
        <StatCard
          icon={Bot}
          label="Agents Active"
          value="3"
          sub="Clinical · Insurance · Scheduling"
          color="bg-yellow-400/10 border border-yellow-400/20 text-yellow-400"
          delay="stagger-4"
        />
      </div>

      {/* ── Empty state ───────────────────────────────────── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 px-8 bg-card border border-border rounded-xl animate-fade-in-up stagger-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <Zap size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No cases yet</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Upload your first patient report to see the AI agents in action.
            Processing takes under 30 seconds.
          </p>
          <Link to="/upload">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]">
              <UploadCloud size={16} />
              Upload First Patient
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}

      {/* ── Two-column content ────────────────────────────── */}
      {!isEmpty && (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Recent cases table (3/5) */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Recent Cases</h2>
              </div>
              <Link to="/history" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 rounded-lg shimmer" />
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Patient</th>
                    <th className="text-left px-3 py-3 text-xs text-muted-foreground font-medium">Date</th>
                    <th className="text-left px-3 py-3 text-xs text-muted-foreground font-medium">Insurance</th>
                    <th className="text-left px-3 py-3 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c, i) => {
                    const run = runByCase[c.id]
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-border/50 hover:bg-secondary/50 transition-colors animate-fade-in-up`}
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-foreground">{c.patientName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.patientId}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-3 py-3">
                          <InsuranceBadge status={run?.insuranceStatus} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          {run?.id && (
                            <Link
                              to="/results/$runId"
                              params={{ runId: run.id }}
                              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 justify-end transition-colors"
                            >
                              View <ArrowRight size={10} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Agent activity (2/5) */}
          <div className="lg:col-span-2 space-y-3 animate-fade-in-up stagger-4">
            <div className="flex items-center gap-2 px-1">
              <Bot size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Active Agents</h2>
            </div>

            {agents.map(({ icon: Icon, name, color, bg, description }, i) => (
              <div
                key={name}
                className={`bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up`}
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${bg} flex-shrink-0`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
