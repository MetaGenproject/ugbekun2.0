'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Save,
  Loader2,
  Upload,
  Edit3,
  Brain,
  HeartHandshake,
} from 'lucide-react'

export interface SchoolReportBranding {
  schoolName: string
  tagline: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  currencySymbol: string
  academicSession: string
  currentTerm: string
  resumptionDate: string | null
  nextTermFees: string | null
  principalName: string | null
  principalSignatureUrl: string | null
  defaultTeacherSignatureUrl: string | null
  classTeacherName: string | null
  classTeacherSignatureUrl: string | null
  autoPublishReportCards: boolean
  branchCode: string
  showPosition?: boolean
  rankingType?: 'full' | 'topn' | 'hidden'
  rankingLimit?: number
}

export interface EvaluationMatrixComponent {
  key?: string
  code: string
  name?: string
  label?: string
  maxMarks: number
  passMarks?: number
  category?: 'CA' | 'PRACTICAL' | 'EXAM' | string
  displayOrder?: number
}

export interface BrandedReportSubjectRow {
  id?: number
  subjectId?: number
  examName?: string
  subjectName: string
  subjectCode?: string
  cbtMark?: string | number | null
  caScore?: string | number | null
  theoryMark?: string | number | null
  examScore?: string | number | null
  mark?: string | number | null
  totalScore?: string | number | null
  stageScore?: string | number | null
  maxMarks?: number | null
  componentScores?: Record<string, number | string | null>
  absent?: boolean
  classAverage?: number | null
  grade?: string
  remark?: string
}

export interface BrandedReportSubjectCommentRow {
  id?: number
  subjectId?: number
  subjectName: string
  subjectCode?: string
  comment: string
  rating: number
  ratingLabel?: string
}

export interface BrandedReportCardStudentData {
  id: number
  studentName: string
  firstName?: string
  lastName?: string
  registerNo?: string | null
  admissionNo?: string | null
  className: string
  sectionName?: string | null
  gender?: string | null
  photo?: string | null
  birthday?: string | null
  totalMarks?: number | null
  average?: number | null
  rawAverage?: number | null
  maxMarksPerSubject?: number | null
  grade?: string | null
  position?: string | null
  rank?: number | null
  showPosition?: boolean
  totalClassStudents?: number | null
  presentCount?: number
  absentCount?: number
  totalAttendanceDays?: number
  attendanceRate?: number
  teacherComment?: string | null
  principalComment?: string | null
  resumptionDate?: string | null
  nextTermFees?: string | null
  usesScores?: boolean
  isCommentBased?: boolean
  isEcd?: boolean
  reportCard?: BrandedReportSubjectRow[]
  subjectComments?: BrandedReportSubjectCommentRow[]
  psychomotor?: Record<string, string>
  affective?: Record<string, string>
}

export interface GradingRangeItem {
  grade: string
  minPercentage: number
  maxPercentage: number
  remark?: string
}

interface BrandedReportCardPreviewProps {
  student: BrandedReportCardStudentData
  branding?: Partial<SchoolReportBranding> | null
  assessmentComponents?: EvaluationMatrixComponent[] | null
  maxTotal?: number | null
  stage?: string
  gradingRanges?: GradingRangeItem[] | null
  onClose?: () => void
  onDownloadPdf?: () => void
  isDownloadingPdf?: boolean
  editable?: boolean
  editorRole?: 'admin' | 'teacher'
  onSaveRemarksAndSettings?: (payload: {
    studentId: number
    teacherComment: string
    principalComment: string
    resumptionDate: string
    nextTermFees: string
    teacherSignatureUrl?: string
    principalSignatureUrl?: string
    principalName?: string
    psychomotor?: Record<string, string>
    affective?: Record<string, string>
  }) => Promise<void>
}

export const PSYCHOMOTOR_TRAIT_DEFINITIONS = [
  { key: 'writingMastery', label: 'Handwriting & Neatness' },
  { key: 'drawingCapability', label: 'Drawing & Artistic Skill' },
  { key: 'physicalCoordination', label: 'Sports & Physical Coordination' },
  { key: 'motorSkillProgression', label: 'Practical & Motor Dexterity' },
] as const

export const AFFECTIVE_TRAIT_DEFINITIONS = [
  { key: 'generalPunctuality', label: 'Punctuality & Regularity' },
  { key: 'peerRespect', label: 'Politeness & Peer Respect' },
  { key: 'aestheticNeatness', label: 'Personal & Uniform Neatness' },
  { key: 'activeGroupParticipation', label: 'Teamwork & Class Participation' },
] as const

export const TRAIT_RATING_OPTIONS = [
  { code: 'MS', score: 5, label: 'Excellent' },
  { code: 'AC', score: 4, label: 'Very Good' },
  { code: 'DV', score: 3, label: 'Good' },
  { code: 'EM', score: 2, label: 'Fair' },
  { code: 'NT', score: 1, label: 'Needs Help' },
] as const

export function resolveTraitRatingMeta(rawVal?: string | null): {
  code: string
  score: number
  label: string
} {
  const norm = String(rawVal || 'AC').trim().toUpperCase()
  if (norm === 'MS' || norm === '5' || norm === 'A' || norm === 'EXCELLENT' || norm === 'MASTERED') {
    return { code: 'MS', score: 5, label: 'Excellent' }
  }
  if (norm === 'AC' || norm === '4' || norm === 'B' || norm === 'VERY GOOD' || norm === 'ACHIEVED') {
    return { code: 'AC', score: 4, label: 'Very Good' }
  }
  if (norm === 'DV' || norm === '3' || norm === 'C' || norm === 'GOOD' || norm === 'DEVELOPING') {
    return { code: 'DV', score: 3, label: 'Good' }
  }
  if (norm === 'EM' || norm === '2' || norm === 'D' || norm === 'FAIR' || norm === 'EMERGING') {
    return { code: 'EM', score: 2, label: 'Fair' }
  }
  if (norm === 'NT' || norm === '1' || norm === 'E' || norm === 'F' || norm === 'NEEDS HELP') {
    return { code: 'NT', score: 1, label: 'Needs Help' }
  }
  return { code: 'AC', score: 4, label: 'Very Good' }
}

function formatCompactRemark(rawRemark?: string | null): string {
  const str = String(rawRemark || '-').trim()
  if (!str) return '-'
  if (/needs\s*improvement\s*\/\s*fail/i.test(str)) return 'Needs Improvement'
  if (/very\s*good/i.test(str) && str.length > 14) return 'Very Good'
  return str
}

