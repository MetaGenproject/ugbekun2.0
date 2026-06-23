'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Loader2, TrendingUp, AlertTriangle, Check, X } from 'lucide-react'

interface ClassData {
  id: number
  name: string
  sections: {
    section: {
      id: number
      name: string
    }
  }[]
}

interface Section {
  id: number
  name: string
}

interface PromotionModalProps {
  studentId: number
  studentName: string
  currentClass: string
  onClose: () => void
  onSuccess: () => void
}

export function StudentPromotionModal({
  studentId,
  studentName,
  currentClass,
  onClose,
  onSuccess,
}: PromotionModalProps) {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)

  // Form states
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSectionId, setTargetSectionId] = useState('')
  const [isPromoting, setIsPromoting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load classrooms
  useEffect(() => {
    async function loadData() {
      setIsLoadingClasses(true)
      try {
        const res = await apiSlice.get<{ success: boolean; classes: ClassData[] }>(
          endpoints.admin.classesSections
        )
        setClasses(res.classes)
      } catch (err) {
        setErrorMsg('Failed to load class configuration.')
      } finally {
        setIsLoadingClasses(false)
      }
    }
    loadData()
  }, [])

  // Update target sections when class changes
  useEffect(() => {
    if (!targetClassId) {
      setAvailableSections([])
      setTargetSectionId('')
      return
    }

    const selectedClass = classes.find(c => c.id === Number(targetClassId))
    if (selectedClass) {
      setAvailableSections(selectedClass.sections.map(s => s.section))
      setTargetSectionId('')
    }
  }, [targetClassId, classes])

  // Submit promotion
  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetClassId || !targetSectionId) return

    setIsPromoting(true)
    setErrorMsg(null)

    try {
      await apiSlice.post(endpoints.admin.promoteStudent(studentId), {
        classId: Number(targetClassId),
        sectionId: Number(targetSectionId),
      })
      onSuccess()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Promotion failed.')
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} /> Promote Student
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Student: {studentName} (ID: #{studentId})
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Current Enrollment Class:</span>
            <span className="text-slate-900 font-bold bg-slate-200/60 px-2 py-0.5 rounded-md">{currentClass || '—'}</span>
          </div>

          {/* Alert Warnings */}
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
            <div className="space-y-1 text-xs">
              <h5 className="font-extrabold text-amber-800">Destructive Mutation Warning</h5>
              <p className="text-amber-700/90 font-semibold leading-relaxed">
                This action will wipe all unsubmitted/placeholder academic evaluation marks, update the student's enroll, and bind them to the new class's curriculum subjects.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-800">
              {errorMsg}
            </div>
          )}

          {isLoadingClasses ? (
            <div className="flex items-center justify-center p-8 gap-2">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              <span className="text-xs text-slate-400 font-bold">Loading classrooms...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Class</label>
                <select 
                  value={targetClassId}
                  onChange={e => setTargetClassId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-semibold text-slate-800"
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Section</label>
                <select 
                  value={targetSectionId}
                  onChange={e => setTargetSectionId(e.target.value)}
                  disabled={!targetClassId}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-semibold text-slate-800 disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Section --</option>
                  {availableSections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPromoting || !targetClassId || !targetSectionId}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10"
            >
              {isPromoting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Promote Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
