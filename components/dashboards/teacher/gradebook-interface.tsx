'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Save,
  Lock,
  Check,
  Upload,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Award,
  Sparkles,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Search,
  RefreshCw,
  UserPlus
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { ScoreScannerModal } from './score-scanner-modal'
import { safeStorage } from '@/lib/safeStorage'

interface StudentRow {
  studentId: number
  registerNo: string
  firstName: string
  lastName: string
  gender?: string
  photo?: string | null
  className?: string
  sectionName?: string
  subjectId?: number
  subjectName?: string
  theoryMark: number | null
  objectiveMark: number
  absent: boolean
  grade?: string
  remark?: string
}

interface GradebookInterfaceProps {
  classId?: number
  sectionId?: number
  subjectId?: number
  examId?: number
  className?: string
  sectionName?: string
  subjectName?: string
  examName?: string
  profile?: any
}

export default function GradebookInterface({
  classId = 0,
  sectionId = 0,
  subjectId = 0,
  examId = 0,
  className = '',
  sectionName = '',
  subjectName = '',
  examName = '',
  profile
}: GradebookInterfaceProps = {}) {
  const [loading, setLoading] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sheetData, setSheetData] = useState<StudentRow[]>([])
  
  // Metadata state for selectors
  const [examsList, setExamsList] = useState<Array<{ id: number; name: string }>>([])
  const [classesList, setClassesList] = useState<Array<{ id: number; name: string; sections: Array<{ id: number; name: string }> }>>([])
  const [subjectsList, setSubjectsList] = useState<Array<{ id: number; name: string }>>([])

  const [curExamId, setCurExamId] = useState<number>(examId)
  const [curClassId, setCurClassId] = useState<number>(classId)
  const [curSectionId, setCurSectionId] = useState<number>(sectionId)
  const [curSubjectId, setCurSubjectId] = useState<number>(subjectId)

  // Fetch available metadata (Exams, Classes, Subjects)
  useEffect(() => {
    let active = true
    async function loadMetadata() {
      setLoadingMeta(true)
      try {
        const [examsRes, classesRes, subjectsRes] = await Promise.all([
          apiSlice.get<{ success: boolean; exams: any[] }>(endpoints.teacher.exams).catch(() => ({ success: false, exams: [] })),
          apiSlice.get<{ success: boolean; classes: any[] }>(endpoints.teacher.classesSections).catch(() => ({ success: false, classes: [] })),
          apiSlice.get<{ success: boolean; subjects: any[] }>(endpoints.teacher.subjects).catch(() => ({ success: false, subjects: [] })),
        ])

        if (!active) return

        let initialExam = curExamId
        let initialClass = curClassId
        let initialSection = curSectionId
        let initialSubject = curSubjectId

        if (examsRes.success && examsRes.exams?.length > 0) {
          setExamsList(examsRes.exams)
          if (!initialExam) {
            initialExam = examsRes.exams[0].id
            setCurExamId(initialExam)
          }
        }

        if (classesRes.success && classesRes.classes?.length > 0) {
          setClassesList(classesRes.classes)
          if (!initialClass) {
            initialClass = classesRes.classes[0].id
            setCurClassId(initialClass)
            if (classesRes.classes[0].sections?.length > 0 && !initialSection) {
              initialSection = classesRes.classes[0].sections[0].id
              setCurSectionId(initialSection)
            }
          }
        }

        if (subjectsRes.success && subjectsRes.subjects?.length > 0) {
          setSubjectsList(subjectsRes.subjects)
          if (!initialSubject) {
            initialSubject = subjectsRes.subjects[0].id
            setCurSubjectId(initialSubject)
          }
        }
      } catch (err) {
        console.error('Failed to load score entry filters:', err)
      } finally {
        if (active) setLoadingMeta(false)
      }
    }

    loadMetadata()
    return () => {
      active = false
    }
  }, [])

  // Check if current user is Admin
  const isAdmin = useMemo(() => {
    try {
      const userStr = safeStorage.getItem('ugbekun_user')
      if (userStr) {
        const u = JSON.parse(userStr)
        return u.role === 1 || u.role === 2
      }
    } catch (e) {}
    return false
  }, [])

  // Local edit states
  const [editedScores, setEditedScores] = useState<Record<number, { theoryMark: string; objectiveMark: string; absent: boolean }>>({})
  const [savingRowId, setSavingRowId] = useState<number | null>(null)
  const [savingAll, setSavingAll] = useState(false)

  // Direct Student Add & DB Generator states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'pool' | 'generate'>('pool')
  const [poolSearchQuery, setPoolSearchQuery] = useState('')
  const [poolStudents, setPoolStudents] = useState<Array<{
    studentId: number
    registerNo: string
    firstName: string
    lastName: string
    photo?: string | null
    className: string
    sectionName: string
  }>>([])
  const [loadingPool, setLoadingPool] = useState(false)
  const [generatingStudent, setGeneratingStudent] = useState(false)
  const [newStudentFirst, setNewStudentFirst] = useState('')
  const [newStudentLast, setNewStudentLast] = useState('')

  // CSV Modal state
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvFileContent, setCsvFileContent] = useState<string>('')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [parsedCsvRows, setParsedCsvRows] = useState<{
    registerNo: string
    theoryMark: string
    absent: boolean
    studentName: string
    status: 'valid' | 'invalid'
    errorMsg?: string
  }[]>([])
  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)

  // Fetch sheet data with defensive resolution
  const fetchGradebook = async () => {
    if (!curClassId || !curSectionId || !curExamId) {
      setSheetData([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{
        success: boolean;
        sheet?: StudentRow[];
        rows?: any[];
        subjects?: any[];
        meta?: any;
      }>(
        `${endpoints.teacher.gradebookSheet}?classId=${curClassId}&sectionId=${curSectionId}&subjectId=${curSubjectId}&examId=${curExamId}`
      )
      if (res.success) {
        let rowsToUse: StudentRow[] = []
        if (res.sheet && Array.isArray(res.sheet)) {
          rowsToUse = res.sheet
        } else if (res.rows && Array.isArray(res.rows)) {
          rowsToUse = res.rows.map((r: any) => {
            const subMark = r.marks?.[curSubjectId] || {}
            return {
              studentId: r.studentId,
              registerNo: r.registerNo || '',
              firstName: r.firstName,
              lastName: r.lastName,
              photo: r.photo,
              gender: '',
              className: activeClassName,
              sectionName: activeSectionName,
              subjectId: curSubjectId,
              subjectName: activeSubjectName,
              theoryMark: subMark.mark !== null && subMark.mark !== undefined && subMark.mark !== '' ? Number(subMark.mark) : null,
              objectiveMark: subMark.cbtMark !== null && subMark.cbtMark !== undefined && subMark.cbtMark !== '' ? Number(subMark.cbtMark) : 0,
              absent: subMark.absent === '1',
            }
          })
        }

        setSheetData(rowsToUse)
        // Initialize local edit states
        const initialEdits: Record<number, { theoryMark: string; objectiveMark: string; absent: boolean }> = {}
        rowsToUse.forEach((row) => {
          initialEdits[row.studentId] = {
            theoryMark: row.theoryMark !== null && row.theoryMark !== undefined ? String(row.theoryMark) : '',
            objectiveMark: row.objectiveMark !== null && row.objectiveMark !== undefined ? String(row.objectiveMark) : '0',
            absent: Boolean(row.absent)
          }
        })
        setEditedScores(initialEdits)
      } else {
        setError('Failed to load gradebook sheet.')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching gradebook data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (curClassId && curSectionId && curExamId) {
      fetchGradebook()
    }
  }, [curClassId, curSectionId, curSubjectId, curExamId])

  // Get active class sections
  const activeClassSections = useMemo(() => {
    const selected = classesList.find((c) => c.id === curClassId)
    return selected?.sections || []
  }, [classesList, curClassId])

  // Derived labels
  const activeExamName = useMemo(() => examsList.find((e) => e.id === curExamId)?.name || examName || 'Selected Exam', [examsList, curExamId, examName])
  const activeClassName = useMemo(() => classesList.find((c) => c.id === curClassId)?.name || className || 'Selected Class', [classesList, curClassId, className])
  const activeSectionName = useMemo(() => activeClassSections.find((s) => s.id === curSectionId)?.name || sectionName || 'Section', [activeClassSections, curSectionId, sectionName])
  const activeSubjectName = useMemo(() => subjectsList.find((s) => s.id === curSubjectId)?.name || subjectName || 'Subject', [subjectsList, curSubjectId, subjectName])

  // Grading Threshold Helper
  const calculateGrade = (score: number) => {
    if (score >= 70) return { label: 'A', remark: 'Distinction', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (score >= 60) return { label: 'B', remark: 'Very Good', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (score >= 50) return { label: 'C', remark: 'Credit', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (score >= 40) return { label: 'D', remark: 'Pass', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    return { label: 'F', remark: 'Fail', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  }

  // Real-Time Calculations (Cumulative Total, Percentage, Ranks, Averages)
  const computedSheet = useMemo(() => {
    // 1. Calculate cumulative total scores for all students
    const totals = sheetData.map((row) => {
      const edit = editedScores[row.studentId] || { theoryMark: '', objectiveMark: '0', absent: false }
      const isAbsent = edit.absent
      const theory = isAbsent ? 0 : (Number(edit.theoryMark) || 0)
      const objective = isAbsent ? 0 : (Number(edit.objectiveMark) || 0)
      const cumulative = isAbsent ? 0 : theory + objective
      return {
        studentId: row.studentId,
        cumulative,
        isAbsent
      }
    })

    // 2. Compute rankings based on cumulative total score (dense ranking)
    const activeTotals = totals.filter(t => !t.isAbsent).map(t => t.cumulative)
    const uniqueSortedTotals = Array.from(new Set(activeTotals)).sort((a, b) => b - a)

    const rankMap: Record<number, string> = {}
    totals.forEach((t) => {
      if (t.isAbsent) {
        rankMap[t.studentId] = '-'
      } else {
        const idx = uniqueSortedTotals.indexOf(t.cumulative)
        const rank = idx + 1
        // Form suffix
        const suffix = ['th', 'st', 'nd', 'rd'][(rank % 100 > 10 && rank % 100 < 14) ? 0 : Math.min(rank % 10, 3)]
        rankMap[t.studentId] = `${rank}${suffix}`
      }
    })

    // 3. Compute stats
    const nonAbsentTotals = totals.filter(t => !t.isAbsent).map(t => t.cumulative)
    const classAvg = nonAbsentTotals.length > 0
      ? Number((nonAbsentTotals.reduce((a, b) => a + b, 0) / nonAbsentTotals.length).toFixed(1))
      : 0
    const highestScore = nonAbsentTotals.length > 0 ? Math.max(...nonAbsentTotals) : 0
    const passCount = nonAbsentTotals.filter(score => score >= 40).length
    const passRate = nonAbsentTotals.length > 0
      ? Number(((passCount / nonAbsentTotals.length) * 100).toFixed(1))
      : 0

    // Grade Distribution
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    nonAbsentTotals.forEach((total) => {
      const grade = calculateGrade(total).label
      if (grade in distribution) {
        distribution[grade as keyof typeof distribution]++
      }
    })

    return {
      rankMap,
      classAvg,
      highestScore,
      passRate,
      distribution
    }
  }, [sheetData, editedScores])

  // Check if a row has unsaved changes
  const isRowUnsaved = (row: StudentRow) => {
    const edit = editedScores[row.studentId]
    if (!edit) return false
    const originalTheory = row.theoryMark !== null && row.theoryMark !== undefined ? String(row.theoryMark) : ''
    const originalObjective = row.objectiveMark !== null && row.objectiveMark !== undefined ? String(row.objectiveMark) : '0'
    return edit.theoryMark !== originalTheory || edit.objectiveMark !== originalObjective || Boolean(edit.absent) !== Boolean(row.absent)
  }

  // Count of unsaved rows
  const unsavedCount = useMemo(() => {
    return sheetData.filter((row) => isRowUnsaved(row)).length
  }, [sheetData, editedScores])

  // Save single row
  const handleSaveSingle = async (row: StudentRow) => {
    const edit = editedScores[row.studentId] || { theoryMark: '', objectiveMark: '0', absent: false }
    setSavingRowId(row.studentId)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string; mark?: any }>(
        endpoints.teacher.gradebookSaveSingle,
        {
          classId: curClassId,
          sectionId: curSectionId,
          subjectId: curSubjectId,
          examId: curExamId,
          studentId: row.studentId,
          theoryMark: edit.absent ? null : (edit.theoryMark === '' ? null : Number(edit.theoryMark)),
          objectiveMark: edit.absent ? null : (edit.objectiveMark === '' ? null : Number(edit.objectiveMark)),
          absent: edit.absent
        }
      )
      if (res.success) {
        setSuccess(`Saved score for ${row.firstName} ${row.lastName} successfully!`)
        setSheetData((prev) =>
          prev.map((r) =>
            r.studentId === row.studentId
              ? {
                  ...r,
                  theoryMark: edit.absent ? null : (edit.theoryMark === '' ? null : Number(edit.theoryMark)),
                  objectiveMark: edit.absent ? 0 : (edit.objectiveMark === '' ? 0 : Number(edit.objectiveMark)),
                  absent: edit.absent,
                }
              : r
          )
        )
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(`Failed to save score: ${res.message}`)
      }
    } catch (err: any) {
      setError(err.message || 'Error saving score.')
    } finally {
      setSavingRowId(null)
    }
  }

  // Batch Save all changes
  const handleBatchSave = async () => {
    if (!curClassId || !curSectionId || !curSubjectId || !curExamId) return
    setSavingAll(true)
    setError(null)
    setSuccess(null)
    try {
      const scoresPayload = sheetData.map((row) => {
        const edit = editedScores[row.studentId] || { theoryMark: '', objectiveMark: '0', absent: false }
        return {
          studentId: row.studentId,
          theoryMark: edit.absent ? null : (edit.theoryMark === '' ? null : Number(edit.theoryMark)),
          objectiveMark: edit.absent ? null : (edit.objectiveMark === '' ? null : Number(edit.objectiveMark)),
          absent: edit.absent,
        }
      })

      const res = await apiSlice.post<{ success: boolean; message: string; count?: number }>(
        endpoints.teacher.gradebookBatchSave,
        {
          classId: curClassId,
          sectionId: curSectionId,
          subjectId: curSubjectId,
          examId: curExamId,
          scores: scoresPayload,
        }
      )

      if (res.success) {
        setSuccess(res.message || `Successfully saved all ${scoresPayload.length} scores!`)
        setSheetData((prev) =>
          prev.map((row) => {
            const edit = editedScores[row.studentId]
            if (!edit) return row
            return {
              ...row,
              theoryMark: edit.absent ? null : (edit.theoryMark === '' ? null : Number(edit.theoryMark)),
              objectiveMark: edit.absent ? 0 : (edit.objectiveMark === '' ? 0 : Number(edit.objectiveMark)),
              absent: edit.absent,
            }
          })
        )
        setTimeout(() => setSuccess(null), 3500)
      } else {
        setError(res.message || 'Failed to batch save scores.')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving all scores.')
    } finally {
      setSavingAll(false)
    }
  }

  // Fetch students from database registry
  const fetchStudentPool = async (query = '') => {
    setLoadingPool(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (curClassId) params.set('classId', String(curClassId))
      const res = await apiSlice.get<{ success: boolean; students: any[] }>(
        endpoints.teacher.studentPool(params.toString())
      )
      if (res.success) {
        setPoolStudents(res.students || [])
      }
    } catch (err) {
      console.error('Failed to load student pool:', err)
    } finally {
      setLoadingPool(false)
    }
  }

  // Load pool when modal is opened
  useEffect(() => {
    if (showAddStudentModal) {
      fetchStudentPool(poolSearchQuery)
    }
  }, [showAddStudentModal, curClassId])

  // Add an existing student from database registry to score sheet
  const handleAddFromPool = (student: {
    studentId: number
    registerNo: string
    firstName: string
    lastName: string
    photo?: string | null
    className?: string
    sectionName?: string
  }) => {
    if (sheetData.some((s) => s.studentId === student.studentId)) {
      setError(`Student ${student.firstName} ${student.lastName} (${student.registerNo}) is already on this score sheet.`)
      setTimeout(() => setError(null), 3000)
      return
    }

    const newRow: StudentRow = {
      studentId: student.studentId,
      registerNo: student.registerNo,
      firstName: student.firstName,
      lastName: student.lastName,
      photo: student.photo || null,
      gender: '',
      className: activeClassName,
      sectionName: activeSectionName,
      subjectId: curSubjectId,
      subjectName: activeSubjectName,
      theoryMark: null,
      objectiveMark: 0,
      absent: false,
    }

    setSheetData((prev) => [...prev, newRow])
    setEditedScores((prev) => ({
      ...prev,
      [student.studentId]: { theoryMark: '', objectiveMark: '0', absent: false },
    }))

    setShowAddStudentModal(false)
    setSuccess(`Added ${student.firstName} ${student.lastName} (${student.registerNo}) from database.`)
    setTimeout(() => setSuccess(null), 3500)
  }

  // Auto-generate student in database with official Registration Number
  const handleAutoGenerateStudent = async () => {
    if (!curClassId || !curSectionId) return
    setGeneratingStudent(true)
    setError(null)
    try {
      const res = await apiSlice.post<{ success: boolean; student: any; message: string }>(
        endpoints.teacher.autoGenerateStudent,
        {
          classId: curClassId,
          sectionId: curSectionId,
          firstName: newStudentFirst.trim() || undefined,
          lastName: newStudentLast.trim() || undefined,
        }
      )

      if (res.success && res.student) {
        const newRow: StudentRow = {
          studentId: res.student.studentId,
          registerNo: res.student.registerNo,
          firstName: res.student.firstName,
          lastName: res.student.lastName,
          gender: '',
          className: activeClassName,
          sectionName: activeSectionName,
          subjectId: curSubjectId,
          subjectName: activeSubjectName,
          theoryMark: null,
          objectiveMark: 0,
          absent: false,
        }

        setSheetData((prev) => [...prev, newRow])
        setEditedScores((prev) => ({
          ...prev,
          [res.student.studentId]: { theoryMark: '', objectiveMark: '0', absent: false },
        }))

        setNewStudentFirst('')
        setNewStudentLast('')
        setShowAddStudentModal(false)
        setSuccess(res.message || `Generated ${res.student.firstName} (${res.student.registerNo}) in database!`)
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(res.message || 'Failed to auto-generate student in database.')
      }
    } catch (err: any) {
      setError(err.message || 'Error auto-generating student.')
    } finally {
      setGeneratingStudent(false)
    }
  }

  // CSV Processing
  const handleCsvDownload = () => {
    // Generate CSV template pre-populated with student roster
    const headers = 'Registration Number,Student Name,Theory Mark (0-100),Absent (Y/N)\n'
    const rows = sheetData.map(
      (row) => `"${row.registerNo || ''}","${row.lastName}, ${row.firstName}","${row.theoryMark !== null ? row.theoryMark : ''}","${row.absent ? 'Y' : 'N'}"`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GradebookTemplate_${activeClassName}_${activeSubjectName}_${activeExamName}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCsvUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setCsvFileContent(text)
      processCsvContent(text)
    }
    reader.readAsText(file)
  }

  const processCsvContent = (text: string) => {
    setCsvError(null)
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length <= 1) {
      setCsvError('The CSV file is empty or missing content.')
      return
    }

    const rosterMap = new Map(
      sheetData.map(row => [String(row.registerNo || '').trim().toLowerCase(), row])
    )

    const parsed: typeof parsedCsvRows = []
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      // Split ignoring commas inside quotes
      const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      if (columns.length < 3) continue

      const rawReg = columns[0].replace(/"/g, '').trim()
      const rawName = columns[1].replace(/"/g, '').trim()
      const rawMark = columns[2].replace(/"/g, '').trim()
      const rawAbsent = columns[3] ? columns[3].replace(/"/g, '').trim().toUpperCase() : 'N'

      const matchedStudent = rosterMap.get(rawReg.toLowerCase())
      
      let status: 'valid' | 'invalid' = 'valid'
      let errorMsg = ''

      if (!matchedStudent) {
        status = 'invalid'
        errorMsg = 'Student registration number not found in this class section.'
      } else if (rawAbsent !== 'Y' && rawAbsent !== 'N') {
        status = 'invalid'
        errorMsg = 'Absent column must be Y or N.'
      } else if (rawAbsent === 'N' && rawMark !== '' && (isNaN(Number(rawMark)) || Number(rawMark) < 0 || Number(rawMark) > 100)) {
        status = 'invalid'
        errorMsg = 'Theory score must be a number between 0 and 100.'
      }

      parsed.push({
        registerNo: rawReg,
        theoryMark: rawMark,
        absent: rawAbsent === 'Y',
        studentName: matchedStudent ? `${matchedStudent.lastName}, ${matchedStudent.firstName}` : rawName,
        status,
        errorMsg
      })
    }

    setParsedCsvRows(parsed)
  }

  const handleConfirmCsvUpload = async () => {
    const invalidRows = parsedCsvRows.filter(r => r.status === 'invalid')
    if (invalidRows.length > 0) {
      setCsvError(`Please fix the ${invalidRows.length} errors in the CSV preview before uploading.`)
      return
    }

    setUploadingCsv(true)
    setCsvError(null)

    try {
      const payloadScores = parsedCsvRows.map(r => ({
        registerNo: r.registerNo,
        theoryMark: r.absent ? null : (r.theoryMark === '' ? null : Number(r.theoryMark)),
        absent: r.absent
      }))

      const res = await apiSlice.post<{ success: boolean; results: any }>(
        endpoints.teacher.gradebookCsvUpload,
        {
          classId: curClassId,
          sectionId: curSectionId,
          subjectId: curSubjectId,
          examId: curExamId,
          scores: payloadScores
        }
      )

      if (res.success) {
        setShowCsvModal(false)
        setSuccess(`Bulk imported ${res.results.updated} scores successfully!`)
        fetchGradebook()
      } else {
        setCsvError('Failed to import CSV scores.')
      }
    } catch (err: any) {
      setCsvError(err.message || 'Error uploading CSV.')
    } finally {
      setUploadingCsv(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Academic Selection Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Teacher Scores Entry & Gradebook
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select examination term, class, section, and subject to record or sync student marks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
              {sheetData.length} Students in Register
            </span>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Exam Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Examination / Assessment
            </label>
            <select
              value={curExamId || ''}
              onChange={(e) => setCurExamId(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs"
            >
              {examsList.length === 0 && <option value="">Loading Exams...</option>}
              {examsList.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Class Grade
            </label>
            <select
              value={curClassId || ''}
              onChange={(e) => {
                const newClassId = Number(e.target.value)
                setCurClassId(newClassId)
                const cls = classesList.find((c) => c.id === newClassId)
                if (cls && cls.sections && cls.sections.length > 0) {
                  setCurSectionId(cls.sections[0].id)
                }
              }}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs"
            >
              {classesList.length === 0 && <option value="">Loading Classes...</option>}
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Arm / Section
            </label>
            <select
              value={curSectionId || ''}
              onChange={(e) => setCurSectionId(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs"
            >
              {activeClassSections.length === 0 && <option value="">Main</option>}
              {activeClassSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Subject
            </label>
            <select
              value={curSubjectId || ''}
              onChange={(e) => setCurSubjectId(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs"
            >
              {subjectsList.length === 0 && <option value="">Loading Subjects...</option>}
              {subjectsList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Class Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">Class Average</span>
            <h4 className="text-3xl font-black text-slate-800 mt-1">{computedSheet.classAvg}</h4>
          </div>
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border border-blue-200/50 text-blue-600 shadow-sm">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-500">Highest Cumulative</span>
            <h4 className="text-3xl font-black text-slate-800 mt-1">{computedSheet.highestScore}</h4>
          </div>
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border border-purple-200/50 text-purple-600 shadow-sm">
            <Award size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-teal-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Pass Rate (≥ 40)</span>
            <h4 className="text-3xl font-black text-slate-800 mt-1">{computedSheet.passRate}%</h4>
          </div>
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border border-emerald-200/50 text-emerald-600 shadow-sm">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Grade Distribution</span>
          <div className="flex gap-2.5 mt-2.5">
            {Object.entries(computedSheet.distribution).map(([grade, count]) => (
              <div key={grade} className="flex-1 text-center bg-white border border-slate-200/70 rounded-lg py-1 shadow-xs">
                <div className="text-[11px] font-black text-slate-600">{grade}</div>
                <div className="text-xs font-bold text-slate-400 mt-0.5">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Spreadsheet Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-blue-600" />
              Unified Grade sheet
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Class: <span className="text-slate-600">{activeClassName} ({activeSectionName})</span> | Subject: <span className="text-slate-600">{activeSubjectName}</span> | Exam: <span className="text-slate-600">{activeExamName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Student Entry Button */}
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-2xs transition"
            >
              <UserCheck size={14} className="text-blue-600" />
              + Add Student to Sheet
            </button>

            {/* Batch Save Button */}
            <button
              onClick={handleBatchSave}
              disabled={unsavedCount === 0 || savingAll}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition ${
                unsavedCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title={unsavedCount > 0 ? `Save ${unsavedCount} pending score changes` : 'No unsaved changes'}
            >
              {savingAll ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              ) : (
                <Save size={14} />
              )}
              <span>{savingAll ? 'Saving All...' : unsavedCount > 0 ? `Save All (${unsavedCount})` : 'All Saved'}</span>
            </button>

            <button
              onClick={handleCsvDownload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-2xs transition"
            >
              <Download size={14} />
              CSV Template
            </button>
            <button
              onClick={() => {
                setParsedCsvRows([])
                setCsvFileContent('')
                setCsvError(null)
                setShowCsvModal(true)
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
            >
              <Upload size={14} />
              Bulk Import CSV
            </button>
            <button
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs transition"
            >
              <Sparkles size={14} />
              Scan Score Sheet (AI)
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="m-6 mb-0 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Spreadsheet Matrix Table */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" />
            <p className="text-sm font-bold text-slate-400 mt-3">Loading spreadsheet matrix...</p>
          </div>
        ) : sheetData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[10.5px] uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  <th className="px-4 py-3.5 w-32">Reg No</th>
                  <th className="px-5 py-3.5 min-w-[180px]">Student Name</th>
                  <th className="px-4 py-3.5 min-w-[140px]">Class / Arm</th>
                  <th className="px-4 py-3.5 min-w-[140px]">Subject</th>
                  <th className="px-4 py-3.5 w-28 text-center">Attendance</th>
                  <th className="px-4 py-3.5 w-36 text-center">Objective (CBT)</th>
                  <th className="px-4 py-3.5 w-36 text-center">Theory Mark</th>
                  <th className="px-4 py-3.5 w-28 text-center">Cumulative</th>
                  <th className="px-4 py-3.5 w-20 text-center">Grade</th>
                  <th className="px-4 py-3.5 w-24 text-center">Remark</th>
                  <th className="px-4 py-3.5 w-20 text-center">Rank</th>
                  <th className="px-4 py-3.5 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.map((row, idx) => {
                  const edit = editedScores[row.studentId] || { theoryMark: '', objectiveMark: '0', absent: false }
                  const isAbsent = edit.absent
                  const theoryVal = isAbsent ? 0 : (Number(edit.theoryMark) || 0)
                  const objVal = isAbsent ? 0 : (Number(edit.objectiveMark) || 0)
                  const totalVal = isAbsent ? 0 : theoryVal + objVal
                  const gradeInfo = calculateGrade(totalVal)
                  const rank = computedSheet.rankMap[row.studentId]
                  const unsaved = isRowUnsaved(row)

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50/60 transition ${unsaved ? 'bg-amber-50/25' : ''}`}
                    >
                      {/* S/N */}
                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Reg No */}
                      <td className="px-4 py-4 text-xs font-bold text-slate-500 font-mono">
                        {row.registerNo || '-'}
                      </td>
                      
                      {/* Student Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs border border-blue-200/50">
                            {row.firstName?.[0] || 'S'}{row.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-800">
                              {row.lastName}, {row.firstName}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-semibold">{row.registerNo || 'Unassigned'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Class Grade & Arm */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
                          <span>{activeClassName}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-blue-600">{activeSectionName}</span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/70">
                          <span className="truncate max-w-[120px]" title={activeSubjectName}>{activeSubjectName}</span>
                        </div>
                      </td>

                      {/* Absent checkbox */}
                      <td className="px-4 py-4 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAbsent}
                            onChange={(e) => {
                              setEditedScores(prev => ({
                                ...prev,
                                [row.studentId]: { ...prev[row.studentId], absent: e.target.checked }
                              }))
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                          />
                          <span className={`text-[11px] font-bold ${isAbsent ? 'text-rose-600' : 'text-slate-400'}`}>
                            {isAbsent ? 'ABS' : 'Present'}
                          </span>
                        </label>
                      </td>

                      {/* Objective Score (Editable for Admin) */}
                      <td className="px-4 py-4 text-center">
                        {isAdmin ? (
                          <div className="relative inline-block">
                            <input
                              type="number"
                              disabled={isAbsent}
                              min={0}
                              max={100}
                              value={isAbsent ? '' : edit.objectiveMark}
                              onChange={(e) => {
                                setEditedScores(prev => ({
                                  ...prev,
                                  [row.studentId]: { ...prev[row.studentId], objectiveMark: e.target.value }
                                }))
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveSingle(row)
                                }
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-1.5 text-center text-xs font-semibold bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 border-slate-200"
                            />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-extrabold text-xs w-24 shadow-2xs">
                            <Lock size={12} className="text-slate-400" />
                            <span>{edit.objectiveMark || '0'}</span>
                          </div>
                        )}
                      </td>

                      {/* Theory Mark Input */}
                      <td className="px-4 py-4 text-center">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            disabled={isAbsent}
                            min={0}
                            max={100}
                            value={isAbsent ? '' : edit.theoryMark}
                            onChange={(e) => {
                              setEditedScores(prev => ({
                                ...prev,
                                [row.studentId]: { ...prev[row.studentId], theoryMark: e.target.value }
                              }))
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveSingle(row)
                              }
                            }}
                            placeholder="Enter mark"
                            className={`w-28 px-3 py-1.5 text-center text-xs font-semibold bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 transition ${unsaved ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'}`}
                          />
                          {unsaved && (
                            <span className="absolute -right-2 top-2 h-2 w-2 bg-amber-400 rounded-full animate-ping" title="Unsaved changes" />
                          )}
                        </div>
                      </td>

                      {/* Cumulative Total */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-baseline gap-1">
                          <span className={`text-base font-black ${isAbsent ? 'text-rose-500 font-bold text-xs' : 'text-slate-900'}`}>
                            {isAbsent ? 'ABS' : totalVal}
                          </span>
                          {!isAbsent && <span className="text-[10px] text-slate-400 font-bold">/100</span>}
                        </div>
                      </td>

                      {/* Grade Badge */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 border text-xs font-black rounded-lg ${isAbsent ? 'bg-slate-100 text-slate-400 border-slate-200' : gradeInfo.color}`}>
                          {isAbsent ? '-' : gradeInfo.label}
                        </span>
                      </td>

                      {/* Remark */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-bold ${isAbsent ? 'text-slate-400' : gradeInfo.label === 'F' ? 'text-rose-600' : 'text-slate-700'}`}>
                          {isAbsent ? 'Absent' : gradeInfo.remark}
                        </span>
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-extrabold text-slate-600">{rank}</span>
                      </td>

                      {/* Action save single */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleSaveSingle(row)}
                          disabled={!unsaved || savingRowId === row.studentId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200"
                          title="Save Row"
                        >
                          {savingRowId === row.studentId ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                          ) : (
                            <Check size={14} />
                          )}
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <FileSpreadsheet size={30} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">No student enrollment records in this arm</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No students are currently enrolled in {activeClassName} ({activeSectionName}) for this session. You can quickly add students directly to this score sheet to begin entering marks, or use Bulk Import CSV.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
              >
                <UserCheck size={15} />
                + Add Student Row Manually
              </button>
              <button
                onClick={() => {
                  setParsedCsvRows([])
                  setCsvFileContent('')
                  setCsvError(null)
                  setShowCsvModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                <Upload size={15} />
                Bulk Import CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Student from Database Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-blue-600" size={20} />
                  Add Student from Database
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Class: <span className="text-slate-700 font-bold">{activeClassName} ({activeSectionName})</span>
                </p>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Mode Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/75 p-1.5 gap-1.5 mx-6 mt-4 rounded-xl">
              <button
                onClick={() => setActiveModalTab('pool')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeModalTab === 'pool'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Select from Database Registry
              </button>
              <button
                onClick={() => setActiveModalTab('generate')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeModalTab === 'generate'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Auto-Generate Student in DB
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeModalTab === 'pool' ? (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name or registration number in database..."
                      value={poolSearchQuery}
                      onChange={(e) => {
                        setPoolSearchQuery(e.target.value)
                        fetchStudentPool(e.target.value)
                      }}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Pool List */}
                  {loadingPool ? (
                    <div className="py-12 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent" />
                      <p className="text-xs text-slate-400 font-bold mt-2">Searching database registry...</p>
                    </div>
                  ) : poolStudents.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {poolStudents.map((s) => {
                        const isAlreadyAdded = sheetData.some((row) => row.studentId === s.studentId)
                        return (
                          <div
                            key={s.studentId}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                              isAlreadyAdded
                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 border border-blue-100">
                                {s.firstName?.[0] || 'S'}{s.lastName?.[0] || ''}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-800 truncate">
                                  {s.lastName}, {s.firstName}
                                </div>
                                <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-semibold mt-0.5">
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{s.registerNo}</span>
                                  <span>•</span>
                                  <span>{s.className}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddFromPool(s)}
                              disabled={isAlreadyAdded}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                                isAlreadyAdded
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200'
                              }`}
                            >
                              {isAlreadyAdded ? 'Added' : '+ Add to Sheet'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400">
                      <UserPlus size={28} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No matching students found in database</p>
                      <p className="text-[11px] text-slate-400 mt-1">Switch to "Auto-Generate Student in DB" to create one automatically.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                      The database will automatically generate the official student registration number matching your school's official prefix (set up during registration), establish their profile, and enroll them into <span className="font-bold">{activeClassName} ({activeSectionName})</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">First Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate"
                        value={newStudentFirst}
                        onChange={(e) => setNewStudentFirst(e.target.value)}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Last Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate"
                        value={newStudentLast}
                        onChange={(e) => setNewStudentLast(e.target.value)}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoGenerateStudent}
                    disabled={generatingStudent}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition"
                  >
                    {generatingStudent ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        Generating Student in Database...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Auto-Generate Student Record in Database
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">
                Auto-syncs with database student & enrollment tables
              </span>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Bulk Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" size={20} />
                Bulk Score Ingestion
              </h3>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {csvError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle size={16} />
                  {csvError}
                </div>
              )}

              {/* Upload Drag & Drop */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 rounded-2xl p-6 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUploadChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-700">Drag & drop your CSV file here, or click to browse</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Accepts UTF-8 encoded files with standard columns</p>
              </div>

              {/* CSV Parsing Preview Table */}
              {parsedCsvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">CSV Matrix Preview ({parsedCsvRows.length} rows parsed)</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${parsedCsvRows.filter(r => r.status === 'invalid').length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {parsedCsvRows.filter(r => r.status === 'invalid').length} Errors Detected
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-4 py-2">Reg No</th>
                          <th className="px-4 py-2">Student Name</th>
                          <th className="px-4 py-2">Theory Mark</th>
                          <th className="px-4 py-2">Absent</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {parsedCsvRows.map((r, idx) => (
                          <tr key={idx} className={r.status === 'invalid' ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                            <td className="px-4 py-2 text-slate-500 font-bold">{r.registerNo}</td>
                            <td className="px-4 py-2 text-slate-700">{r.studentName}</td>
                            <td className="px-4 py-2 text-slate-600">{r.absent ? '-' : r.theoryMark}</td>
                            <td className="px-4 py-2 text-slate-500">{r.absent ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-2">
                              {r.status === 'valid' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                  <Check size={12} /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600" title={r.errorMsg}>
                                  <AlertTriangle size={12} /> Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCsvUpload}
                disabled={parsedCsvRows.length === 0 || parsedCsvRows.some(r => r.status === 'invalid') || uploadingCsv}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition"
              >
                {uploadingCsv ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirm & Ingest
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ScoreScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onCommitSuccess={() => {
          fetchGradebook()
          setSuccess('Scores from scanned sheet committed successfully!')
        }}
        classId={curClassId}
        sectionId={curSectionId}
        examId={curExamId}
        subjectId={curSubjectId}
        students={sheetData.map(s => ({
          id: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          registerNo: s.registerNo
        }))}
      />
    </div>
  )
}