function getLetterGradeAndRemark(
  normalizedPercentage: number,
  gradingRanges?: GradingRangeItem[] | null
): { grade: string; remark: string } {
  const rounded = Math.round(normalizedPercentage)
  if (Array.isArray(gradingRanges) && gradingRanges.length > 0) {
    for (const r of gradingRanges) {
      if (rounded >= Number(r.minPercentage) && rounded <= Number(r.maxPercentage)) {
        return {
          grade: r.grade,
          remark: formatCompactRemark(r.remark || r.grade),
        }
      }
    }
  }
  if (normalizedPercentage >= 70) return { grade: 'A', remark: 'Excellent' }
  if (normalizedPercentage >= 60) return { grade: 'B', remark: 'Very Good' }
  if (normalizedPercentage >= 50) return { grade: 'C', remark: 'Credit' }
  if (normalizedPercentage >= 45) return { grade: 'D', remark: 'Pass' }
  if (normalizedPercentage >= 40) return { grade: 'E', remark: 'Fair' }
  return { grade: 'F', remark: 'Needs Improvement' }
}

function deduplicateSubjectRows(
  rawRows: BrandedReportSubjectRow[],
  resolvedComponents: EvaluationMatrixComponent[]
): BrandedReportSubjectRow[] {
  if (!Array.isArray(rawRows) || rawRows.length <= 1) return rawRows || []
  const map = new Map<string, BrandedReportSubjectRow>()

  for (const row of rawRows) {
    const key = String(row.subjectId || row.subjectCode || row.subjectName || row.id || '')
      .trim()
      .toUpperCase()
    if (!key) continue

    if (!map.has(key)) {
      map.set(key, {
        ...row,
        componentScores: row.componentScores ? { ...row.componentScores } : {},
      })
    } else {
      const existing = map.get(key)!
      const mergedScores: Record<string, number | string | null> = {
        ...(existing.componentScores || {}),
      }
      const incomingScores = row.componentScores || {}

      for (const [k, v] of Object.entries(incomingScores)) {
        if (v !== null && v !== undefined && !isNaN(Number(v))) {
          const prev = mergedScores[k]
          if (prev === null || prev === undefined || isNaN(Number(prev)) || Number(v) > Number(prev)) {
            mergedScores[k] = Number(v)
          }
        }
      }

      const prevTotal = Number(existing.stageScore ?? existing.mark ?? existing.totalScore ?? 0) || 0
      const incomingTotal = Number(row.stageScore ?? row.mark ?? row.totalScore ?? 0) || 0

      let recomputedTotal = Math.max(prevTotal, incomingTotal)
      if (resolvedComponents.length > 0) {
        let compSum = 0
        let foundAny = false
        for (const comp of resolvedComponents) {
          const cVal = mergedScores[comp.code] ?? (comp.key ? mergedScores[comp.key] : undefined)
          if (cVal !== null && cVal !== undefined && !isNaN(Number(cVal))) {
            compSum += Number(cVal)
            foundAny = true
          }
        }
        if (foundAny && compSum > recomputedTotal) {
          recomputedTotal = compSum
        }
      }

      const prevAvg = Number(existing.classAverage ?? 0) || 0
      const incAvg = Number(row.classAverage ?? 0) || 0

      map.set(key, {
        ...existing,
        ...(incomingTotal > prevTotal ? row : {}),
        componentScores: mergedScores,
        stageScore: recomputedTotal,
        mark: String(recomputedTotal),
        totalScore: recomputedTotal,
        classAverage: Math.max(prevAvg, incAvg, recomputedTotal),
        absent: Boolean(existing.absent && row.absent && recomputedTotal === 0),
      })
    }
  }

  return Array.from(map.values())
}

