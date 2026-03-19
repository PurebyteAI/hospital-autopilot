import { blink } from '../blink/client'
import type { AgentLog, AgentRun } from '../types'

const CLINICAL_SYSTEM_PROMPT = `You are an expert clinical AI agent for Hospital Autopilot. Analyze patient reports and extract:
1. Primary diagnosis with ICD-10 code
2. Recommended procedure/surgery
3. Urgency level (URGENT/HIGH/MODERATE/ROUTINE)
4. Brief clinical reasoning

Respond in this EXACT JSON format:
{
  "diagnosis": "Primary diagnosis name",
  "diagnosisCode": "ICD-10 code e.g. M23.61",
  "recommendedProcedure": "Procedure name",
  "urgencyLevel": "HIGH",
  "clinicalReasoning": "Brief explanation"
}`

const INSURANCE_SYSTEM_PROMPT = `You are an expert insurance validation AI agent for Hospital Autopilot. Based on the procedure and patient data provided, evaluate insurance eligibility and pre-authorization.

Use these mock insurance providers and rules:
- BlueCross BlueShield: Covers most orthopedic surgeries, knee procedures, cardiac. Pre-auth required for elective.
- Aetna: Covers most procedures. Pre-auth required for surgeries over $5000.
- UnitedHealth: Broad coverage. Pre-auth for inpatient stays.
- Medicare: Covers most medically necessary procedures for eligible patients.
- Medicaid: Covers medically necessary procedures based on state guidelines.

Assign a random insurance provider from the list if not specified.

Respond in this EXACT JSON format:
{
  "insuranceProvider": "BlueCross BlueShield",
  "policyNumber": "BCB-" followed by 8 random digits,
  "status": "approved",
  "preAuthCode": "PA-" followed by 6 random chars,
  "coveragePercent": 80,
  "notes": "Pre-authorization approved. Patient responsible for 20% co-insurance."
}`

const SCHEDULING_SYSTEM_PROMPT = `You are an expert scheduling AI agent for Hospital Autopilot. Based on the procedure urgency and type, schedule the patient for their procedure.

Available doctors and specialties:
- Dr. Sarah Chen (Orthopedic Surgery) - available Mon/Wed/Fri
- Dr. Michael Torres (Cardiology) - available Tue/Thu
- Dr. Emily Rodriguez (General Surgery) - available Mon/Tue/Thu
- Dr. James Kim (Neurosurgery) - available Wed/Fri
- Dr. Lisa Patel (Oncology) - available Mon-Thu

Schedule based on urgency:
- URGENT: Within 2-3 days
- HIGH: Within 1 week
- MODERATE: Within 2 weeks  
- ROUTINE: Within 4-6 weeks

Available locations: Memorial Hospital Main Campus, North Medical Center, South Surgery Center

Generate a realistic future date. Today is ${new Date().toLocaleDateString()}.

Respond in this EXACT JSON format:
{
  "scheduledDate": "March 25, 2026",
  "scheduledTime": "9:30 AM",
  "doctor": "Dr. Sarah Chen",
  "specialty": "Orthopedic Surgery",
  "location": "Memorial Hospital Main Campus",
  "operatingRoom": "OR-4",
  "confirmationNumber": "CONF-" followed by 6 random digits,
  "preOpInstructions": "Brief pre-op instructions for the patient"
}`

function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function makeLog(
  agent: AgentLog['agent'],
  message: string,
  status: AgentLog['status']
): AgentLog {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    agent,
    message,
    status,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Try to find first { ... } block
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1)
  }
  return raw.trim()
}

interface RunHospitalAutopilotParams {
  caseId: string
  fileText: string
  patientName: string
  onLog: (log: AgentLog) => void
  onComplete: (run: AgentRun) => void
}

interface ClinicalResult {
  diagnosis: string
  diagnosisCode: string
  recommendedProcedure: string
  urgencyLevel: string
  clinicalReasoning: string
}

