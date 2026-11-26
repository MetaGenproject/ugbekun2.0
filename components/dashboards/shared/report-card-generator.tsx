'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import {
  Award,
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  AlertCircle,
  Lock,
} from 'lucide-react'
import { resolveHttpStatus, showSystemStatus } from '@/lib/systemStatus'
import {
  BrandedReportCardPreview,
  type BrandedReportSubjectCommentRow,
  type EvaluationMatrixComponent,
} from './branded-report-card-preview'

export interface StudentReportOptionsPayload {
  sessions: Array<{ id: number; label: string; isCurrent: boolean }>
  classes: Array<{
    sessionId: number
    classId: number
    sectionId: number | null
    className: string
    sectionName: string
    isEcd: boolean
  }>
  terms: Array<{ id: number; label: string }>
  currentSessionId: number | null
  currentClassId: number | null
  currentTermId: number
  currentTermLabel: string
}

export interface GeneratedStudentGradeReport {
  success: boolean
  isPublished?: boolean
  isEcd?: boolean
  isCommentBased?: boolean
  usesScores?: boolean
  sessionId?: number | null
  sessionName?: string | null
  classId?: number | null
  className?: string | null
  sectionId?: number | null
  sectionName?: string | null
  termId?: number
  termLabel?: string
  stage?: string
  visibleStages?: string[]
  releaseExam?: boolean
  releaseFull?: boolean
  maxTotal?: number
  assessmentComponents?: EvaluationMatrixComponent[]
  gradingScale?: {
    ranges?: Array<{
      grade: string
      minPercentage?: number
      maxPercentage?: number
      minScore?: number
      maxScore?: number
      remark?: string
    }>
  }
  schoolBranding?: Record<string, any>
  studentBio?: {
    id: number
    firstName: string | null
    lastName: string | null
    registerNo: string | null
    photo?: string | null
    gender?: string | null
    birthday?: string | null
  } | null
  attendanceSummary?: {
    percentage: number
    totalDays: number
    presentCount: number
    absentCount: number
    lateCount: number
  }
  reportCard?: Array<{
    id: number
    examName: string
    subjectName: string
    subjectCode: string | null
    cbtMark?: string | null
    cbtScale?: number | null
    theoryMark?: string | null
    mark: string | null
    componentScores?: Record<string, number | string | null>
    maxMarks?: number | null
    absent: boolean
    classAverage: number | null
  }>
  subjectComments?: BrandedReportSubjectCommentRow[]
  overallAverage?: number | null
  rawAverage?: number | null
  commentary?: string | null
  teacherComment?: string | null
  principalComment?: string | null
  psychomotor?: Record<string, string>
  affective?: Record<string, string>
  resumptionDate?: string | null
  nextTermResumptionDate?: string | null
  nextTermFees?: string | null
  rank?: number | null
  totalClassStudents?: number | null
  assessment?: any
  message?: string
  options?: StudentReportOptionsPayload
}

export interface ReportCardFilterParams {
  sessionId?: number
  classId?: number
  termId?: number
}

export interface ReportCardChildOption {
  id: number
  firstName: string
  lastName: string
  registerNo?: string | null
  className: string
  sectionName: string
}

export interface ReportCardGeneratorProfile {
  studentId: number
  firstName: string
  lastName: string
  registerNo?: string | null
  classId: number | null
  className: string | null
  sectionId: number | null
  sectionName: string | null
  sessionId?: number | null
  gender?: string | null
  photo?: string | null
  birthday?: string | null
  fellowStudentsCount?: number
  formTeacher?: { id?: number; name: string } | null
}

