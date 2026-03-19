import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import type { PatientCase, AgentRun } from '../types'

// Query keys
const QUERY_KEYS = {
  cases: ['cases'] as const,
  case: (id: string) => ['cases', id] as const,
  agentRun: (caseId: string) => ['agentRuns', 'byCaseId', caseId] as const,
  agentRuns: ['agentRuns'] as const,
}

// ── List all patient cases ──────────────────────────────────────────────────
export function useCases() {
  return useQuery({
    queryKey: QUERY_KEYS.cases,
    queryFn: async () => {
      const cases = await blink.db.table<PatientCase>('patient_cases').list({
        orderBy: { createdAt: 'desc' },
      })
      return cases as PatientCase[]
    },
  })
}

// ── Get a single patient case ───────────────────────────────────────────────
export function useCase(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.case(id),
    queryFn: async () => {
      const record = await blink.db.table<PatientCase>('patient_cases').get(id)
      return record as PatientCase | null
    },
    enabled: Boolean(id),
  })
}

// ── Get agent run by case ID ────────────────────────────────────────────────
export function useAgentRun(caseId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.agentRun(caseId),
    queryFn: async () => {
      const runs = await blink.db.table<AgentRun>('agent_runs').list({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      })
      return (runs[0] as AgentRun) ?? null
    },
    enabled: Boolean(caseId),
  })
}

// ── List all agent runs ─────────────────────────────────────────────────────
export function useAgentRuns() {
  return useQuery({
    queryKey: QUERY_KEYS.agentRuns,
    queryFn: async () => {
      const runs = await blink.db.table<AgentRun>('agent_runs').list({
        orderBy: { createdAt: 'desc' },
      })
      return runs as AgentRun[]
    },
  })
}

// ── Get agent run by run ID ─────────────────────────────────────────────────
export function useAgentRunById(runId: string) {
  return useQuery({
    queryKey: ['agentRuns', 'byId', runId] as const,
    queryFn: async () => {
      const record = await blink.db.table<AgentRun>('agent_runs').get(runId)
      return record as AgentRun | null
    },
    enabled: Boolean(runId),
  })
}

// ── Invalidation helpers (used by mutations elsewhere) ─────────────────────
export function useInvalidateCases() {
  const queryClient = useQueryClient()
  return {
    invalidateCases: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases }),
    invalidateCase: (id: string) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.case(id) }),
    invalidateAgentRun: (caseId: string) =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentRun(caseId) }),
    invalidateAgentRuns: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentRuns }),
  }
}
