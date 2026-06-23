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
  AlertCircle
} from 'lucide-react'
import { apiSlice } from '@/lib/apiSlice'

interface StudentRow {
  studentId: number
  registerNo: string
  firstName: string
  lastName: string
  gender: string
  theoryMark: number | null
  objectiveMark: number
  absent: boolean
}

interface GradebookInterfaceProps {
  classId: number
  sectionId: number
  subjectId: number
  examId: number
  className: string
  sectionName: string
  subjectName: string
  examName: string
}

export default function GradebookInterface({
  classId,
  sectionId,
  subjectId,
  examId,
  className,
  sectionName,
  subjectName,
  examName
}: GradebookInterfaceProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sheetData, setSheetData] = useState<StudentRow[]>([])
  
  // Local edit states
  const [editedScores, setEditedScores] = useState<Record<number, { theoryMark: string; absent: boolean }>>({})
  const [savingRowId, setSavingRowId] = useState<number | null>(null)

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

  // Fetch sheet data
  const fetchGradebook = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; sheet: StudentRow[] }>(
        `/api/teacher/gradebook/sheet?classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}&examId=${examId}`
      )
      if (res.success) {
        setSheetData(res.sheet)
        // Initialize local edit states
        const initialEdits: Record<number, { theoryMark: string; absent: boolean }> = {}
        res.sheet.forEach((row) => {
          initialEdits[row.studentId] = {
            theoryMark: row.theoryMark !== null ? String(row.theoryMark) : '',
            absent: row.absent
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
    fetchGradebook()
  }, [classId, sectionId, subjectId, examId])

  // Grading Threshold Helper
  const calculateGrade = (score: number) => {
    if (score >= 70) return { label: 'A', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (score >= 60) return { label: 'B', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (score >= 50) return { label: 'C', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (score >= 40) return { label: 'D', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    return { label: 'F', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  }

  // Real-Time Calculations (Cumulative Total, Percentage, Ranks, Averages)
  const computedSheet = useMemo(() => {
    // 1. Calculate cumulative total scores for all students
    const totals = sheetData.map((row) => {
      const edit = editedScores[row.studentId] || { theoryMark: '', absent: false }
      const isAbsent = edit.absent
      const theory = isAbsent ? 0 : (Number(edit.theoryMark) || 0)
      const objective = row.objectiveMark || 0
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

  // Save single row
  const handleSaveSingle = async (row: StudentRow) => {
    const edit = editedScores[row.studentId] || { theoryMark: '', absent: false }
    setSavingRowId(row.studentId)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        '/api/teacher/gradebook/save-single',
        {
          classId,
          sectionId,
          subjectId,
          examId,
          studentId: row.studentId,
          theoryMark: edit.absent ? null : (edit.theoryMark === '' ? null : Number(edit.theoryMark)),
          absent: edit.absent
        }
      )
      if (res.success) {
        setSuccess(`Saved score for ${row.firstName} ${row.lastName} successfully!`)
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

  // Check if a row has unsaved changes
  const isRowUnsaved = (row: StudentRow) => {
    const edit = editedScores[row.studentId]
    if (!edit) return false
    const originalTheory = row.theoryMark !== null ? String(row.theoryMark) : ''
    return edit.theoryMark !== originalTheory || edit.absent !== row.absent
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
    link.setAttribute('download', `GradebookTemplate_${className}_${subjectName}_${examName}.csv`)
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
        '/api/teacher/gradebook/csv-upload',
        {
          classId,
          sectionId,
          subjectId,
          examId,
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
              Class: <span className="text-slate-600">{className} ({sectionName})</span> | Subject: <span className="text-slate-600">{subjectName}</span> | Exam: <span className="text-slate-600">{examName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCsvDownload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-xs transition"
            >
              <Download size={14} />
              Download CSV Template
            </button>
            <button
              onClick={() => {
                setParsedCsvRows([])
                setCsvFileContent('')
                setCsvError(null)
                setShowCsvModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
            >
              <Upload size={14} />
              Bulk Import CSV
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
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[10.5px] uppercase tracking-wider">
                  <th className="px-6 py-3.5">Reg No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5 w-32">Absent</th>
                  <th className="px-6 py-3.5 w-44">Objective Score (Online)</th>
                  <th className="px-6 py-3.5 w-44">Theory Mark (Manual)</th>
                  <th className="px-6 py-3.5 w-32">Cumulative</th>
                  <th className="px-6 py-3.5 w-24">Grade</th>
                  <th className="px-6 py-3.5 w-24">Rank</th>
                  <th className="px-6 py-3.5 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.map((row) => {
                  const edit = editedScores[row.studentId] || { theoryMark: '', absent: false }
                  const isAbsent = edit.absent
                  const theoryVal = isAbsent ? 0 : (Number(edit.theoryMark) || 0)
                  const objVal = row.objectiveMark || 0
                  const totalVal = isAbsent ? 0 : theoryVal + objVal
                  const gradeInfo = calculateGrade(totalVal)
                  const rank = computedSheet.rankMap[row.studentId]
                  const unsaved = isRowUnsaved(row)

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50/50 transition ${unsaved ? 'bg-amber-50/15' : ''}`}
                    >
                      {/* Reg No */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.registerNo || '-'}</td>
                      
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-extrabold text-slate-800">
                          {row.lastName}, {row.firstName}
                        </div>
                      </td>

                      {/* Absent checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={(e) => {
                            setEditedScores(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], absent: e.target.checked }
                            }))
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>

                      {/* Objective Score (Locked) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 font-extrabold text-xs w-full max-w-[130px] shadow-xs">
                          <Lock size={12} className="text-slate-400" />
                          <span>{objVal}</span>
                        </div>
                      </td>

                      {/* Theory Mark Input */}
                      <td className="px-6 py-4">
                        <div className="relative">
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
                            placeholder="Theory Score"
                            className={`w-full max-w-[140px] px-3 py-1.5 text-xs font-semibold bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 ${unsaved ? 'border-amber-300 focus:border-amber-400' : 'border-slate-200'}`}
                          />
                          {unsaved && (
                            <span className="absolute -right-2 top-1.5 h-2 w-2 bg-amber-400 rounded-full animate-pulse" title="Unsaved changes" />
                          )}
                        </div>
                      </td>

                      {/* Cumulative Total */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-800">{isAbsent ? 'ABS' : totalVal}</span>
                      </td>

                      {/* Grade Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 border text-[10px] font-black rounded-md ${isAbsent ? 'bg-slate-100 text-slate-400 border-slate-200' : gradeInfo.color}`}>
                          {isAbsent ? '-' : gradeInfo.label}
                        </span>
                      </td>

                      {/* Rank */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-extrabold text-slate-600">{rank}</span>
                      </td>

                      {/* Action save single */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSaveSingle(row)}
                          disabled={!unsaved || savingRowId === row.studentId}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 shadow-xs transition"
                          title="Save Row"
                        >
                          {savingRowId === row.studentId ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Sparkles size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 italic font-semibold">No students found in this class section.</p>
          </div>
        )}
      </div>

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
    </div>
  )
}