interface InsuranceResult {
  insuranceProvider: string
  policyNumber: string
  status: string
  preAuthCode: string
  coveragePercent: number
  notes: string
}

interface SchedulingResult {
  scheduledDate: string
  scheduledTime: string
  doctor: string
  specialty: string
  location: string
  operatingRoom: string
  confirmationNumber: string
  preOpInstructions: string
}

export async function runHospitalAutopilot({
  caseId,
  fileText,
  patientName,
  onLog,
  onComplete,
}: RunHospitalAutopilotParams): Promise<void> {
  // --- Orchestrator init ---
  onLog(makeLog('orchestrator', 'Initializing Hospital Autopilot...', 'info'))
  await delay(500)
  onLog(makeLog('orchestrator', `Processing case for patient: ${patientName}`, 'info'))
  await delay(500)

  // -------------------------
  // CLINICAL AGENT
  // -------------------------
  onLog(makeLog('clinical', 'Clinical agent starting analysis...', 'thinking'))
  await delay(500)
  onLog(makeLog('clinical', 'Analyzing patient report and medical history...', 'thinking'))
  await delay(500)

  let clinicalResult: ClinicalResult = {
    diagnosis: 'Unspecified Condition',
    diagnosisCode: 'Z99.9',
    recommendedProcedure: 'General Evaluation',
    urgencyLevel: 'ROUTINE',
    clinicalReasoning: 'Unable to extract clinical data from report.',
  }

  try {
    const { text: clinicalRaw } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Patient Name: ${patientName}\n\nMedical Report:\n${fileText}`,
        },
      ],
      maxTokens: 512,
    })

    const parsed = JSON.parse(extractJson(clinicalRaw)) as ClinicalResult
    clinicalResult = {
      diagnosis: parsed.diagnosis ?? clinicalResult.diagnosis,
      diagnosisCode: parsed.diagnosisCode ?? clinicalResult.diagnosisCode,
      recommendedProcedure: parsed.recommendedProcedure ?? clinicalResult.recommendedProcedure,
      urgencyLevel: parsed.urgencyLevel ?? clinicalResult.urgencyLevel,
      clinicalReasoning: parsed.clinicalReasoning ?? clinicalResult.clinicalReasoning,
    }
  } catch (err) {
    onLog(makeLog('clinical', `Warning: Could not fully parse clinical response. Using defaults. ${err}`, 'error'))
  }

  await delay(500)
  onLog(makeLog('clinical', `Diagnosis: ${clinicalResult.diagnosis} (${clinicalResult.diagnosisCode})`, 'success'))
  await delay(300)
  onLog(makeLog('clinical', `Recommended Procedure: ${clinicalResult.recommendedProcedure}`, 'success'))
  await delay(300)
  onLog(makeLog('clinical', `Urgency Level: ${clinicalResult.urgencyLevel}`, 'success'))
  await delay(300)
  onLog(makeLog('clinical', `Clinical Reasoning: ${clinicalResult.clinicalReasoning}`, 'info'))
  await delay(500)

  // -------------------------
  // INSURANCE AGENT
  // -------------------------
  onLog(makeLog('insurance', 'Insurance agent starting eligibility check...', 'thinking'))
  await delay(500)
  onLog(makeLog('insurance', `Verifying coverage for: ${clinicalResult.recommendedProcedure}`, 'thinking'))
  await delay(500)

  let insuranceResult: InsuranceResult = {
    insuranceProvider: 'BlueCross BlueShield',
    policyNumber: `BCB-${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: 'pending',
    preAuthCode: `PA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    coveragePercent: 80,
    notes: 'Manual review required.',
  }

  try {
    const { text: insuranceRaw } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: INSURANCE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Patient: ${patientName}\nDiagnosis: ${clinicalResult.diagnosis} (${clinicalResult.diagnosisCode})\nProcedure: ${clinicalResult.recommendedProcedure}\nUrgency: ${clinicalResult.urgencyLevel}`,
        },
      ],
      maxTokens: 512,
    })

    const parsed = JSON.parse(extractJson(insuranceRaw)) as InsuranceResult
    insuranceResult = {
      insuranceProvider: parsed.insuranceProvider ?? insuranceResult.insuranceProvider,
      policyNumber: parsed.policyNumber ?? insuranceResult.policyNumber,
      status: parsed.status ?? insuranceResult.status,
      preAuthCode: parsed.preAuthCode ?? insuranceResult.preAuthCode,
      coveragePercent: parsed.coveragePercent ?? insuranceResult.coveragePercent,
      notes: parsed.notes ?? insuranceResult.notes,
    }
  } catch (err) {
    onLog(makeLog('insurance', `Warning: Could not fully parse insurance response. Using defaults. ${err}`, 'error'))
  }

  const insuranceStatusLabel =
    insuranceResult.status === 'approved'
      ? 'APPROVED'
      : insuranceResult.status === 'denied'
        ? 'DENIED'
        : 'PENDING'

  await delay(500)
  onLog(makeLog('insurance', `Provider: ${insuranceResult.insuranceProvider}`, 'success'))
  await delay(300)
  onLog(makeLog('insurance', `Policy Number: ${insuranceResult.policyNumber}`, 'success'))
  await delay(300)
  onLog(makeLog('insurance', `Pre-Auth Status: ${insuranceStatusLabel}`, insuranceResult.status === 'denied' ? 'error' : 'success'))
  await delay(300)
  onLog(makeLog('insurance', `Coverage: ${insuranceResult.coveragePercent}% | Auth Code: ${insuranceResult.preAuthCode}`, 'info'))
  await delay(300)
  onLog(makeLog('insurance', insuranceResult.notes, 'info'))
  await delay(500)

  // -------------------------
  // SCHEDULING AGENT
  // -------------------------
  onLog(makeLog('scheduling', 'Scheduling agent finding optimal appointment slot...', 'thinking'))
  await delay(500)
  onLog(makeLog('scheduling', `Matching specialist for: ${clinicalResult.recommendedProcedure} (${clinicalResult.urgencyLevel})`, 'thinking'))
  await delay(500)

  let schedulingResult: SchedulingResult = {
    scheduledDate: 'TBD',
    scheduledTime: 'TBD',
    doctor: 'Dr. Emily Rodriguez',
    specialty: 'General Surgery',
    location: 'Memorial Hospital Main Campus',
    operatingRoom: 'OR-1',
    confirmationNumber: `CONF-${Math.floor(100000 + Math.random() * 900000)}`,
    preOpInstructions: 'Follow standard pre-operative fasting guidelines.',
  }

  try {
    const { text: schedulingRaw } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: SCHEDULING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Patient: ${patientName}\nDiagnosis: ${clinicalResult.diagnosis}\nProcedure: ${clinicalResult.recommendedProcedure}\nUrgency: ${clinicalResult.urgencyLevel}\nInsurance: ${insuranceResult.insuranceProvider} (${insuranceStatusLabel})`,
        },
      ],
      maxTokens: 512,
    })

    const parsed = JSON.parse(extractJson(schedulingRaw)) as SchedulingResult
    schedulingResult = {
      scheduledDate: parsed.scheduledDate ?? schedulingResult.scheduledDate,
      scheduledTime: parsed.scheduledTime ?? schedulingResult.scheduledTime,
      doctor: parsed.doctor ?? schedulingResult.doctor,
      specialty: parsed.specialty ?? schedulingResult.specialty,
      location: parsed.location ?? schedulingResult.location,
      operatingRoom: parsed.operatingRoom ?? schedulingResult.operatingRoom,
      confirmationNumber: parsed.confirmationNumber ?? schedulingResult.confirmationNumber,
      preOpInstructions: parsed.preOpInstructions ?? schedulingResult.preOpInstructions,
    }
  } catch (err) {
    onLog(makeLog('scheduling', `Warning: Could not fully parse scheduling response. Using defaults. ${err}`, 'error'))
  }

  await delay(500)
  onLog(makeLog('scheduling', `Assigned: ${schedulingResult.doctor} (${schedulingResult.specialty})`, 'success'))
  await delay(300)
  onLog(makeLog('scheduling', `Date: ${schedulingResult.scheduledDate} at ${schedulingResult.scheduledTime}`, 'success'))
  await delay(300)
  onLog(makeLog('scheduling', `Location: ${schedulingResult.location} — ${schedulingResult.operatingRoom}`, 'success'))
  await delay(300)
  onLog(makeLog('scheduling', `Confirmation #: ${schedulingResult.confirmationNumber}`, 'success'))
  await delay(300)
  onLog(makeLog('scheduling', `Pre-op: ${schedulingResult.preOpInstructions}`, 'info'))
  await delay(500)

  // -------------------------
  // FINALIZE & PERSIST
  // -------------------------
  onLog(makeLog('orchestrator', 'All agents completed. Saving results...', 'info'))
  await delay(500)

  // Build final logs array from all logs emitted
  const allLogs: AgentLog[] = []

  const now = new Date().toISOString()

  // Determine insurance_status mapping
  const insuranceStatus: AgentRun['insuranceStatus'] =
    insuranceResult.status === 'approved'
      ? 'approved'
      : insuranceResult.status === 'denied'
        ? 'denied'
        : 'pending'

  let agentRunId: string | null = null

  try {
    const agentRun = await blink.db.table<AgentRun>('agent_runs').create({
      caseId,
      status: 'completed',
      diagnosis: clinicalResult.diagnosis,
      diagnosisCode: clinicalResult.diagnosisCode,
      recommendedProcedure: clinicalResult.recommendedProcedure,
      urgencyLevel: clinicalResult.urgencyLevel,
      insuranceProvider: insuranceResult.insuranceProvider,
      insurancePolicyNumber: insuranceResult.policyNumber,
      insuranceStatus,
      insuranceNotes: insuranceResult.notes,
      scheduledDate: schedulingResult.scheduledDate,
      scheduledTime: schedulingResult.scheduledTime,
      scheduledDoctor: schedulingResult.doctor,
      scheduledLocation: schedulingResult.location,
      confirmationNumber: schedulingResult.confirmationNumber,
      agentLogs: JSON.stringify(allLogs),
      completedAt: now,
    })
    agentRunId = agentRun.id
  } catch (err) {
    onLog(makeLog('orchestrator', `Error saving agent run: ${err}`, 'error'))
  }

  try {
    await blink.db.table('patient_cases').update(caseId, {
      status: 'completed',
      updatedAt: now,
    })
  } catch (err) {
    onLog(makeLog('orchestrator', `Error updating case status: ${err}`, 'error'))
  }

  onLog(makeLog('orchestrator', 'Hospital Autopilot complete. Case fully processed.', 'success'))

  // Build the AgentRun object to return
  const finalRun: AgentRun = {
    id: agentRunId ?? generateId(),
    caseId,
    userId: '',
    status: 'completed',
    diagnosis: clinicalResult.diagnosis,
    diagnosisCode: clinicalResult.diagnosisCode,
    recommendedProcedure: clinicalResult.recommendedProcedure,
    urgencyLevel: clinicalResult.urgencyLevel,
    insuranceProvider: insuranceResult.insuranceProvider,
    insurancePolicyNumber: insuranceResult.policyNumber,
    insuranceStatus,
    insuranceNotes: insuranceResult.notes,
    scheduledDate: schedulingResult.scheduledDate,
    scheduledTime: schedulingResult.scheduledTime,
    scheduledDoctor: schedulingResult.doctor,
    scheduledLocation: schedulingResult.location,
    confirmationNumber: schedulingResult.confirmationNumber,
    agentLogs: JSON.stringify(allLogs),
    createdAt: now,
    completedAt: now,
  }

  onComplete(finalRun)
}