export interface ReportCardGeneratorProps {
  profile: ReportCardGeneratorProfile
  branding?: Record<string, any> | null
  attendance?: {
    percentage: number
    totalDays: number
    presentCount: number
    absentCount: number
  } | null
  initialOptions?: StudentReportOptionsPayload | null
  portalMode?: 'student' | 'parent'
  childrenOptions?: ReportCardChildOption[]
  onSelectChild?: (childId: number) => void
  fetchOptions: () => Promise<{ success: boolean } & StudentReportOptionsPayload>
  fetchReport: (filters: ReportCardFilterParams) => Promise<GeneratedStudentGradeReport>
  buildPdfUrl: (filters: ReportCardFilterParams) => string
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function ReportCardGenerator({
  profile,
  branding,
  attendance,
  initialOptions,
  portalMode = 'student',
  childrenOptions,
  onSelectChild,
  fetchOptions,
  fetchReport,
  buildPdfUrl,
}: ReportCardGeneratorProps) {
  const baseId = useId()
  const showChildSelector = portalMode === 'parent' && Array.isArray(childrenOptions) && childrenOptions.length > 0

  const [options, setOptions] = useState<StudentReportOptionsPayload | null>(initialOptions || null)
  const [loadingOptions, setLoadingOptions] = useState<boolean>(!initialOptions)

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialOptions?.currentSessionId
      ? String(initialOptions.currentSessionId)
      : profile.sessionId
        ? String(profile.sessionId)
        : ''
  )
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialOptions?.currentClassId
      ? String(initialOptions.currentClassId)
      : profile.classId
        ? String(profile.classId)
        : ''
  )
  const [selectedTermId, setSelectedTermId] = useState<string>(
    initialOptions?.currentTermId ? String(initialOptions.currentTermId) : '1'
  )

  const [generating, setGenerating] = useState<boolean>(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatedReport, setGeneratedReport] = useState<GeneratedStudentGradeReport | null>(null)
  const [generatedFilters, setGeneratedFilters] = useState<ReportCardFilterParams | null>(null)

  const [previewMode, setPreviewMode] = useState<'document' | 'pdf'>('document')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [loadingPdfPreview, setLoadingPdfPreview] = useState<boolean>(false)
  const [exportingPdf, setExportingPdf] = useState<boolean>(false)

  // Reset generated state and fetch report card options whenever student/child changes
  useEffect(() => {
    let active = true

    setGeneratedReport(null)
    setGeneratedFilters(null)
    setGenerateError(null)
    setPreviewMode('document')
    setPdfBlobUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev)
      return null
    })

    if (initialOptions) {
      setOptions(initialOptions)
      setLoadingOptions(false)
      if (initialOptions.currentSessionId) setSelectedSessionId(String(initialOptions.currentSessionId))
      if (initialOptions.currentClassId) setSelectedClassId(String(initialOptions.currentClassId))
      if (initialOptions.currentTermId) setSelectedTermId(String(initialOptions.currentTermId))
      return () => {
        active = false
      }
    }

    setOptions(null)
    async function loadOptions() {
      try {
        setLoadingOptions(true)
        const res = await fetchOptions()
        if (!active || !res?.success) return
        setOptions(res)
        if (res.currentSessionId) setSelectedSessionId(String(res.currentSessionId))
        else if (res.sessions?.[0]) setSelectedSessionId(String(res.sessions[0].id))
        if (res.currentClassId) setSelectedClassId(String(res.currentClassId))
        else if (res.classes?.[0]) setSelectedClassId(String(res.classes[0].classId))
        if (res.currentTermId) setSelectedTermId(String(res.currentTermId))
      } catch (err) {
        console.error(`[${portalMode.toUpperCase()}] Failed to load report card options:`, err)
      } finally {
        if (active) setLoadingOptions(false)
      }
    }

    loadOptions()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.studentId])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [pdfBlobUrl])

  const sessionOptions = useMemo(() => {
    if (options?.sessions?.length) return options.sessions
    if (profile.sessionId) {
      return [{ id: profile.sessionId, label: 'Current Session', isCurrent: true }]
    }
    return []
  }, [options, profile.sessionId])

  const classOptions = useMemo(() => {
    const all = options?.classes || []
    if (all.length === 0) {
      return profile.classId
        ? [
            {
              sessionId: Number(selectedSessionId || profile.sessionId || 0),
              classId: profile.classId,
              sectionId: profile.sectionId,
              className: profile.className || 'Class',
              sectionName: profile.sectionName || '',
              isEcd: false,
            },
          ]
        : []
    }
    const filteredForSession = selectedSessionId
      ? all.filter((c) => c.sessionId === Number(selectedSessionId))
      : all
    if (filteredForSession.length > 0) return filteredForSession

    const byClassId = new Map<number, (typeof all)[number]>()
    for (const c of all) {
      if (!byClassId.has(c.classId)) byClassId.set(c.classId, c)
    }
    return Array.from(byClassId.values())
  }, [options, selectedSessionId, profile])

  const termOptions = useMemo(() => {
    if (options?.terms?.length) return options.terms
    return [
      { id: 1, label: 'First Term' },
      { id: 2, label: 'Second Term' },
      { id: 3, label: 'Third Term' },
    ]
  }, [options])

  const handleSessionChange = (nextSessionId: string) => {
    setSelectedSessionId(nextSessionId)
    const numSess = Number(nextSessionId)
    const matchInSession = (options?.classes || []).find((c) => c.sessionId === numSess)
    if (matchInSession) {
      setSelectedClassId(String(matchInSession.classId))
    }
  }

  const handleGenerateReportCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setGenerateError(null)
    setPreviewMode('document')
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl)
      setPdfBlobUrl(null)
    }

    const filters: ReportCardFilterParams = {
      sessionId: selectedSessionId ? Number(selectedSessionId) : undefined,
      classId: selectedClassId ? Number(selectedClassId) : undefined,
      termId: selectedTermId ? Number(selectedTermId) : undefined,
    }

    try {
      const res = await fetchReport(filters)
      if (!res?.success) {
        throw new Error(res?.message || 'Unable to generate report card.')
      }
      setGeneratedReport(res)
      setGeneratedFilters(filters)
      if (res.options) setOptions(res.options)
    } catch (err: any) {
      setGeneratedReport(null)
      setGenerateError(err?.message || 'Failed to generate report card for the selected parameters.')
    } finally {
      setGenerating(false)
    }
  }

  const loadPdfBlobPreview = async () => {
    if (!generatedFilters) return
    try {
      setLoadingPdfPreview(true)
      const url = buildPdfUrl(generatedFilters)
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Could not load PDF preview.')
      const blob = await res.blob()
      const objUrl = window.URL.createObjectURL(blob)
      setPdfBlobUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return objUrl
      })
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err?.message || 'Could not load PDF preview.'))
    } finally {
      setLoadingPdfPreview(false)
    }
  }

  const handleSwitchPreviewMode = (mode: 'document' | 'pdf') => {
    setPreviewMode(mode)
    if (mode === 'pdf' && !pdfBlobUrl) {
      loadPdfBlobPreview()
    }
  }

  const handleDownloadPdf = async () => {
    if (!generatedFilters) return
    try {
      setExportingPdf(true)
      const url = buildPdfUrl(generatedFilters)
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'PDF Export failed.')
      }
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const termSlug = (generatedReport?.termLabel || 'term').replace(/\s+/g, '_')
      a.download = `ReportCard_${profile.registerNo || profile.firstName || 'Student'}_${termSlug}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      showSystemStatus(resolveHttpStatus(500, err?.message || 'Could not download report card.'))
    } finally {
      setExportingPdf(false)
    }
  }

  const reportList = generatedReport?.reportCard || []
  const subjectCommentsList = generatedReport?.subjectComments || []
  const isCommentReport = Boolean(generatedReport?.isCommentBased || generatedReport?.usesScores === false)
  const hasGeneratedBody = Boolean(
    generatedReport &&
      generatedReport.isPublished &&
      (isCommentReport
        ? subjectCommentsList.length > 0 || generatedReport.assessment
        : generatedReport.isEcd
          ? generatedReport.assessment
          : reportList.length > 0)
  )

  const rawRank = generatedReport?.rank ?? null
  const rankText = rawRank ? `${rawRank}${getOrdinal(rawRank)}` : 'N/A'
  const totalClass = generatedReport?.totalClassStudents || profile.fellowStudentsCount || 0
  const avgScore = generatedReport?.overallAverage ?? 0

  return (
    <div className="space-y-6 pb-12 font-sans print:pb-0">
      {/* Generate Report Card Selector Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-indigo-600 shrink-0" size={24} />
              <span>Generate Report Card</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {portalMode === 'parent'
                ? "Select your child, academic session, class, and term to view and print their official report card."
                : 'Select the academic session, class, and term you want to view and print.'}
            </p>
          </div>
          {profile.registerNo && (
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 self-start sm:self-auto">
              Reg No: {profile.registerNo}
            </span>
          )}
        </div>

        <form
          onSubmit={handleGenerateReportCard}
          aria-label="Generate report card"
          className={`grid grid-cols-1 sm:grid-cols-2 ${showChildSelector ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 items-end`}
        >
          {showChildSelector && (
            <div>
              <label
                htmlFor={`${baseId}-child`}
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Child
              </label>
              <select
                id={`${baseId}-child`}
                name="studentId"
                value={String(profile.studentId)}
                onChange={(e) => onSelectChild?.(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-2 focus:outline-indigo-600"
              >
                {childrenOptions!.map((child) => (
                  <option key={child.id} value={String(child.id)}>
                    {child.firstName} {child.lastName}
                    {child.className ? ` (${child.className})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor={`${baseId}-session`}
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Session
            </label>
            <select
              id={`${baseId}-session`}
              name="sessionId"
              value={selectedSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              disabled={loadingOptions}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-2 focus:outline-indigo-600 disabled:opacity-60"
            >
              {sessionOptions.length === 0 ? (
                <option value="">Loading sessions…</option>
              ) : (
                sessionOptions.map((sess) => (
                  <option key={sess.id} value={String(sess.id)}>
                    {sess.label}
                    {sess.isCurrent ? ' (Current)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-class`}
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Class
            </label>
            <select
              id={`${baseId}-class`}
              name="classId"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingOptions}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-2 focus:outline-indigo-600 disabled:opacity-60"
            >
              {classOptions.length === 0 ? (
                <option value="">No class available</option>
              ) : (
                classOptions.map((cls) => (
                  <option key={`${cls.sessionId}-${cls.classId}`} value={String(cls.classId)}>
                    {cls.className}
                    {cls.sectionName ? ` (${cls.sectionName})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-term`}
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Term
            </label>
            <select
              id={`${baseId}-term`}
              name="termId"
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              disabled={loadingOptions}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-2 focus:outline-indigo-600 disabled:opacity-60"
            >
              {termOptions.map((term) => (
                <option key={term.id} value={String(term.id)}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={generating || loadingOptions || !selectedClassId}
            className="w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <FileText size={15} />
                <span>Generate Report Card</span>
              </>
            )}
          </button>
        </form>

        {generateError && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 flex items-center gap-2"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{generateError}</span>
          </div>
        )}
      </div>

      {/* Initial Empty Prompt */}
      {!generatedReport && !generating && !generateError && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-3 print:hidden">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Award size={26} />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">
            {portalMode === 'parent'
              ? `Ready to Generate ${profile.firstName}'s Report Card`
              : 'Ready to Generate Your Report Card'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {portalMode === 'parent'
              ? 'Choose the Child, Session, Class, and Term above, then click '
              : 'Choose the Session, Class, and Term above, then click '}
            <strong className="text-slate-800">Generate Report Card</strong> to inspect and print the official result.
          </p>
        </div>
      )}

      {/* Not Published State */}
      {generatedReport && !generatedReport.isPublished && (
        <div
          role="status"
          aria-live="polite"
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-3 print:hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Report Card Not Released Yet</h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            {generatedReport.message ||
              `Official report cards for ${generatedReport.className || 'this class'} · ${generatedReport.termLabel || 'this term'} (${generatedReport.sessionName || 'Session'}) have not been published yet.`}
          </p>
        </div>
      )}

      {/* Empty Scores State */}
      {generatedReport && generatedReport.isPublished && !hasGeneratedBody && (
        <div
          role="status"
          aria-live="polite"
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-2 print:hidden"
        >
          <FileText size={28} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-extrabold text-slate-900">No Report Card Data Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {generatedReport.message ||
              `No marks have been recorded for ${generatedReport.className || 'this class'} · ${generatedReport.termLabel || 'this term'}.`}
          </p>
        </div>
      )}

      {/* Generated Report Card View + Print / PDF Download */}
      {hasGeneratedBody && generatedReport && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Generated Report Card &bull; {profile.firstName} {profile.lastName}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {generatedReport.sessionName || 'Session'} &bull;{' '}
                {generatedReport.className || profile.className}{' '}
                {generatedReport.sectionName ? `(${generatedReport.sectionName})` : ''} &bull;{' '}
                {generatedReport.termLabel || 'First Term'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(!generatedReport.isEcd || isCommentReport) && (
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleSwitchPreviewMode('document')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      previewMode === 'document'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Award size={14} />
                    <span>Report Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPreviewMode('pdf')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      previewMode === 'pdf'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye size={14} />
                    <span>PDF View</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {previewMode === 'document' || (generatedReport.isEcd && !isCommentReport) ? (
            generatedReport.isEcd && !isCommentReport ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Montessori / ECD Progress Report
                    </h4>
                    <p className="text-xs text-slate-500">
                      {generatedReport.className} &bull; {generatedReport.termLabel} &bull;{' '}
                      {generatedReport.sessionName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 print:hidden cursor-pointer"
                  >
                    {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    <span>Download PDF</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Click <strong>Download PDF</strong> or <strong>Print</strong> to output the official Montessori report card for this term.
                </p>
              </div>
            ) : (
              <div className="bg-slate-100/70 p-2 sm:p-4 rounded-3xl border border-slate-200/80 print:p-0 print:bg-white print:border-none">
                <BrandedReportCardPreview
                  student={{
                    id: profile.studentId,
                    studentName: `${profile.lastName}, ${profile.firstName}`,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    registerNo: profile.registerNo,
                    admissionNo: profile.registerNo,
                    className: generatedReport.className || profile.className || 'Class',
                    sectionName: generatedReport.sectionName ?? profile.sectionName,
                    gender: profile.gender,
                    photo: profile.photo,
                    birthday: profile.birthday,
                    usesScores: isCommentReport ? false : true,
                    isCommentBased: isCommentReport,
                    isEcd: Boolean(generatedReport.isEcd),
                    average: avgScore,
                    rawAverage: generatedReport.rawAverage ?? avgScore,
                    maxMarksPerSubject: generatedReport.maxTotal || 100,
                    rank: rawRank,
                    position: rawRank ? `${rankText} of ${totalClass}` : null,
                    totalClassStudents: totalClass,
                    presentCount:
                      generatedReport.attendanceSummary?.presentCount ?? attendance?.presentCount ?? 0,
                    absentCount:
                      generatedReport.attendanceSummary?.absentCount ??
                      (attendance ? attendance.totalDays - attendance.presentCount : 0),
                    totalAttendanceDays:
                      generatedReport.attendanceSummary?.totalDays ?? attendance?.totalDays ?? 0,
                    attendanceRate:
                      generatedReport.attendanceSummary?.percentage ?? attendance?.percentage ?? 100,
                    teacherComment:
                      generatedReport.teacherComment || generatedReport.commentary || '',
                    principalComment: generatedReport.principalComment || '',
                    resumptionDate:
                      generatedReport.resumptionDate ||
                      generatedReport.nextTermResumptionDate ||
                      generatedReport.schoolBranding?.resumptionDate ||
                      null,
                    nextTermFees:
                      generatedReport.nextTermFees ||
                      generatedReport.schoolBranding?.nextTermFees ||
                      null,
                    psychomotor: generatedReport.psychomotor,
                    affective: generatedReport.affective,
                    subjectComments: subjectCommentsList,
                    reportCard: reportList.map((item) => ({
                      id: item.id,
                      subjectName: item.subjectName,
                      subjectCode: item.subjectCode || undefined,
                      cbtMark: item.cbtMark,
                      theoryMark: item.theoryMark,
                      mark: item.mark,
                      stageScore: item.mark,
                      componentScores: item.componentScores,
                      maxMarks: item.maxMarks || generatedReport.maxTotal || 100,
                      absent: item.absent,
                      classAverage: item.classAverage,
                    })),
                  }}
                  branding={{
                    ...(branding || {}),
                    ...(generatedReport.schoolBranding || {}),
                    classTeacherName:
                      generatedReport.schoolBranding?.classTeacherName ||
                      profile.formTeacher?.name ||
                      'Class Teacher',
                  }}
                  assessmentComponents={generatedReport.assessmentComponents}
                  maxTotal={generatedReport.maxTotal || 100}
                  stage={generatedReport.stage || 'FULL'}
                  gradingRanges={(generatedReport.gradingScale?.ranges || []).map((r) => ({
                    grade: r.grade,
                    minPercentage: r.minPercentage ?? r.minScore ?? 0,
                    maxPercentage: r.maxPercentage ?? r.maxScore ?? 100,
                    remark: r.remark,
                  }))}
                  onDownloadPdf={handleDownloadPdf}
                  isDownloadingPdf={exportingPdf}
                />
              </div>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6">
              {loadingPdfPreview ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                  <p className="text-xs font-bold text-slate-700">
                    Compiling official PDF report card…
                  </p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-[680px] rounded-2xl border border-slate-200 bg-slate-50"
                  title="Official Report Card PDF"
                />
              ) : (
                <div className="py-16 text-center space-y-3">
                  <Award size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">
                    PDF preview could not be rendered inline.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Download PDF Instead
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

