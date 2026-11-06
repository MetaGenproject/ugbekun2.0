'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Printer,
  Download,
  X,
  Calendar,
  CreditCard,
  Award,
  UserCheck,
  FileSignature,
  CheckCircle2,
  Save,
  Loader2,
  Upload,
  Edit3,
  Phone,
  Mail,
  Globe,
  MapPin,
} from 'lucide-react'

export interface SchoolReportBranding {
  schoolName: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  currencySymbol: string
  academicSession: string
  currentTerm: string
  resumptionDate: string | null
  nextTermFees: string | null
  principalName: string
  principalSignatureUrl: string | null
  defaultTeacherSignatureUrl: string | null
  classTeacherName: string
  classTeacherSignatureUrl: string | null
  autoPublishReportCards: boolean
  branchCode: string
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
  grade?: string | null
  position?: string | null
  rank?: number | null
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

interface BrandedReportCardPreviewProps {
  student: BrandedReportCardStudentData
  branding?: Partial<SchoolReportBranding> | null
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
  }) => Promise<void>
}

function getLetterGradeAndRemark(score: number): { grade: string; remark: string; color: string } {
  if (score >= 75) return { grade: 'A', remark: 'Excellent', color: '#059669' }
  if (score >= 65) return { grade: 'B', remark: 'Very Good', color: '#0284c7' }
  if (score >= 50) return { grade: 'C', remark: 'Credit', color: '#4f46e5' }
  if (score >= 40) return { grade: 'D', remark: 'Pass', color: '#d97706' }
  return { grade: 'F', remark: 'Needs Improvement', color: '#dc2626' }
}

