import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Brain,
  ShieldCheck,
  CalendarClock,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Terminal,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { AgentLog, AgentStatus } from '../types/index'
import { useCase, useAgentRun, useInvalidateCases } from '../hooks/useCases'
import { runHospitalAutopilot } from '../lib/agentOrchestrator'
import { blink } from '../blink/client'

/* ── Agent meta ───────────────────────────────────────────────── */
const AGENT_META = {
  clinical: {
    icon: Brain,
    label: 'Clinical Agent',
    idleTask: 'Awaiting patient report…',
    runningTask: 'Analyzing patient report…',
    doneTask: 'Diagnosis extracted ✓',
    errorTask: 'Analysis failed',
    runningBg: 'bg-primary/10 border-primary/30',
    runningColor: 'text-primary',
  },
  insurance: {
    icon: ShieldCheck,
    label: 'Insurance Agent',
    idleTask: 'Waiting for clinical output…',
    runningTask: 'Validating coverage…',
    doneTask: 'Authorization complete ✓',
    errorTask: 'Validation failed',
    runningBg: 'bg-yellow-400/10 border-yellow-400/30',
    runningColor: 'text-yellow-400',
  },
  scheduling: {
    icon: CalendarClock,
    label: 'Scheduling Agent',
    idleTask: 'Awaiting insurance clearance…',
    runningTask: 'Booking appointment…',
    doneTask: 'Appointment booked ✓',
    errorTask: 'Scheduling failed',
    runningBg: 'bg-green-400/10 border-green-400/30',
    runningColor: 'text-green-400',
  },
} as const

type AgentKey = keyof typeof AGENT_META

/* ── Log color by agent ───────────────────────────────────────── */
const agentColor: Record<string, string> = {
  orchestrator: 'text-foreground',
  clinical:     'text-primary',
  insurance:    'text-yellow-400',
  scheduling:   'text-green-400',
}

const statusIcon: Record<string, string> = {
  info:     'ℹ',
  success:  '✓',
  error:    '✗',
  thinking: '⟳',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return [
    d.getHours().toString().padStart(2, '0'),
    d.getMinutes().toString().padStart(2, '0'),
    d.getSeconds().toString().padStart(2, '0'),
  ].join(':')
}

