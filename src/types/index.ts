export interface PatientCase {
  id: string
  userId: string
  patientName: string
  patientAge: string
  patientId: string
  fileName: string
  fileUrl: string
  fileText: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface AgentRun {
  id: string
  caseId: string
  userId: string
  status: 'running' | 'completed' | 'failed'
  diagnosis: string
  diagnosisCode: string
  recommendedProcedure: string
  urgencyLevel: string
  insuranceProvider: string
  insurancePolicyNumber: string
  insuranceStatus: 'approved' | 'denied' | 'pending'
  insuranceNotes: string
  scheduledDate: string
  scheduledTime: string
  scheduledDoctor: string
  scheduledLocation: string
  confirmationNumber: string
  agentLogs: string
  createdAt: string
  completedAt: string
}

export interface AgentLog {
  id: string
  timestamp: string
  agent: 'orchestrator' | 'clinical' | 'insurance' | 'scheduling'
  message: string
  status: 'info' | 'success' | 'error' | 'thinking'
}

export interface AgentStatus {
  clinical: 'idle' | 'running' | 'done' | 'error'
  insurance: 'idle' | 'running' | 'done' | 'error'
  scheduling: 'idle' | 'running' | 'done' | 'error'
}
