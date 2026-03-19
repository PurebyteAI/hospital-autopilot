import { useState, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Loader2,
  User,
  Hash,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { blink } from '../blink/client'
import { useInvalidateCases } from '../hooks/useCases'

const SAMPLE = {
  patientName: 'John Mitchell',
  patientId:   'PT-2024-0892',
  patientAge:  '45',
  fileText:    `PATIENT REPORT — PT-2024-0892
Name: John Mitchell  |  DOB: 1979-03-14  |  Age: 45

CHIEF COMPLAINT: Right knee pain and instability following sports injury.

HISTORY OF PRESENT ILLNESS:
Patient presents with a 3-week history of right knee pain, swelling, and instability
after a pivoting injury during a recreational soccer match. MRI confirms complete
anterior cruciate ligament (ACL) rupture with associated medial meniscus tear.

ASSESSMENT:
- Complete ACL rupture, right knee (ICD-10: S83.511A)
- Medial meniscus tear, right knee (ICD-10: S83.211A)
- Grade II MCL sprain

RECOMMENDED TREATMENT:
Surgical intervention — Arthroscopic ACL reconstruction with patellar tendon autograft
and concurrent partial medial meniscectomy. Urgency: HIGH.

SURGEON RECOMMENDATION: Orthopedic Sports Medicine consultation required.
Anticipated OR time: 2-3 hours. Estimated recovery: 9-12 months.

Dr. Sarah Chen, MD — Sports Medicine & Orthopedic Surgery
`,
}

interface FormState {
  patientName: string
  patientId:   string
  patientAge:  string
}

function FieldInput({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ElementType
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>
    </div>
  )
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { invalidateCases } = useInvalidateCases()

  const [form, setForm] = useState<FormState>({ patientName: '', patientId: '', patientAge: '' })
  const [file, setFile] = useState<File | null>(null)
  const [fileText, setFileText] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const readFile = useCallback((f: File) => {
    if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => {
      const raw = e.target?.result as string
      const text = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
      setFileText(text.length > 50 ? text : `[PDF: ${f.name}] — content will be analyzed by AI agents.`)
    }
    reader.readAsBinaryString(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) readFile(f)
  }, [readFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) readFile(f)
  }

  const loadSample = () => {
    setForm({ patientName: SAMPLE.patientName, patientId: SAMPLE.patientId, patientAge: SAMPLE.patientAge })
    const mockFile = new File([SAMPLE.fileText], 'john_mitchell_report.pdf', { type: 'application/pdf' })
    setFile(mockFile)
    setFileText(SAMPLE.fileText)
    toast.success('Sample patient data loaded!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientName.trim()) { toast.error('Patient name is required.'); return }
    if (!file) { toast.error('Please upload a patient report PDF.'); return }

    setIsSubmitting(true)
    try {
      let fileUrl = ''
      try {
        const ext = file.name.split('.').pop() || 'pdf'
        const { publicUrl } = await blink.storage.upload(
          file,
          `reports/${Date.now()}.${ext}`,
          { onProgress: () => {} }
        )
        fileUrl = publicUrl
      } catch {
        // Storage upload optional for demo
      }

      const record = await blink.db.table('patient_cases').create({
        patientName: form.patientName.trim(),
        patientId:   form.patientId.trim(),
        patientAge:  form.patientAge.trim(),
        fileName:    file.name,
        fileUrl,
        fileText,
        status:      'pending',
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      })

      invalidateCases()
      toast.success('Patient record created!')
      navigate({ to: '/run/$caseId', params: { caseId: record.id as string } })
    } catch (err) {
      console.error(err)
      toast.error('Failed to create case. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in-up">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <UploadCloud size={18} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">New Patient Case</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Upload a patient report PDF to begin automated processing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sample data banner */}
        <div className="flex items-center justify-between px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs text-accent font-medium">Demo mode</span>
            <span className="text-xs text-muted-foreground">— load sample ACL patient</span>
          </div>
          <button
            type="button"
            onClick={loadSample}
            className="text-xs font-semibold text-accent hover:text-accent/80 px-3 py-1 rounded-lg border border-accent/30 hover:bg-accent/10 transition-all duration-150"
          >
            Use Sample Data
          </button>
        </div>

        {/* Patient info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User size={13} className="text-primary" />
            Patient Information
          </h2>

          <FieldInput
            icon={User}
            label="Patient Name"
            placeholder="e.g. John Mitchell"
            value={form.patientName}
            onChange={updateField('patientName')}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              icon={Hash}
              label="Patient ID"
              placeholder="PT-2024-XXXX"
              value={form.patientId}
              onChange={updateField('patientId')}
            />
            <FieldInput
              icon={Calendar}
              label="Age"
              placeholder="e.g. 45"
              value={form.patientAge}
              onChange={updateField('patientAge')}
            />
          </div>
        </div>

        {/* File upload zone */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText size={13} className="text-primary" />
            Patient Report <span className="text-destructive">*</span>
          </h2>

          {file ? (
            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · PDF
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setFileText('') }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={[
                'flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
                isDragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/40 hover:bg-secondary/40',
              ].join(' ')}
            >
              <div className={`p-3 rounded-xl transition-colors ${isDragOver ? 'bg-primary/15' : 'bg-secondary'}`}>
                <UploadCloud size={24} className={isDragOver ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? 'Drop to upload' : 'Drop PDF here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF files only, up to 20MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating case…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Start Autopilot
            </>
          )}
        </button>
      </form>
    </div>
  )
}