/* ── Agent status card ────────────────────────────────────────── */
function AgentCard({
  agentKey,
  status,
}: {
  agentKey: AgentKey
  status: 'idle' | 'running' | 'done' | 'error'
}) {
  const meta = AGENT_META[agentKey]
  const Icon = meta.icon

  const taskLabel =
    status === 'idle'    ? meta.idleTask :
    status === 'running' ? meta.runningTask :
    status === 'done'    ? meta.doneTask :
    meta.errorTask

  const cardStyle =
    status === 'idle'    ? 'border-border bg-card' :
    status === 'running' ? `border-primary/30 bg-primary/5` :
    status === 'done'    ? 'border-green-500/30 bg-green-500/5' :
    'border-destructive/30 bg-destructive/5'

  const iconColor =
    status === 'idle'    ? 'text-muted-foreground' :
    status === 'running' ? meta.runningColor :
    status === 'done'    ? 'text-green-400' :
    'text-destructive'

  const badgeCls =
    status === 'idle'    ? 'bg-muted text-muted-foreground' :
    status === 'running' ? 'bg-primary/20 text-primary' :
    status === 'done'    ? 'bg-green-500/20 text-green-400' :
    'bg-destructive/20 text-destructive'

  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${cardStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2 rounded-lg border flex-shrink-0 ${
            status === 'running' ? meta.runningBg : 'border-border bg-secondary'
          }`}>
            <Icon
              size={15}
              className={[
                iconColor,
                status === 'running' ? 'animate-pulse' : '',
              ].join(' ')}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{meta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{taskLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'running' && (
            <Loader2 size={12} className="animate-spin text-primary" />
          )}
          {status === 'done' && (
            <CheckCircle2 size={13} className="text-green-400" />
          )}
          {status === 'error' && (
            <XCircle size={13} className="text-destructive" />
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeCls}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export default function AgentRunPage() {
  const { caseId } = useParams({ from: '/run/$caseId' })
  const navigate    = useNavigate()
  const { invalidateAgentRun, invalidateCase, invalidateCases } = useInvalidateCases()

  const { data: caseData } = useCase(caseId)
  const { data: existingRun, refetch: refetchRun } = useAgentRun(caseId)

  const [logs,      setLogs]      = useState<AgentLog[]>([])
  const [statuses,  setStatuses]  = useState<AgentStatus>({ clinical: 'idle', insurance: 'idle', scheduling: 'idle' })
  const [isRunning, setIsRunning] = useState(false)
  const [completedRunId, setCompletedRunId] = useState<string | null>(null)

  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // If run already completed, show results CTA
  useEffect(() => {
    if (existingRun?.status === 'completed') {
      setCompletedRunId(existingRun.id)
    }
  }, [existingRun])

  const addLog = useCallback((log: AgentLog) => {
    setLogs(prev => [...prev, log])
    // Update agent statuses based on log agent + status
    if (log.status === 'thinking' || log.status === 'info') {
      setStatuses(prev => {
        if (log.agent === 'clinical' && prev.clinical === 'idle') return { ...prev, clinical: 'running' }
        if (log.agent === 'insurance' && prev.insurance === 'idle') return { ...prev, insurance: 'running' }
        if (log.agent === 'scheduling' && prev.scheduling === 'idle') return { ...prev, scheduling: 'running' }
        return prev
      })
    }
    if (log.agent === 'clinical' && log.status === 'success') {
      setStatuses(prev => ({ ...prev, clinical: prev.clinical === 'running' ? 'running' : prev.clinical }))
    }
  }, [])

  const handleRun = async () => {
    if (isRunning) return
    setIsRunning(true)
    setLogs([])
    setStatuses({ clinical: 'idle', insurance: 'idle', scheduling: 'idle' })
    setCompletedRunId(null)

    const fileText = caseData?.fileText ?? ''
    const patientName = caseData?.patientName ?? 'Unknown Patient'

    // Update case status to processing
    try {
      await blink.db.table('patient_cases').update(caseId, { status: 'processing' })
    } catch {}

    try {
      await runHospitalAutopilot({
        caseId,
        fileText,
        patientName,
        onLog: (log) => {
          addLog(log)
          // Track agent phase transitions
          if (log.agent === 'insurance' && log.status === 'thinking') {
            setStatuses(prev => ({ ...prev, clinical: 'done', insurance: 'running' }))
          }
          if (log.agent === 'scheduling' && log.status === 'thinking') {
            setStatuses(prev => ({ ...prev, insurance: 'done', scheduling: 'running' }))
          }
          if (log.agent === 'orchestrator' && log.message.includes('complete')) {
            setStatuses({ clinical: 'done', insurance: 'done', scheduling: 'done' })
          }
        },
        onComplete: (run) => {
          setCompletedRunId(run.id)
          setIsRunning(false)
          setStatuses({ clinical: 'done', insurance: 'done', scheduling: 'done' })
          invalidateAgentRun(caseId)
          invalidateCase(caseId)
          invalidateCases()
          toast.success('Autopilot complete! All agents finished.')
        },
      })
    } catch (err) {
      setIsRunning(false)
      setStatuses(prev => ({
        ...prev,
        clinical: prev.clinical === 'running' ? 'error' : prev.clinical,
        insurance: prev.insurance === 'running' ? 'error' : prev.insurance,
        scheduling: prev.scheduling === 'running' ? 'error' : prev.scheduling,
      }))
      toast.error('Agent run failed. Please try again.')
    }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in-up max-w-6xl mx-auto">

      {/* ── Case banner ─────────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <User size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {caseData?.patientName ?? 'Loading…'}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Case ID: {caseId} · Status: {caseData?.status ?? '—'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {completedRunId ? (
            <button
              onClick={() => navigate({ to: '/results/$runId', params: { runId: completedRunId } })}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-sm font-semibold hover:bg-green-500/25 transition-all duration-150"
            >
              View Results <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]"
            >
              {isRunning ? (
                <><Loader2 size={14} className="animate-spin" /> Running…</>
              ) : (
                <><Play size={14} /> Run Autopilot</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Main two-column layout ───────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Log feed (3/5) */}
        <div className="lg:col-span-3 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border flex-shrink-0">
            <Terminal size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Agent Log</span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {logs.length} entries
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 min-h-[380px] max-h-[480px]">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <Terminal size={20} className="text-muted-foreground/40" />
                <p className="text-muted-foreground/60 text-center">
                  Click &quot;Run Autopilot&quot; to begin agent execution…
                </p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={log.id ?? i}
                  className="flex items-start gap-2 py-0.5 animate-fade-in"
                >
                  <span className="text-muted-foreground/50 flex-shrink-0 tabular-nums">
                    [{formatTime(log.timestamp)}]
                  </span>
                  <span className={`flex-shrink-0 uppercase font-medium ${agentColor[log.agent] ?? 'text-foreground'}`}>
                    [{log.agent.toUpperCase().slice(0, 5).padEnd(5)}]
                  </span>
                  <span className={`flex-shrink-0 ${
                    log.status === 'success'  ? 'text-green-400'  :
                    log.status === 'error'    ? 'text-destructive' :
                    log.status === 'thinking' ? 'text-primary'    :
                    'text-muted-foreground'
                  }`}>
                    {statusIcon[log.status] ?? 'ℹ'}
                  </span>
                  <span className="text-foreground/85 leading-relaxed">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Agent cards (2/5) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Status</span>
          </div>

          {(Object.keys(AGENT_META) as AgentKey[]).map((key, i) => (
            <div key={key} className={`animate-fade-in-up stagger-${i + 1}`}>
              <AgentCard agentKey={key} status={statuses[key]} />
            </div>
          ))}

          {/* Pipeline viz */}
          <div className="mt-4 p-4 bg-card border border-border rounded-xl">
            <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">Pipeline</p>
            <div className="flex items-center gap-2">
              {(Object.keys(AGENT_META) as AgentKey[]).map((key, i) => (
                <div key={key} className="flex items-center gap-2 flex-1">
                  <div className={[
                    'flex-1 h-1.5 rounded-full transition-all duration-500',
                    statuses[key] === 'done'    ? 'bg-green-500'  :
                    statuses[key] === 'running' ? 'bg-primary animate-pulse' :
                    statuses[key] === 'error'   ? 'bg-destructive' :
                    'bg-border',
                  ].join(' ')} />
                  {i < 2 && (
                    <ArrowRight size={10} className="text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {(Object.keys(AGENT_META) as AgentKey[]).map(key => (
                <span key={key} className="text-[10px] text-muted-foreground capitalize">{key}</span>
              ))}
            </div>
          </div>

          {/* View Results — bottom CTA when done */}
          {completedRunId && (
            <button
              onClick={() => navigate({ to: '/results/$runId', params: { runId: completedRunId } })}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/25 active:scale-[0.98] transition-all duration-150 animate-fade-in"
            >
              View Results <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