export function BrandedReportCardPreview({
  student,
  branding,
  assessmentComponents,
  maxTotal,
  stage = 'FULL',
  gradingRanges,
  onClose,
  onDownloadPdf,
  isDownloadingPdf = false,
  editable = false,
  editorRole = 'admin',
  onSaveRemarksAndSettings,
}: BrandedReportCardPreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const primaryColor = branding?.primaryColor || '#1e3a8a'
  const secondaryColor = branding?.secondaryColor || '#0284c7'
  const schoolName = branding?.schoolName || 'Ugbekun Schools'
  const branchCode = branding?.branchCode || 'MAIN'
  const tagline = branding?.tagline || ''
  const address = branding?.address || ''
  const phone = branding?.phone || ''
  const email = branding?.email || ''
  const website = branding?.website || ''
  const logoUrl = branding?.logoUrl || null

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [teacherCommentVal, setTeacherCommentVal] = useState(student.teacherComment || '')
  const [principalCommentVal, setPrincipalCommentVal] = useState(student.principalComment || '')
  const [resumptionDateVal, setResumptionDateVal] = useState(
    student.resumptionDate || branding?.resumptionDate || ''
  )
  const [nextTermFeesVal, setNextTermFeesVal] = useState(
    student.nextTermFees || branding?.nextTermFees || ''
  )
  const [principalNameVal, setPrincipalNameVal] = useState(
    branding?.principalName || 'The Principal'
  )
  const [teacherSigVal, setTeacherSigVal] = useState(
    branding?.classTeacherSignatureUrl || branding?.defaultTeacherSignatureUrl || ''
  )
  const [principalSigVal, setPrincipalSigVal] = useState(
    branding?.principalSignatureUrl || ''
  )

  const [psychomotorVal, setPsychomotorVal] = useState<Record<string, string>>({
    writingMastery: student.psychomotor?.writingMastery || 'AC',
    drawingCapability: student.psychomotor?.drawingCapability || 'AC',
    physicalCoordination: student.psychomotor?.physicalCoordination || 'AC',
    motorSkillProgression: student.psychomotor?.motorSkillProgression || 'AC',
  })

  const [affectiveVal, setAffectiveVal] = useState<Record<string, string>>({
    generalPunctuality: student.affective?.generalPunctuality || 'AC',
    peerRespect: student.affective?.peerRespect || 'AC',
    aestheticNeatness: student.affective?.aestheticNeatness || 'AC',
    activeGroupParticipation: student.affective?.activeGroupParticipation || 'AC',
  })

  useEffect(() => {
    setTeacherCommentVal(student.teacherComment || '')
    setPrincipalCommentVal(student.principalComment || '')
    setResumptionDateVal(student.resumptionDate || branding?.resumptionDate || '')
    setNextTermFeesVal(student.nextTermFees || branding?.nextTermFees || '')
    setPrincipalNameVal(branding?.principalName || 'The Principal')
    setTeacherSigVal(
      branding?.classTeacherSignatureUrl || branding?.defaultTeacherSignatureUrl || ''
    )
    setPrincipalSigVal(branding?.principalSignatureUrl || '')
    setPsychomotorVal({
      writingMastery: student.psychomotor?.writingMastery || 'AC',
      drawingCapability: student.psychomotor?.drawingCapability || 'AC',
      physicalCoordination: student.psychomotor?.physicalCoordination || 'AC',
      motorSkillProgression: student.psychomotor?.motorSkillProgression || 'AC',
    })
    setAffectiveVal({
      generalPunctuality: student.affective?.generalPunctuality || 'AC',
      peerRespect: student.affective?.peerRespect || 'AC',
      aestheticNeatness: student.affective?.aestheticNeatness || 'AC',
      activeGroupParticipation: student.affective?.activeGroupParticipation || 'AC',
    })
  }, [student, branding])

  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'teacher' | 'principal'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      if (target === 'teacher') {
        setTeacherSigVal(base64)
      } else {
        setPrincipalSigVal(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!onSaveRemarksAndSettings) return
    setIsSaving(true)
    try {
      await onSaveRemarksAndSettings({
        studentId: student.id,
        teacherComment: teacherCommentVal,
        principalComment: principalCommentVal,
        resumptionDate: resumptionDateVal,
        nextTermFees: nextTermFeesVal,
        teacherSignatureUrl: teacherSigVal || undefined,
        principalSignatureUrl: principalSigVal || undefined,
        principalName: principalNameVal || undefined,
        psychomotor: psychomotorVal,
        affective: affectiveVal,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Deterministic Single-Page A4 Print Engine:
   * Prints the exact A4 report card sheet onto 1 portrait A4 sheet (210mm x 297mm)
   * without responsive breakpoint collapses or width distortion.
   */
  const handlePrint = () => {
    if (typeof window === 'undefined' || !sheetRef.current) return

    const styleNodes = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((node) => node.outerHTML)
      .join('\n')

    const sheetHtml = sheetRef.current.outerHTML
    const printTitle = `Report_Card_${(student.studentName || 'Student').replace(/[\s,]+/g, '_')}`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      window.print()
      return
    }

    doc.open()
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${printTitle}</title>
    ${styleNodes}
    <style>
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        background: #ffffff !important;
        overflow: hidden !important;
        font-family: Helvetica, Arial, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
      }
      #a4-print-stage {
        width: 210mm !important;
        height: 297mm !important;
        overflow: hidden !important;
        position: relative !important;
        background: #ffffff !important;
      }
      #a4-report-card-sheet {
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 6mm 8.5mm !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        transform-origin: top left !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
      }
    </style>
  </head>
  <body>
    <div id="a4-print-stage">${sheetHtml}</div>
    <script>
      (function() {
        function fitAndPrint() {
          var stage = document.getElementById('a4-print-stage');
          var sheet = document.getElementById('a4-report-card-sheet');
          if (stage && sheet) {
            var targetH = stage.clientHeight || 1122;
            var actualH = sheet.scrollHeight;
            if (actualH > targetH + 4) {
              var scale = Math.max(0.76, targetH / actualH);
              sheet.style.transform = 'scale(' + scale + ')';
              sheet.style.width = (210 / scale) + 'mm';
              sheet.style.minWidth = (210 / scale) + 'mm';
              sheet.style.maxWidth = (210 / scale) + 'mm';
              sheet.style.minHeight = (297 / scale) + 'mm';
            }
          }
          setTimeout(function() {
            window.focus();
            window.print();
          }, 200);
        }
        var imgs = Array.prototype.slice.call(document.images || []);
        if (imgs.length === 0) {
          fitAndPrint();
        } else {
          var loaded = 0;
          var done = false;
          function check() {
            loaded++;
            if (!done && loaded >= imgs.length) {
              done = true;
              fitAndPrint();
            }
          }
          imgs.forEach(function(img) {
            if (img.complete) check();
            else {
              img.addEventListener('load', check);
              img.addEventListener('error', check);
            }
          });
          setTimeout(function() {
            if (!done) {
              done = true;
              fitAndPrint();
            }
          }, 900);
        }
      })();
    </script>
  </body>
</html>`)
    doc.close()

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 8000)
  }

  const resolvedComponents: EvaluationMatrixComponent[] =
    Array.isArray(assessmentComponents) && assessmentComponents.length > 0
      ? assessmentComponents
      : []

  const rawRows = student.reportCard || []
  const rows = deduplicateSubjectRows(rawRows, resolvedComponents).slice(0, 20)

  const resolvedMaxTotal =
    typeof maxTotal === 'number' && maxTotal > 0
      ? maxTotal
      : student.maxMarksPerSubject && student.maxMarksPerSubject > 0
        ? student.maxMarksPerSubject
        : resolvedComponents.length > 0
          ? resolvedComponents.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0)
          : Number(rows[0]?.maxMarks) || 100

  const isCaStage = Boolean(stage && stage.toUpperCase() !== 'FULL')
  const isCombinedCa = stage === 'COMBINED_CA' || stage === 'CA_ONLY'

  const effectiveGradingRanges: GradingRangeItem[] =
    Array.isArray(gradingRanges) && gradingRanges.length > 0
      ? gradingRanges
      : [
        { grade: 'A', minPercentage: 70, maxPercentage: 100, remark: 'Excellent' },
        { grade: 'B', minPercentage: 60, maxPercentage: 69, remark: 'Very Good' },
        { grade: 'C', minPercentage: 50, maxPercentage: 59, remark: 'Credit' },
        { grade: 'D', minPercentage: 45, maxPercentage: 49, remark: 'Pass' },
        { grade: 'E', minPercentage: 40, maxPercentage: 44, remark: 'Fair' },
        { grade: 'F', minPercentage: 0, maxPercentage: 39, remark: 'Fail' },
      ]

  const getComponentScoreValue = (
    row: BrandedReportSubjectRow,
    comp: EvaluationMatrixComponent,
    compIdx: number
  ): string | number => {
    if (row.absent) return '-'
    const map = row.componentScores || {}
    const candidates = [comp.code, comp.key, comp.label, comp.name].filter(Boolean) as string[]
    for (const cand of candidates) {
      if (map[cand] !== undefined && map[cand] !== null) {
        return map[cand] as string | number
      }
      const upper = cand.toUpperCase()
      for (const [k, v] of Object.entries(map)) {
        if (k.toUpperCase() === upper && v !== undefined && v !== null) {
          return v as string | number
        }
      }
    }
    const cat = String(comp.category || '').toUpperCase()
    if (cat === 'EXAM' && (row.theoryMark !== undefined || row.examScore !== undefined)) {
      return row.theoryMark ?? row.examScore ?? '-'
    }
    if (cat === 'CA' && compIdx === 0 && (row.cbtMark !== undefined || row.caScore !== undefined)) {
      return row.cbtMark ?? row.caScore ?? '-'
    }
    return '-'
  }

  const computedTotal = rows.reduce(
    (acc, r) => acc + (r.absent ? 0 : Number(r.stageScore ?? r.mark ?? r.totalScore ?? 0) || 0),
    0
  )
  const validRowsCount = rows.filter(
    (r) => !r.absent && !isNaN(Number(r.stageScore ?? r.mark ?? r.totalScore))
  ).length

  const computedAvg =
    rawRows.length !== rows.length && validRowsCount > 0 && resolvedMaxTotal > 0
      ? Number((((computedTotal / validRowsCount) / resolvedMaxTotal) * 100).toFixed(1))
      : (student.average ??
        (validRowsCount > 0 && resolvedMaxTotal > 0
          ? Number((((computedTotal / validRowsCount) / resolvedMaxTotal) * 100).toFixed(1))
          : 0))

  const overallGradeInfo = getLetterGradeAndRemark(Number(computedAvg || 0), effectiveGradingRanges)
  const finalGrade =
    rawRows.length !== rows.length ? overallGradeInfo.grade : student.grade || overallGradeInfo.grade
  const gpaRating = `${finalGrade} (${overallGradeInfo.remark})`

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const showPositionOnCard =
    !isCaStage &&
    branding?.showPosition !== false &&
    student.showPosition !== false &&
    branding?.rankingType !== 'hidden'

  const rankString = !showPositionOnCard
    ? '-'
    : student.rank && student.totalClassStudents
      ? `${getOrdinalSuffix(student.rank)} of ${student.totalClassStudents}`
      : student.position
        ? student.position.replace(' out of ', ' of ')
        : '-'

  const totalScoreString =
    validRowsCount > 0
      ? `${Math.round(computedTotal * 10) / 10} / ${validRowsCount * resolvedMaxTotal}`
      : `${rows.length} Subjects`

  const presentDays = student.presentCount ?? 0
  const absentDays = student.absentCount ?? 0
  const totalAttDays = student.totalAttendanceDays || presentDays + absentDays
  const attRate =
    student.attendanceRate ??
    (totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 100)
  const attText =
    totalAttDays > 0 ? `${presentDays} / ${totalAttDays} Days (${attRate}%)` : 'Recorded'

  const dobDisplay = student.birthday
    ? (() => {
      const d = new Date(student.birthday)
      return !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-GB') : String(student.birthday)
    })()
    : 'N/A'
  const genderDisplay = student.gender
    ? String(student.gender).charAt(0).toUpperCase() + String(student.gender).slice(1).toLowerCase()
    : 'N/A'

  const schoolInitials = (schoolName || 'SCH')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

  const studentInitials = (student.studentName || 'ST')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  const contactItems: string[] = []
  if (phone) contactItems.push(`Tel: ${phone}`)
  if (email) contactItems.push(email)
  if (website) contactItems.push(website)
  const contactLine = contactItems.join('  •  ')

  const reportSubtitle = student.isEcd
    ? 'MONTESSORI & EARLY YEARS DEVELOPMENTAL REPORT'
    : student.isCommentBased
      ? 'EARLY YEARS & MONTESSORI DEVELOPMENTAL REPORT'
      : isCombinedCa
        ? `CONTINUOUS ASSESSMENT REPORT (${resolvedComponents.map((c) => c.code || c.label).join(' + ') || 'CA'})`
        : isCaStage
          ? 'CONTINUOUS ASSESSMENT PROGRESS REPORT'
          : 'OFFICIAL STUDENT TERMINAL REPORT CARD'

  const minDisplayRows = 8
  const fillerCount = Math.max(0, minDisplayRows - rows.length)
  const effectiveRowCount = Math.max(rows.length, minDisplayRows)

  // Dynamic row padding to mirror the PDF's full-page vertical distribution
  const rowPadClass =
    effectiveRowCount <= 10
      ? 'py-[5px]'
      : effectiveRowCount <= 13
        ? 'py-[4px]'
        : effectiveRowCount <= 16
          ? 'py-[3px]'
          : 'py-[2px]'

  const scaleSummary = effectiveGradingRanges
    .slice(0, 6)
    .map((r) => `${r.grade}:${r.minPercentage}-${r.maxPercentage}%`)
    .join(' | ')

  const resolvedTeacherRemark =
    teacherCommentVal ||
    (isCaStage
      ? 'Student is making steady continuous assessment progress across active subjects this term.'
      : 'Good academic effort this term. Keep striving for excellence.')

  const resolvedPrincipalRemark =
    principalCommentVal ||
    'A commendable terminal performance. Continue to work diligently in the coming term.'

  return (
    <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-[224mm] mx-auto print:bg-white print:shadow-none print:border-0">
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30"
            style={{ backgroundColor: secondaryColor }}
          />
          <span className="text-xs font-black tracking-wide uppercase">
            A4 Single-Page Official Report Card
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
            <CheckCircle2 size={11} /> 1-Page A4 Exact PDF Match
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editable && onSaveRemarksAndSettings && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${isEditing
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
            >
              <Edit3 size={13} />
              {isEditing ? 'Close Editor' : 'Edit Remarks / Traits / Signatures'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Printer size={13} /> Print (1-Page A4)
          </button>
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: secondaryColor }}
            >
              {isDownloadingPdf ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download A4 PDF
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close Preview"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Quick Editor Drawer (when toggled by Admin or Teacher) */}
      {isEditing && editable && (
        <div className="p-4 bg-amber-50/90 border-b border-amber-200 space-y-3.5 print:hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Edit3 size={14} /> Customize Report Card Remarks, Psychomotor/Affective Traits & Signatures
            </h4>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save & Apply Immediately
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                Next Term Resumption Date
              </label>
              <input
                type="text"
                value={resumptionDateVal}
                onChange={(e) => setResumptionDateVal(e.target.value)}
                placeholder="e.g. Monday, 12th Jan 2026"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                Next Term Payment / Fees
              </label>
              <input
                type="text"
                value={nextTermFeesVal}
                onChange={(e) => setNextTermFeesVal(e.target.value)}
                placeholder="e.g. ₦85,000"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                Principal / Head of School Name
              </label>
              <input
                type="text"
                value={principalNameVal}
                onChange={(e) => setPrincipalNameVal(e.target.value)}
                placeholder="e.g. Dr. (Mrs.) A. Okafor"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Inline Psychomotor & Affective Quick Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-amber-200/80">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-700 mb-2 flex items-center gap-1">
                <Brain size={12} className="text-indigo-600" /> Psychomotor Skills Ratings
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PSYCHOMOTOR_TRAIT_DEFINITIONS.map((t) => (
                  <div key={t.key}>
                    <label className="block text-[10px] font-semibold text-slate-600 truncate">
                      {t.label}
                    </label>
                    <select
                      value={psychomotorVal[t.key] || 'AC'}
                      onChange={(e) =>
                        setPsychomotorVal((prev) => ({ ...prev, [t.key]: e.target.value }))
                      }
                      className="w-full mt-0.5 px-2 py-1 rounded border border-slate-300 text-[11px] font-bold text-slate-800 bg-slate-50"
                    >
                      {TRAIT_RATING_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.score} - {opt.label} ({opt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-slate-700 mb-2 flex items-center gap-1">
                <HeartHandshake size={12} className="text-sky-600" /> Affective & Behavioral Ratings
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AFFECTIVE_TRAIT_DEFINITIONS.map((t) => (
                  <div key={t.key}>
                    <label className="block text-[10px] font-semibold text-slate-600 truncate">
                      {t.label}
                    </label>
                    <select
                      value={affectiveVal[t.key] || 'AC'}
                      onChange={(e) =>
                        setAffectiveVal((prev) => ({ ...prev, [t.key]: e.target.value }))
                      }
                      className="w-full mt-0.5 px-2 py-1 rounded border border-slate-300 text-[11px] font-bold text-slate-800 bg-slate-50"
                    >
                      {TRAIT_RATING_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.score} - {opt.label} ({opt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                Class Teacher&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={teacherCommentVal}
                onChange={(e) => setTeacherCommentVal(e.target.value)}
                placeholder="Enter Class Teacher's remark..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                Principal&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={principalCommentVal}
                onChange={(e) => setPrincipalCommentVal(e.target.value)}
                placeholder="Enter Principal's endorsement remark..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                {teacherSigVal ? (
                  <img
                    src={teacherSigVal}
                    alt="Teacher Signature"
                    className="h-8 w-20 object-contain border border-slate-100 rounded p-0.5"
                  />
                ) : (
                  <div className="h-8 w-20 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    No Sig
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold text-slate-800">Teacher&apos;s Signature</p>
                  <p className="text-[10px] text-slate-500">PNG/JPG Digital Signature</p>
                </div>
              </div>
              <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                <Upload size={12} /> Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSignatureUpload(e, 'teacher')}
                  className="hidden"
                />
              </label>
            </div>

            {editorRole === 'admin' && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2">
                  {principalSigVal ? (
                    <img
                      src={principalSigVal}
                      alt="Principal Signature"
                      className="h-8 w-20 object-contain border border-slate-100 rounded p-0.5"
                    />
                  ) : (
                    <div className="h-8 w-20 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      No Sig
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Principal&apos;s Signature</p>
                    <p className="text-[10px] text-slate-500">PNG/JPG Digital Signature</p>
                  </div>
                </div>
                <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                  <Upload size={12} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSignatureUpload(e, 'principal')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== A4 SINGLE-PAGE REPORT CARD SHEET (100% PDF PARITY) ==================== */}
      <div className="p-2 sm:p-4 bg-slate-300/70 overflow-x-auto print:p-0 print:bg-white">
        <div
          id="a4-report-card-sheet"
          ref={sheetRef}
          className="w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[296mm] mx-auto bg-white text-[#0f172a] border border-slate-300 shadow-lg px-[8.5mm] py-[6mm] flex flex-col justify-between print:shadow-none print:border-0"
          style={{
            fontFamily: 'Helvetica, Arial, ui-sans-serif, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* TOP + MIDDLE GROUP */}
          <div className="space-y-2.5">
            {/* BAND 1: BRANDED INSTITUTIONAL HEADER BANNER (MATCHES PDF drawBrandedReportHeader) */}
            <div className="w-full overflow-hidden">
              <div
                className="px-3 py-2 text-white flex items-center justify-between gap-3"
                style={{ backgroundColor: primaryColor, minHeight: '90px' }}
              >
                {/* Left: School Logo Box */}
                <div className="w-[68px] h-[68px] rounded-[6px] bg-white p-1 flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={schoolName}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span
                      className="font-black text-lg tracking-tight"
                      style={{ color: primaryColor }}
                    >
                      {schoolInitials}
                    </span>
                  )}
                </div>

                {/* Center: School Name, Motto, Address, Contact & Report Subtitle on distinct lines */}
                <div className="flex-1 min-w-0 text-left leading-tight space-y-[2px]">
                  <h1 className="text-[16px] font-bold uppercase tracking-tight text-white truncate">
                    {schoolName}
                  </h1>
                  {tagline && (
                    <p className="text-[10px] italic text-[#e0f2fe] truncate">
                      &ldquo;{tagline}&rdquo;
                    </p>
                  )}
                  {address && (
                    <p className="text-[9.2px] text-[#f1f5f9] truncate">{address}</p>
                  )}
                  {contactLine && (
                    <p className="text-[9px] text-[#e2e8f0] truncate">{contactLine}</p>
                  )}
                  <p className="text-[10px] font-bold text-white uppercase tracking-wide pt-[2px] truncate">
                    {reportSubtitle}
                  </p>
                </div>

                {/* Right: Term, Session, Branch & Issued Date */}
                <div className="shrink-0 text-right leading-snug">
                  <p className="text-[11.5px] font-bold uppercase text-white">
                    {branding?.currentTerm || 'FIRST TERM'}
                  </p>
                  <p className="text-[9.8px] text-[#e2e8f0] mt-0.5">
                    Session: {branding?.academicSession || '2025/2026'}
                  </p>
                  <p className="text-[9.8px] text-[#e2e8f0]">Branch: {branchCode}</p>
                  <p className="text-[9.8px] text-[#e2e8f0]">
                    Issued: {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
              <div className="h-[4px] w-full" style={{ backgroundColor: secondaryColor }} />
            </div>

            {/* BAND 2: STUDENT BIO WITH RIGHT-ALIGNED PASSPORT PHOTO (MATCHES PDF drawStudentBioWithPhoto) */}
            <div className="relative border border-[#e2e8f0] bg-white flex items-center justify-between px-3 py-2">
              {/* Left 4pt Secondary Color Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[5px]"
                style={{ backgroundColor: secondaryColor }}
              />

              {/* Column 1: Student Name, Admission No, Class & Arm, Gender/DOB */}
              <div className="w-[46%] pl-2 pr-3 space-y-1 text-[10.5px]">
                <div className="flex items-baseline">
                  <span className="w-[90px] shrink-0 text-[#475569]">Student Name:</span>
                  <span className="font-bold text-[#0f172a] truncate">{student.studentName}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[90px] shrink-0 text-[#475569]">Admission No:</span>
                  <span className="font-bold text-[#0f172a] truncate">
                    {student.registerNo || student.admissionNo || 'Assigned'}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[90px] shrink-0 text-[#475569]">Class &amp; Arm:</span>
                  <span className="font-bold text-[#0f172a] truncate">
                    {student.className}
                    {student.sectionName ? ` (${student.sectionName})` : ''}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[90px] shrink-0 text-[#475569]">Gender / DOB:</span>
                  <span className="text-[#0f172a] truncate">
                    {genderDisplay} &nbsp;•&nbsp; {dobDisplay}
                  </span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px self-stretch bg-[#e2e8f0] my-0.5" />

              {/* Column 2: Overall Average, Final Grade, Class Position, Attendance */}
              <div className="flex-1 px-3 space-y-1 text-[10.5px]">
                <div className="flex items-baseline">
                  <span className="w-[100px] shrink-0 text-[#475569]">Overall Average:</span>
                  <span className="font-bold text-[11.5px]" style={{ color: primaryColor }}>
                    {student.isCommentBased ? 'Qualitative Rubric' : `${computedAvg}%`}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[100px] shrink-0 text-[#475569]">Final Grade:</span>
                  <span className="font-bold text-[#0f172a] truncate">
                    {student.isCommentBased ? 'Developmental' : gpaRating}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[100px] shrink-0 text-[#475569]">
                    {showPositionOnCard ? 'Class Position:' : 'Total Score:'}
                  </span>
                  <span className="font-bold text-[#0f172a] truncate">
                    {showPositionOnCard ? rankString : totalScoreString}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-[100px] shrink-0 text-[#475569]">Attendance:</span>
                  <span className="text-[#0f172a] truncate">{attText}</span>
                </div>
              </div>

              {/* Far Right: Student Passport Photo Frame */}
              <div className="w-[68px] h-[68px] rounded-[5px] bg-[#f8fafc] border border-[#e2e8f0] p-[2px] flex items-center justify-center shrink-0 overflow-hidden">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.studentName}
                    className="w-full h-full object-cover rounded-[3px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-bold text-sm" style={{ color: primaryColor }}>
                      {studentInitials}
                    </span>
                    <span className="text-[7.5px] text-[#475569] uppercase">PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* BAND 3: 1. COGNITIVE ACADEMIC PERFORMANCE TABLE (MATCHES PDF) */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h2
                  className="text-[11.5px] font-bold uppercase tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {student.isCommentBased
                    ? '1. LEARNING DOMAINS & QUALITATIVE OBSERVATIONS'
                    : isCaStage
                      ? '1. CONTINUOUS ASSESSMENT PERFORMANCE'
                      : '1. COGNITIVE ACADEMIC PERFORMANCE'}
                </h2>
                <span className="text-[9.5px] text-[#475569]">
                  Subjects Evaluated: {student.subjectComments?.length || rows.length} &nbsp;•&nbsp;
                  Max Score / Subject: {resolvedMaxTotal || 100}
                </span>
              </div>

              {student.isCommentBased &&
                student.subjectComments &&
                student.subjectComments.length > 0 ? (
                <table className="w-full text-[10px] border-collapse border border-[#e2e8f0]">
                  <thead>
                    <tr
                      className="text-white font-bold uppercase text-[9.5px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <th className="py-1.5 px-2 text-left w-[30%]">LEARNING DOMAIN / SUBJECT</th>
                      <th className="py-1.5 px-2 text-left">TEACHER QUALITATIVE OBSERVATION</th>
                      <th className="py-1.5 px-2 text-center w-[18%]">RATING (1-5)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.subjectComments.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className={`border-b border-[#e2e8f0] ${idx % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'
                          }`}
                      >
                        <td className="py-1.5 px-2 font-bold text-[#0f172a]">{item.subjectName}</td>
                        <td className="py-1.5 px-2 text-[#475569]">{item.comment}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {item.ratingLabel || `${item.rating} / 5`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-[10px] border-collapse border border-[#e2e8f0]">
                  <thead>
                    <tr
                      className="text-white font-bold uppercase text-[9.2px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <th className="py-1.5 px-1.5 text-left w-[56px]">CODE</th>
                      <th className="py-1.5 px-2 text-left">SUBJECT</th>
                      {resolvedComponents.map((comp) => {
                        const rawH = String(
                          comp.label || comp.name || comp.code || comp.key || ''
                        ).trim()
                        const shortH =
                          rawH.length <= 10
                            ? rawH.toUpperCase()
                            : String(comp.code || comp.key || rawH).toUpperCase()
                        return (
                          <th
                            key={comp.code || comp.key}
                            className="py-1.5 px-1.5 text-right whitespace-nowrap w-[58px]"
                          >
                            {comp.maxMarks ? `${shortH}(${comp.maxMarks})` : shortH}
                          </th>
                        )
                      })}
                      <th className="py-1.5 px-1.5 text-right whitespace-nowrap w-[66px]">
                        {resolvedMaxTotal > 0 ? `TOTAL(${resolvedMaxTotal})` : 'TOTAL'}
                      </th>
                      <th className="py-1.5 px-1.5 text-right whitespace-nowrap w-[64px]">
                        CLASS AVG
                      </th>
                      <th className="py-1.5 px-1.5 text-center w-[46px]">GRADE</th>
                      <th className="py-1.5 px-1.5 text-center w-[104px]">REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const totNum = Number(r.stageScore ?? r.mark ?? r.totalScore ?? 0)
                      const rowMax = Number(r.maxMarks) || resolvedMaxTotal || 100
                      const normalizedPct = rowMax > 0 ? (totNum / rowMax) * 100 : totNum
                      const gradeInfo = getLetterGradeAndRemark(
                        normalizedPct,
                        effectiveGradingRanges
                      )
                      const rowGrade = r.grade && r.grade !== '-' ? r.grade : gradeInfo.grade
                      const rowRemark = formatCompactRemark(
                        r.remark && r.remark !== '-' ? r.remark : gradeInfo.remark
                      )

                      return (
                        <tr
                          key={r.id || idx}
                          className={`border-b border-[#e2e8f0] ${idx % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'
                            }`}
                        >
                          <td
                            className={`${rowPadClass} px-1.5 font-bold text-[#0f172a] text-[9.5px] truncate`}
                          >
                            {r.subjectCode || '-'}
                          </td>
                          <td className={`${rowPadClass} px-2 font-bold text-[#0f172a] truncate`}>
                            {r.subjectName || '-'}
                          </td>
                          {resolvedComponents.map((comp, compIdx) => {
                            const compVal = getComponentScoreValue(r, comp, compIdx)
                            return (
                              <td
                                key={comp.code || comp.key || compIdx}
                                className={`${rowPadClass} px-1.5 text-right text-[#0f172a]`}
                              >
                                {compVal}
                              </td>
                            )
                          })}
                          <td className={`${rowPadClass} px-1.5 text-right font-bold text-[#0f172a]`}>
                            {r.absent ? '-' : (r.stageScore ?? r.mark ?? r.totalScore ?? totNum)}
                          </td>
                          <td className={`${rowPadClass} px-1.5 text-right text-[#0f172a]`}>
                            {r.absent ? '-' : (r.classAverage ?? '-')}
                          </td>
                          <td
                            className={`${rowPadClass} px-1.5 text-center font-bold`}
                            style={{ color: primaryColor }}
                          >
                            {r.absent ? 'ABS' : rowGrade}
                          </td>
                          <td
                            className={`${rowPadClass} px-1.5 text-center text-[#475569] text-[9.3px] truncate`}
                          >
                            {r.absent ? 'Absent' : rowRemark}
                          </td>
                        </tr>
                      )
                    })}

                    {/* Clean Filler Rows when fewer than 8 subjects */}
                    {Array.from({ length: fillerCount }).map((_, fIdx) => {
                      const rowIdx = rows.length + fIdx
                      return (
                        <tr
                          key={`filler-${fIdx}`}
                          className={`border-b border-[#e2e8f0] ${rowIdx % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'
                            }`}
                        >
                          <td className={`${rowPadClass} px-1.5 text-transparent select-none`}>-</td>
                          <td className={`${rowPadClass} px-2 text-transparent select-none`}>-</td>
                          {resolvedComponents.map((comp, cIdx) => (
                            <td
                              key={`f-c-${cIdx}`}
                              className={`${rowPadClass} px-1.5 text-transparent select-none`}
                            >
                              -
                            </td>
                          ))}
                          <td className={`${rowPadClass} px-1.5 text-transparent select-none`}>-</td>
                          <td className={`${rowPadClass} px-1.5 text-transparent select-none`}>-</td>
                          <td className={`${rowPadClass} px-1.5 text-transparent select-none`}>-</td>
                          <td className={`${rowPadClass} px-1.5 text-transparent select-none`}>-</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr
                      className="bg-[#eff6ff] border-t border-[#e2e8f0] font-bold text-[9.6px]"
                      style={{ color: primaryColor }}
                    >
                      <td colSpan={2 + resolvedComponents.length} className="py-1.5 px-1.5 uppercase">
                        CUMULATIVE PERFORMANCE SUMMARY
                      </td>
                      <td className="py-1.5 px-1.5 text-right whitespace-nowrap">
                        {validRowsCount > 0
                          ? `${Math.round(computedTotal * 10) / 10} / ${validRowsCount * resolvedMaxTotal}`
                          : `${computedAvg}%`}
                      </td>
                      <td className="py-1.5 px-1.5 text-right whitespace-nowrap">
                        AVG: {computedAvg}%
                      </td>
                      <td className="py-1.5 px-1.5 text-center">{finalGrade}</td>
                      <td className="py-1.5 px-1.5 text-center truncate">
                        {isCaStage
                          ? 'In Progress'
                          : showPositionOnCard
                            ? rankString
                            : overallGradeInfo.remark}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* BAND 4: 2. PSYCHOMOTOR & AFFECTIVE DOMAIN ASSESSMENT (MATCHES PDF drawPsychomotorAndAffectiveGrid) */}
            <div className="pt-0.5">
              <div className="flex items-baseline justify-between mb-1">
                <h2
                  className="text-[11.5px] font-bold uppercase tracking-tight"
                  style={{ color: primaryColor }}
                >
                  2. PSYCHOMOTOR &amp; AFFECTIVE DOMAIN ASSESSMENT
                </h2>
                <span className="text-[9.5px] text-[#475569]">
                  Behavioral &amp; Practical Skill Evaluation (Scale 1–5)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Left Table: Psychomotor Skills Assessment */}
                <table className="w-full text-[9.6px] border-collapse border border-[#e2e8f0]">
                  <thead>
                    <tr
                      className="text-white font-bold uppercase text-[9px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <th className="py-1 px-2 text-left">PSYCHOMOTOR SKILLS ASSESSMENT</th>
                      <th className="py-1 px-2 text-right">SCALE (1-5) &amp; RATING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PSYCHOMOTOR_TRAIT_DEFINITIONS.map((trait, idx) => {
                      const meta = resolveTraitRatingMeta(psychomotorVal[trait.key])
                      return (
                        <tr
                          key={trait.key}
                          className={`border-b border-[#e2e8f0] ${idx % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'
                            }`}
                        >
                          <td className="py-1 px-2 font-bold text-[#0f172a]">{trait.label}</td>
                          <td className="py-1 px-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-[3px]">
                              {[1, 2, 3, 4, 5].map((n) => {
                                const active = n === meta.score
                                return (
                                  <span
                                    key={n}
                                    className={`w-[15px] h-[13px] rounded-[2px] text-[8px] font-bold inline-flex items-center justify-center border ${active
                                      ? 'text-white border-transparent'
                                      : 'text-[#94a3b8] border-[#cbd5e1] bg-white'
                                      }`}
                                    style={active ? { backgroundColor: primaryColor } : undefined}
                                  >
                                    {n}
                                  </span>
                                )
                              })}
                              <span
                                className="ml-1.5 text-[9px] font-bold inline-block w-[68px] text-right"
                                style={{ color: primaryColor }}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Right Table: Affective & Behavioral Traits */}
                <table className="w-full text-[9.6px] border-collapse border border-[#e2e8f0]">
                  <thead>
                    <tr
                      className="text-white font-bold uppercase text-[9px]"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <th className="py-1 px-2 text-left">AFFECTIVE &amp; BEHAVIORAL TRAITS</th>
                      <th className="py-1 px-2 text-right">SCALE (1-5) &amp; RATING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AFFECTIVE_TRAIT_DEFINITIONS.map((trait, idx) => {
                      const meta = resolveTraitRatingMeta(affectiveVal[trait.key])
                      return (
                        <tr
                          key={trait.key}
                          className={`border-b border-[#e2e8f0] ${idx % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'
                            }`}
                        >
                          <td className="py-1 px-2 font-bold text-[#0f172a]">{trait.label}</td>
                          <td className="py-1 px-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-[3px]">
                              {[1, 2, 3, 4, 5].map((n) => {
                                const active = n === meta.score
                                return (
                                  <span
                                    key={n}
                                    className={`w-[15px] h-[13px] rounded-[2px] text-[8px] font-bold inline-flex items-center justify-center border ${active
                                      ? 'text-white border-transparent'
                                      : 'text-[#94a3b8] border-[#cbd5e1] bg-white'
                                      }`}
                                    style={active ? { backgroundColor: secondaryColor } : undefined}
                                  >
                                    {n}
                                  </span>
                                )
                              })}
                              <span
                                className="ml-1.5 text-[9px] font-bold inline-block w-[68px] text-right"
                                style={{ color: secondaryColor }}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Single-Line Grading & Trait Key Strip */}
              <div className="mt-1.5 px-2.5 py-1 bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-2 text-[8.4px] font-bold leading-none">
                <span className="text-[#0f172a] truncate">GRADING KEY: {scaleSummary}</span>
                <span className="text-[#475569] text-right shrink-0">
                  TRAIT KEY: 5(MS)=Excellent | 4(AC)=Very Good | 3(DV)=Good | 2(EM)=Fair | 1=Needs Help
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM ANCHORED GROUP: RESUMPTION BAR + ENDORSEMENT BOXES + VERIFICATION FOOTER */}
          <div className="space-y-2 pt-2">
            {/* 1. Next Term Resumption & Fees Strip */}
            <div className="relative bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 flex items-center justify-between text-[9.8px]">
              <div
                className="absolute left-0 top-0 bottom-0 w-[5px]"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="pl-2 flex items-center gap-2">
                <span className="font-bold uppercase text-[#475569]">NEXT TERM BEGINS:</span>
                <span className="font-bold text-[10.5px]" style={{ color: primaryColor }}>
                  {resumptionDateVal || 'To Be Announced'}
                </span>
              </div>
              <div className="w-[48%] flex items-center gap-2">
                <span className="font-bold uppercase text-[#475569]">NEXT TERM SCHOOL FEES:</span>
                <span className="font-bold text-[10.5px]" style={{ color: primaryColor }}>
                  {nextTermFeesVal || '—'}
                </span>
              </div>
            </div>

            {/* 2. Side-by-Side Combined Remarks & Signatures Boxes */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left Box: Class Teacher's Remark & Endorsement */}
              <div className="border border-[#e2e8f0] bg-white flex flex-col justify-between min-h-[108px]">
                <div>
                  <div
                    className="px-2.5 py-1 text-white font-bold uppercase text-[9.2px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    CLASS TEACHER&apos;S REMARK &amp; ENDORSEMENT
                  </div>
                  <p className="px-2.5 py-2 text-[10px] italic text-[#0f172a] leading-snug line-clamp-2">
                    &ldquo;{resolvedTeacherRemark}&rdquo;
                  </p>
                </div>
                <div className="mx-2.5 pt-1.5 pb-1.5 border-t border-[#e2e8f0] flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[9.5px] font-bold uppercase text-[#0f172a] leading-tight">
                      {branding?.classTeacherName || 'CLASS TEACHER'}
                    </p>
                    <p className="text-[8px] uppercase text-[#475569] mt-0.5">FORM TEACHER</p>
                  </div>
                  <div className="w-[140px] text-center">
                    <div className="h-6 border-b border-[#e2e8f0] flex items-center justify-center overflow-hidden">
                      {teacherSigVal ? (
                        <img
                          src={teacherSigVal}
                          alt="Teacher Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : null}
                    </div>
                    <span className="text-[7.8px] uppercase text-[#475569] block mt-0.5">
                      SIGNATURE
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Box: Principal's / Head Teacher's Endorsement */}
              <div className="border border-[#e2e8f0] bg-white flex flex-col justify-between min-h-[108px]">
                <div>
                  <div
                    className="px-2.5 py-1 text-white font-bold uppercase text-[9.2px]"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    PRINCIPAL&apos;S / HEAD TEACHER&apos;S ENDORSEMENT
                  </div>
                  <p className="px-2.5 py-2 text-[10px] italic text-[#0f172a] leading-snug line-clamp-2">
                    &ldquo;{resolvedPrincipalRemark}&rdquo;
                  </p>
                </div>
                <div className="mx-2.5 pt-1.5 pb-1.5 border-t border-[#e2e8f0] flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[9.5px] font-bold uppercase text-[#0f172a] leading-tight">
                      {principalNameVal || 'THE PRINCIPAL'}
                    </p>
                    <p
                      className="text-[8px] font-bold uppercase mt-0.5"
                      style={{ color: secondaryColor }}
                    >
                      OFFICIAL STAMP &amp; SEAL
                    </p>
                  </div>
                  <div className="w-[140px] text-center">
                    <div className="h-6 border-b border-[#e2e8f0] flex items-center justify-center overflow-hidden">
                      {principalSigVal ? (
                        <img
                          src={principalSigVal}
                          alt="Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : null}
                    </div>
                    <span className="text-[7.8px] uppercase text-[#475569] block mt-0.5">
                      SIGNATURE &amp; STAMP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Verification Footer */}
            <div className="pt-1 border-t border-[#e2e8f0] text-center text-[8.8px] text-[#475569]">
              Official A4 Academic Dossier • {schoolName} • Generated &amp; Verified on{' '}
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