export function BrandedReportCardPreview({
  student,
  branding,
  onClose,
  onDownloadPdf,
  isDownloadingPdf = false,
  editable = false,
  editorRole = 'admin',
  onSaveRemarksAndSettings,
}: BrandedReportCardPreviewProps) {
  const primaryColor = branding?.primaryColor || '#0f172a'
  const secondaryColor = branding?.secondaryColor || '#0284c7'
  const schoolName = branding?.schoolName || 'Ugbekun Academy'
  const tagline = branding?.tagline || 'Excellence in Knowledge & Character'
  const address = branding?.address || 'Main School Campus'
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
    branding?.principalName || 'School Principal'
  )
  const [teacherSigVal, setTeacherSigVal] = useState(
    branding?.classTeacherSignatureUrl || branding?.defaultTeacherSignatureUrl || ''
  )
  const [principalSigVal, setPrincipalSigVal] = useState(
    branding?.principalSignatureUrl || ''
  )

  useEffect(() => {
    setTeacherCommentVal(student.teacherComment || '')
    setPrincipalCommentVal(student.principalComment || '')
    setResumptionDateVal(student.resumptionDate || branding?.resumptionDate || '')
    setNextTermFeesVal(student.nextTermFees || branding?.nextTermFees || '')
    setPrincipalNameVal(branding?.principalName || 'School Principal')
    setTeacherSigVal(
      branding?.classTeacherSignatureUrl || branding?.defaultTeacherSignatureUrl || ''
    )
    setPrincipalSigVal(branding?.principalSignatureUrl || '')
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
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const rows = student.reportCard || []
  const computedTotal =
    student.totalMarks ??
    rows.reduce((acc, r) => acc + (Number(r.mark ?? r.totalScore ?? 0) || 0), 0)
  const computedAvg =
    student.average ??
    (rows.length > 0 ? Number((computedTotal / rows.length).toFixed(1)) : 0)
  const overallGradeInfo = getLetterGradeAndRemark(Number(computedAvg || 0))
  const finalGrade = student.grade || overallGradeInfo.grade

  const presentDays = student.presentCount ?? 0
  const absentDays = student.absentCount ?? 0
  const totalAttDays = student.totalAttendanceDays || presentDays + absentDays
  const attRate =
    student.attendanceRate ??
    (totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 100)

  const initials = (student.studentName || 'ST')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto print:shadow-none print:border-0">
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full ring-2 ring-white/30"
            style={{ backgroundColor: secondaryColor }}
          />
          <span className="text-xs font-black tracking-wide uppercase">
            Live Branded Official Report Card
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
            <CheckCircle2 size={11} /> Real-Time Sync Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editable && onSaveRemarksAndSettings && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isEditing
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Edit3 size={13} />
              {isEditing ? 'Close Editor' : 'Edit Comments / Resumption / Signatures'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Printer size={13} /> Print
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
              Download PDF
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
        <div className="p-5 bg-amber-50/70 border-b border-amber-200/80 space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Edit3 size={14} /> Customize Report Card Details, Comments & Signatures
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Next Term Resumption Date
              </label>
              <input
                type="text"
                value={resumptionDateVal}
                onChange={(e) => setResumptionDateVal(e.target.value)}
                placeholder="e.g. Monday, 12th Jan 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Next Term Payment / Fees
              </label>
              <input
                type="text"
                value={nextTermFeesVal}
                onChange={(e) => setNextTermFeesVal(e.target.value)}
                placeholder="e.g. ₦85,000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Principal / Head of School Name
              </label>
              <input
                type="text"
                value={principalNameVal}
                onChange={(e) => setPrincipalNameVal(e.target.value)}
                placeholder="e.g. Dr. (Mrs.) A. Okafor"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Class Teacher&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={teacherCommentVal}
                onChange={(e) => setTeacherCommentVal(e.target.value)}
                placeholder="Enter Class Teacher's remark..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Principal&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={principalCommentVal}
                onChange={(e) => setPrincipalCommentVal(e.target.value)}
                placeholder="Enter Principal's endorsement remark..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2.5">
                {teacherSigVal ? (
                  <img
                    src={teacherSigVal}
                    alt="Teacher Signature"
                    className="h-9 w-20 object-contain border border-slate-100 rounded p-0.5"
                  />
                ) : (
                  <div className="h-9 w-20 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    No Sig
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold text-slate-800">Teacher&apos;s Signature</p>
                  <p className="text-[10px] text-slate-500">PNG/JPG Digital Signature</p>
                </div>
              </div>
              <label className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
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
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2.5">
                  {principalSigVal ? (
                    <img
                      src={principalSigVal}
                      alt="Principal Signature"
                      className="h-9 w-20 object-contain border border-slate-100 rounded p-0.5"
                    />
                  ) : (
                    <div className="h-9 w-20 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      No Sig
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Principal&apos;s Signature</p>
                    <p className="text-[10px] text-slate-500">PNG/JPG Digital Signature</p>
                  </div>
                </div>
                <label className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
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

      {/* ==================== OFFICIAL REPORT CARD SHEET ==================== */}
      <div className="p-6 sm:p-8 space-y-6 bg-white text-slate-900">
        {/* 1. SCHOOL BRANDED HEADER BANNER */}
        <div
          className="rounded-2xl overflow-hidden border shadow-xs"
          style={{ borderColor: `${primaryColor}30` }}
        >
          <div
            className="p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center gap-5 relative"
            style={{ backgroundColor: primaryColor }}
          >
            {/* School Crest / Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md border-2 border-white/40">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={schoolName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Building2 size={38} style={{ color: primaryColor }} />
              )}
            </div>

            {/* School Name, Motto, Address & Contact Information */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
                {schoolName}
              </h1>
              {tagline && (
                <p className="text-xs sm:text-sm font-semibold italic text-white/90">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px] text-white/85 font-medium">
                {address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" /> {address}
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} className="shrink-0" /> {phone}
                  </span>
                )}
                {email && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} className="shrink-0" /> {email}
                  </span>
                )}
                {website && (
                  <span className="flex items-center gap-1">
                    <Globe size={11} className="shrink-0" /> {website}
                  </span>
                )}
              </div>
            </div>

            {/* Session & Term Badge */}
            <div className="shrink-0 text-center sm:text-right">
              <span
                className="inline-block px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: secondaryColor }}
              >
                Official Terminal Report
              </span>
              <p className="text-xs font-bold text-white/90 mt-1.5">
                {branding?.academicSession || 'Current Academic Session'}
              </p>
              <p className="text-[11px] font-semibold text-white/75">
                {branding?.currentTerm || 'Active Term'}
              </p>
            </div>
          </div>

          {/* Secondary Brand Accent Bar */}
          <div className="h-2 w-full" style={{ backgroundColor: secondaryColor }} />
        </div>

        {/* 2. STUDENT PROFILE PICTURE, BIO-DATA & ATTENDANCE SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Student Profile Photo Box */}
          <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 shadow-sm bg-white flex items-center justify-center"
              style={{ borderColor: primaryColor }}
            >
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-white font-black text-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {initials}
                  <span className="text-[9px] font-semibold uppercase tracking-wider opacity-75 mt-0.5">
                    Student
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-black text-slate-900 text-center line-clamp-1">
              {student.studentName}
            </p>
            <span
              className="mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: secondaryColor }}
            >
              {student.registerNo || student.admissionNo || `ID-${student.id}`}
            </span>
          </div>

          {/* Student Bio-Data Grid */}
          <div className="md:col-span-6 p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
            <div
              className="text-[11px] font-black uppercase tracking-wider pb-2 mb-2.5 border-b border-slate-100 flex items-center gap-1.5"
              style={{ color: primaryColor }}
            >
              <UserCheck size={14} /> Student Bio-Data & Academic Profile
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Full Name
                </span>
                <span className="font-black text-slate-900">{student.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Admission / Reg No
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {student.registerNo || student.admissionNo || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Class & Section
                </span>
                <span className="font-bold text-slate-800">
                  {student.className}
                  {student.sectionName ? ` (${student.sectionName})` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Gender
                </span>
                <span className="font-bold text-slate-800 capitalize">
                  {student.gender || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Academic Session
                </span>
                <span className="font-bold text-slate-800">
                  {branding?.academicSession || 'Current Session'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Attendance Record
                </span>
                <span className="font-bold text-slate-800">
                  {totalAttDays > 0
                    ? `${presentDays} / ${totalAttDays} Days (${attRate}%)`
                    : `${attRate}% Present`}
                </span>
              </div>
            </div>
          </div>

          {/* Performance & Position Summary Card */}
          <div
            className="md:col-span-3 p-4 rounded-2xl border flex flex-col justify-between"
            style={{
              borderColor: `${secondaryColor}40`,
              backgroundColor: `${secondaryColor}08`,
            }}
          >
            <div
              className="text-[11px] font-black uppercase tracking-wider pb-2 border-b border-slate-200/70 flex items-center gap-1.5"
              style={{ color: primaryColor }}
            >
              <Award size={14} /> Overall Summary
            </div>

            <div className="my-2 text-center">
              <div className="text-3xl font-black" style={{ color: primaryColor }}>
                {student.isCommentBased ? 'QUALITATIVE' : `${computedAvg}%`}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                {student.isCommentBased
                  ? 'Developmental Evaluation'
                  : `Total Score: ${computedTotal} | Grade: ${finalGrade}`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-center">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200/80">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">
                  Position
                </span>
                <span className="text-xs font-black text-slate-900">
                  {student.position || (student.rank ? `#${student.rank}` : '—')}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200/80">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">
                  Subjects
                </span>
                <span className="text-xs font-black text-slate-900">
                  {student.subjectComments?.length || rows.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ACADEMIC SUBJECT SCORES OR DEVELOPMENTAL COMMENTS TABLE */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div
            className="px-4 py-2.5 text-white text-xs font-black uppercase tracking-wider flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <span>
              {student.isCommentBased
                ? 'Qualitative Subject Observations & Mastery Ratings'
                : 'Cognitive Domain — Subject Scores & Grades'}
            </span>
            <span className="text-[10px] font-semibold text-white/80">
              {branding?.currentTerm || 'Term Assessment'}
            </span>
          </div>

          {student.isCommentBased && student.subjectComments && student.subjectComments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b border-slate-200 text-left font-black uppercase text-[10px]"
                    style={{ backgroundColor: `${secondaryColor}15`, color: primaryColor }}
                  >
                    <th className="py-2.5 px-3">Subject / Learning Domain</th>
                    <th className="py-2.5 px-3">Teacher&apos;s Qualitative Observation</th>
                    <th className="py-2.5 px-3 text-center">Mastery Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {student.subjectComments.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {item.subjectName}
                        {item.subjectCode && (
                          <span className="block text-[10px] font-mono text-slate-400">
                            {item.subjectCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{item.comment}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black text-white"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          {item.rating}/5 • {item.ratingLabel || 'Proficient'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b border-slate-200 text-left font-black uppercase text-[10px]"
                    style={{ backgroundColor: `${secondaryColor}15`, color: primaryColor }}
                  >
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">CA / Test</th>
                    <th className="py-2.5 px-3 text-center">Exam</th>
                    <th className="py-2.5 px-3 text-center">Total (100)</th>
                    <th className="py-2.5 px-3 text-center">Class Avg</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No subject scores recorded for this student yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => {
                      const ca = r.cbtMark ?? r.caScore ?? '—'
                      const ex = r.theoryMark ?? r.examScore ?? '—'
                      const totNum = Number(r.mark ?? r.totalScore ?? 0)
                      const gradeInfo = getLetterGradeAndRemark(totNum)
                      const rowGrade = r.grade || gradeInfo.grade
                      const rowRemark = r.remark || gradeInfo.remark
                      return (
                        <tr
                          key={r.id || idx}
                          className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {r.subjectName}
                            {r.subjectCode && (
                              <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                                ({r.subjectCode})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                            {r.absent ? 'ABS' : ca}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                            {r.absent ? 'ABS' : ex}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900">
                            {r.absent ? 'ABS' : r.mark ?? r.totalScore ?? totNum}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {r.classAverage !== undefined && r.classAverage !== null
                              ? r.classAverage
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className="inline-block w-6 py-0.5 rounded font-black text-[11px] text-white"
                              style={{ backgroundColor: gradeInfo.color }}
                            >
                              {rowGrade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{rowRemark}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. NEXT TERM RESUMPTION DATE & NEXT TERM PAYMENT STRIP */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border"
          style={{
            borderColor: `${primaryColor}30`,
            backgroundColor: `${primaryColor}06`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Next Term Resumption Date
              </span>
              <span className="text-sm font-black text-slate-900">
                {resumptionDateVal || 'To Be Announced'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: secondaryColor }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Next Term School Fees / Payment
              </span>
              <span className="text-sm font-black text-slate-900">
                {nextTermFeesVal || 'Contact Bursary Office'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. TEACHER & PRINCIPAL COMMENTS + DIGITAL SIGNATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Teacher's Comment & Signature */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div
                className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: primaryColor }}
              >
                <FileSignature size={14} /> Class Teacher&apos;s Remark
              </div>
              <p className="text-xs text-slate-700 font-medium italic leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80 min-h-[56px]">
                &ldquo;
                {teacherCommentVal ||
                  'A focused and diligent student who participates actively in classroom learning.'}
                &rdquo;
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-900">
                  {branding?.classTeacherName || 'Class Teacher'}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Form / Class Teacher
                </p>
              </div>
              <div className="text-right">
                <div className="h-10 w-28 border-b border-slate-400 flex items-center justify-center overflow-hidden">
                  {teacherSigVal ? (
                    <img
                      src={teacherSigVal}
                      alt="Class Teacher Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] italic text-slate-400 font-serif">
                      Signed
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block mt-0.5">
                  Teacher&apos;s Signature
                </span>
              </div>
            </div>
          </div>

          {/* Principal's Comment & Signature */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div
                className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: primaryColor }}
              >
                <Award size={14} /> Principal&apos;s Endorsement & Comment
              </div>
              <p className="text-xs text-slate-700 font-medium italic leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80 min-h-[56px]">
                &ldquo;
                {principalCommentVal ||
                  'Result reviewed and approved. Keep striving for academic and moral excellence.'}
                &rdquo;
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-900">{principalNameVal}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Principal / Head of School
                </p>
              </div>
              <div className="text-right">
                <div className="h-10 w-28 border-b border-slate-400 flex items-center justify-center overflow-hidden">
                  {principalSigVal ? (
                    <img
                      src={principalSigVal}
                      alt="Principal Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] italic text-slate-400 font-serif">
                      Signed
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block mt-0.5">
                  Principal&apos;s Signature
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

