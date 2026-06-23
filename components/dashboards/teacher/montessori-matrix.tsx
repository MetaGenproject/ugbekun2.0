'use client'

import React, { useState, useEffect } from 'react'
import {
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
  User,
  Check,
  Edit2
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface StudentRecord {
  studentId: number
  registerNo: string
  firstName: string
  lastName: string
  gender: string
  writingMastery: string
  drawingCapability: string
  physicalCoordination: string
  motorSkillProgression: string
  generalPunctuality: string
  peerRespect: string
  aestheticNeatness: string
  activeGroupParticipation: string
  narrativeComment: string
}

interface MontessoriMatrixProps {
  classId: number
  sectionId: number
  examId: number
  className: string
  sectionName: string
  examName: string
}

const RUBRIC_LEVELS = [
  { code: 'EM', label: 'Emerging', desc: 'Starting to demonstrate skill' },
  { code: 'DV', label: 'Developing', desc: 'Demonstrates occasionally' },
  { code: 'AC', label: 'Achieved', desc: 'Performs consistently' },
  { code: 'MS', label: 'Mastered', desc: 'Internalized & models for peers' }
]

const PSYCHOMOTOR_FIELDS = [
  { key: 'writingMastery', label: 'Writing Mastery' },
  { key: 'drawingCapability', label: 'Drawing Capability' },
  { key: 'physicalCoordination', label: 'Physical Coordination' },
  { key: 'motorSkillProgression', label: 'Motor Skill Progression' }
] as const

const BEHAVIORAL_FIELDS = [
  { key: 'generalPunctuality', label: 'General Punctuality' },
  { key: 'peerRespect', label: 'Peer Respect' },
  { key: 'aestheticNeatness', label: 'Aesthetic Neatness' },
  { key: 'activeGroupParticipation', label: 'Active Group Participation' }
] as const

export default function MontessoriMatrix({
  classId,
  sectionId,
  examId,
  className,
  sectionName,
  examName
}: MontessoriMatrixProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  
  // Track selected student index
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  
  // Track local edits per student
  const [edits, setEdits] = useState<Record<number, Partial<StudentRecord>>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    async function loadSheet() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiSlice.get<{ success: boolean; sheet: StudentRecord[] }>(
          endpoints.teacher.montessoriSheet(classId, sectionId, examId)
        )
        if (res.success) {
          setStudents(res.sheet)
          setSelectedIdx(0)
          
          // Populate initial edits
          const initialEdits: Record<number, Partial<StudentRecord>> = {}
          res.sheet.forEach(s => {
            initialEdits[s.studentId] = { ...s }
          })
          setEdits(initialEdits)
        } else {
          setError('Failed to fetch Montessori assessment sheet.')
        }
      } catch (err: any) {
        setError(err.message || 'Error compiling developmental progress matrix.')
      } finally {
        setLoading(false)
      }
    }

    loadSheet()
  }, [classId, sectionId, examId])

  const activeStudent = students[selectedIdx]
  const activeEdits = activeStudent ? edits[activeStudent.studentId] : null

  const handleUpdateField = (key: keyof StudentRecord, value: string) => {
    if (!activeStudent) return
    
    setEdits(prev => ({
      ...prev,
      [activeStudent.studentId]: {
        ...prev[activeStudent.studentId],
        [key]: value
      }
    }))
  }

  const handleSaveActive = async () => {
    if (!activeStudent || !activeEdits) return
    setSavingId(activeStudent.studentId)
    setError(null)
    setSuccess(null)

    // Validate comment length
    const comment = activeEdits.narrativeComment || ''
    if (comment.length > 500) {
      setError('Comments must be 500 characters or less.')
      setSavingId(null)
      return
    }

    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.teacher.saveMontessoriSingle,
        {
          classId,
          sectionId,
          examId,
          studentId: activeStudent.studentId,
          ...activeEdits
        }
      )

      if (res.success) {
        setSuccess(`Developmental progress saved for ${activeStudent.lastName}`)
        
        // Sync back into main students array
        setStudents(prev => prev.map((s, idx) => {
          if (idx === selectedIdx) {
            return { ...s, ...activeEdits } as StudentRecord
          }
          return s
        }))

        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(res.message || 'Failed to preserve narrative ratings.')
      }
    } catch (err: any) {
      setError(err.message || 'Server error saving qualitative assessments.')
    } finally {
      setSavingId(null)
    }
  }

  // Helper to determine record completion status
  const getCompletionStatus = (sId: number) => {
    const rec = edits[sId]
    if (!rec) return 'empty'

    const metrics = [
      rec.writingMastery, rec.drawingCapability, rec.physicalCoordination, rec.motorSkillProgression,
      rec.generalPunctuality, rec.peerRespect, rec.aestheticNeatness, rec.activeGroupParticipation
    ]
    const filledCount = metrics.filter(m => m && m !== '').length
    const hasComment = rec.narrativeComment && rec.narrativeComment.trim() !== ''

    if (filledCount === 8 && hasComment) return 'complete'
    if (filledCount > 0 || hasComment) return 'partial'
    return 'empty'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500 font-semibold text-sm">Compiling Montessori progress matrix...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Matrix Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
        <div>
          <h4 className="text-base font-extrabold text-emerald-900 flex items-center gap-2">
            <Sparkles className="text-emerald-600" size={18} />
            Qualitative Montessori Matrix Workspace
          </h4>
          <p className="text-xs font-semibold text-emerald-700/80 mt-1">
            ECD Class: <span className="font-extrabold">{className}</span> | Section: <span className="font-extrabold">{sectionName}</span> | Period: <span className="font-extrabold">{examName}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-3xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Complete Card
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-3xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-3xs">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Unassessed
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <AlertCircle className="text-rose-600 shrink-0" size={18} />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <CheckCircle className="text-emerald-600 shrink-0" size={18} />
          <span className="text-xs font-semibold">{success}</span>
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-200">
          <User className="mx-auto text-slate-300 mb-3" size={32} />
          <p className="text-slate-400 font-semibold text-sm">No students enrolled in this early childhood section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Student Roster Roster */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800">ECD Class Roster</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full">{students.length} Pupils</span>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {students.map((student, idx) => {
                const status = getCompletionStatus(student.studentId)
                const isSelected = idx === selectedIdx
                
                return (
                  <button
                    key={student.studentId}
                    onClick={() => {
                      setSelectedIdx(idx)
                      setError(null)
                      setSuccess(null)
                    }}
                    className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition hover:bg-slate-50/80 ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`text-xs font-black transition ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {student.lastName}, {student.firstName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">Reg: {student.registerNo}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'complete' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="Assessment complete" />}
                      {status === 'partial' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" title="Partially completed" />}
                      {status === 'empty' && <span className="w-2.5 h-2.5 rounded-full bg-slate-200" title="Not assessed" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Work Card Details */}
          {activeStudent && activeEdits && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                      Active Student profile
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {activeStudent.lastName}, {activeStudent.firstName}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                      <span>Register No: <span className="text-slate-700 font-extrabold">{activeStudent.registerNo}</span></span>
                      <span>Gender: <span className="text-slate-700 font-extrabold">{activeStudent.gender}</span></span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveActive}
                    disabled={savingId === activeStudent.studentId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-lg shadow-sm transition"
                  >
                    {savingId === activeStudent.studentId ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Rubric Matrix Domains */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* 1. Psychomotor Domain */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <BookOpen size={14} />
                    1. Psychomotor Skills
                  </h4>

                  <div className="space-y-5">
                    {PSYCHOMOTOR_FIELDS.map((field) => {
                      const selectedVal = activeEdits[field.key] || ''
                      return (
                        <div key={field.key} className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">{field.label}</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {RUBRIC_LEVELS.map((level) => {
                              const active = selectedVal === level.code
                              return (
                                <button
                                  key={level.code}
                                  type="button"
                                  onClick={() => handleUpdateField(field.key, level.code)}
                                  className={`py-1 text-[10px] font-black rounded transition-all text-center ${
                                    active
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title={`${level.label}: ${level.desc}`}
                                >
                                  {level.code}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Behavioral Domain */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <Award size={14} />
                    2. Behavioral Development
                  </h4>

                  <div className="space-y-5">
                    {BEHAVIORAL_FIELDS.map((field) => {
                      const selectedVal = activeEdits[field.key] || ''
                      return (
                        <div key={field.key} className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">{field.label}</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {RUBRIC_LEVELS.map((level) => {
                              const active = selectedVal === level.code
                              return (
                                <button
                                  key={level.code}
                                  type="button"
                                  onClick={() => handleUpdateField(field.key, level.code)}
                                  className={`py-1 text-[10px] font-black rounded transition-all text-center ${
                                    active
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title={`${level.label}: ${level.desc}`}
                                >
                                  {level.code}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* 3. Narrative Commentary Box */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 size={13} />
                    Holistic Narrative commentary
                  </h4>
                  
                  <span className={`text-[10px] font-bold ${
                    (activeEdits.narrativeComment || '').length > 500 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {(activeEdits.narrativeComment || '').length} / 500 Characters
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={activeEdits.narrativeComment || ''}
                  onChange={(e) => handleUpdateField('narrativeComment', e.target.value)}
                  placeholder="Draft dynamic, qualitative evaluation notes regarding writing mastery, classroom behaviors, coordination, neatness, and group interactions..."
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border rounded-lg focus:ring-1 focus:outline-none resize-none transition ${
                    (activeEdits.narrativeComment || '').length > 500
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />

                {(activeEdits.narrativeComment || '').length > 500 && (
                  <p className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
                    <AlertCircle size={12} /> Remarks exceed the strict 500 character layout limit. Please condense.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
