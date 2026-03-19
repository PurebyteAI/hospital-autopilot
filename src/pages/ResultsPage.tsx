import { useParams, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  Download,
  Plus,
  Brain,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  MapPin,
  User,
  Hash,
  Clock,
  Building2,
  Stethoscope,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { AgentRun } from '../types/index'
import { useAgentRunById } from '../hooks/useCases'

/* ── Urgency config ───────────────────────────────────────────── */
function urgencyConfig(level?: string) {
  const l = (level ?? '').toUpperCase()
  if (l === 'URGENT')   return { cls: 'bg-destructive/20 text-destructive border-destructive/30',   dot: 'bg-destructive' }
  if (l === 'HIGH')     return { cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30',       dot: 'bg-orange-400' }
  if (l === 'MODERATE') return { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',       dot: 'bg-yellow-400' }
  return { cls: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' }
}

/* ── Section card ─────────────────────────────────────────────── */
function Section({
  icon: Icon,
  title,
  children,
  delay,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  delay: string
}) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden animate-fade-in-up ${delay}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <Icon size={14} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ── KV row ───────────────────────────────────────────────────── */
function KVRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-sm text-foreground text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

/* ── Timeline step ────────────────────────────────────────────── */
function TimelineStep({
  icon: Icon,
  label,
  status,
  isLast,
}: {
  icon: React.ElementType
  label: string
  status: 'done'
  isLast?: boolean
}) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center mb-2">
        <Icon size={14} className="text-green-400" />
      </div>
      <p className="text-xs font-medium text-foreground text-center">{label}</p>
      <CheckCircle2 size={12} className="text-green-400 mt-1" />
      {!isLast && (
        <div className="absolute top-4 left-1/2 w-full h-px bg-green-500/30" />
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { runId } = useParams({ from: '/results/$runId' })
  const navigate  = useNavigate()

  const { data: run, isLoading } = useAgentRunById(runId)

  const urgency = urgencyConfig(run?.urgencyLevel)
  const isApproved = run?.insuranceStatus === 'approved'

  const coveragePct =
    run?.insuranceNotes?.match(/(\d+)%/)
      ? parseInt(run.insuranceNotes.match(/(\d+)%/)![1])
      : isApproved ? 80 : 0

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in-up max-w-4xl mx-auto">
        {[1,2,3].map(i => (
          <div key={i} className="h-40 rounded-xl shimmer" />
        ))}
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 animate-fade-in-up">
        <AlertTriangle size={32} className="text-yellow-400" />
        <p className="text-foreground font-semibold">Run not found</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up max-w-4xl mx-auto">

      {/* ── Success banner ───────────────────────────────── */}
      <div className="relative overflow-hidden flex items-center gap-4 p-5 bg-green-500/8 border border-green-500/25 rounded-xl animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
        <div className="relative p-3 rounded-xl bg-green-500/15 border border-green-500/30">
          <CheckCircle2 size={22} className="text-green-400" />
        </div>
        <div className="relative flex-1">
          <p className="text-base font-bold text-foreground">Autopilot Complete ✓</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All 3 agents finished · Run ID: <span className="font-mono text-primary">{runId.slice(0, 16)}</span>
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => toast.success('Report downloaded!')}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
          >
            <Download size={13} />
            Download
          </button>
          <button
            onClick={() => navigate({ to: '/upload' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]"
          >
            <Plus size={13} />
            New Patient
          </button>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in-up stagger-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
          Agent Pipeline
        </p>
        <div className="flex items-start gap-0 relative">
          {[
            { icon: Brain, label: 'Clinical Analysis' },
            { icon: ShieldCheck, label: 'Insurance Auth' },
            { icon: CalendarClock, label: 'Scheduling' },
          ].map(({ icon, label }, i, arr) => (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              <div className="w-9 h-9 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center mb-2 z-10">
                {(() => {
                  const I = icon
                  return <I size={15} className="text-green-400" />
                })()}
              </div>
              <p className="text-xs font-medium text-foreground text-center">{label}</p>
              <CheckCircle2 size={11} className="text-green-400 mt-1" />
              {i < arr.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-green-500/30 z-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Three cards ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Clinical */}
        <Section icon={Brain} title="Clinical Analysis" delay="stagger-2">
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground leading-tight mb-2">
              {run.diagnosis || 'Unknown Diagnosis'}
            </p>

            {run.diagnosisCode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs font-mono text-primary mb-3">
                <Hash size={9} />
                ICD-10: {run.diagnosisCode}
              </span>
            )}

            <KVRow label="Procedure" value={run.recommendedProcedure} />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Urgency</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${urgency.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                {run.urgencyLevel || 'ROUTINE'}
              </span>
            </div>
          </div>
        </Section>

        {/* Insurance */}
        <Section icon={ShieldCheck} title="Insurance" delay="stagger-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                <Building2 size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {run.insuranceProvider || 'Unknown Provider'}
                </p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isApproved ? 'text-green-400' : 'text-destructive'}`}>
                  {isApproved ? '✓ Approved' : '✗ Denied'}
                </span>
              </div>
            </div>

            <KVRow label="Policy #" value={run.insurancePolicyNumber} mono />

            {/* Coverage bar */}
            <div className="py-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Coverage</span>
                <span className="text-foreground font-medium">{coveragePct}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isApproved ? 'bg-green-500' : 'bg-destructive'}`}
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
            </div>

            {run.insuranceNotes && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                {run.insuranceNotes}
              </p>
            )}
          </div>
        </Section>

        {/* Scheduling */}
        <Section icon={CalendarClock} title="Appointment" delay="stagger-4">
          <div className="space-y-1">
            <div className="text-center py-2 mb-2 bg-secondary/60 rounded-lg border border-border">
              <p className="text-2xl font-bold text-primary tabular-nums">
                {run.scheduledTime || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {run.scheduledDate || '—'}
              </p>
            </div>

            <div className="flex items-center gap-2 py-1.5">
              <User size={12} className="text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-medium">{run.scheduledDoctor || '—'}</span>
            </div>
            <div className="flex items-center gap-2 py-1.5 border-t border-border/50">
              <MapPin size={12} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-foreground">{run.scheduledLocation || '—'}</span>
            </div>
            {run.confirmationNumber && (
              <div className="flex items-center gap-2 py-1.5 border-t border-border/50">
                <Hash size={12} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-mono text-primary">{run.confirmationNumber}</span>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 animate-fade-in-up stagger-5">
        <button
          onClick={() => navigate({ to: '/history' })}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
        >
          <Clock size={13} />
          View History
        </button>
        <button
          onClick={() => navigate({ to: '/upload' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-[var(--shadow-glow)]"
        >
          <Plus size={14} />
          New Patient
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
