import { Link } from '@tanstack/react-router'
import {
  Activity,
  UploadCloud,
  ArrowRight,
  ChevronRight,
  Calendar,
  Hash,
  User,
} from 'lucide-react'

import { useCases, useAgentRuns } from '../hooks/useCases'

/* ── Status badges ────────────────────────────────────────────── */
function CaseBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    'bg-muted text-muted-foreground',
    processing: 'bg-primary/20 text-primary',
    completed:  'bg-green-500/20 text-green-400',
    failed:     'bg-destructive/20 text-destructive',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  )
}

function InsuranceBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>
  const map: Record<string, string> = {
    approved: 'bg-green-500/20 text-green-400',
    denied:   'bg-destructive/20 text-destructive',
    pending:  'bg-yellow-500/20 text-yellow-400',
  }
  const label = { approved: '✓ Approved', denied: '✗ Denied', pending: '⏳ Pending' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
      {label[status as keyof typeof label] ?? status}
    </span>
  )
}

/* ── Skeleton row ─────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 rounded shimmer" style={{ width: `${50 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function HistoryPage() {
  const { data: cases = [], isLoading: casesLoading } = useCases()
  const { data: runs  = [], isLoading: runsLoading  } = useAgentRuns()

  const isLoading = casesLoading || runsLoading

  const runByCase: Record<string, (typeof runs)[number]> = {}
  for (const r of runs) runByCase[r.caseId] = r

  const sorted = [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const isEmpty = !isLoading && sorted.length === 0

  return (
    <div className="p-6 animate-fade-in-up max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Activity size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Case History</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '…' : `${sorted.length} cases total`}
            </p>
          </div>
        </div>

        <Link to="/upload">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]">
            <UploadCloud size={13} />
            New Patient
          </button>
        </Link>
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Activity size={24} className="text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-semibold text-foreground mb-1">No cases yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload your first patient report to get started with automated processing.
              </p>
            </div>
            <Link to="/upload">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]">
                <UploadCloud size={14} />
                Upload First Patient
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        )}

        {/* Table */}
        {!isEmpty && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><Hash size={10} /> Case ID</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><User size={10} /> Patient</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><Calendar size={10} /> Date</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Diagnosis</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Insurance</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-5 py-3 text-xs text-muted-foreground font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                ) : (
                  sorted.map((c, i) => {
                    const run = runByCase[c.id]
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/40 hover:bg-secondary/30 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        {/* Case ID */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-mono text-primary/80">
                            {c.id.slice(0, 12)}…
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-foreground">{c.patientName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.patientId}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>

                        {/* Diagnosis */}
                        <td className="px-4 py-3.5">
                          {run?.diagnosis ? (
                            <span className="text-sm text-foreground">{run.diagnosis}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Insurance */}
                        <td className="px-4 py-3.5">
                          <InsuranceBadge status={run?.insuranceStatus} />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <CaseBadge status={c.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {run?.id ? (
                              <Link
                                to="/results/$runId"
                                params={{ runId: run.id }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-all duration-150"
                              >
                                Results <ChevronRight size={11} />
                              </Link>
                            ) : (
                              <Link
                                to="/run/$caseId"
                                params={{ caseId: c.id }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-secondary border border-border text-muted-foreground rounded-lg text-xs font-medium hover:text-foreground hover:border-primary/30 transition-all duration-150"
                              >
                                Run <ChevronRight size={11} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
