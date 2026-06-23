'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  UserCheck,
  Calendar,
  Save,
  Check,
  AlertCircle,
  Clock,
  UserX,
  Users
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface FormAllocation {
  classId: number
  className: string
  sectionId: number
  sectionName: string
  sessionId: number
}

interface Student {
  id: number
  registerNo: string
  firstName: string
  lastName: string
  gender: string
}

interface AttendanceRecord {
  status: string // 'Present' | 'Absent' | 'Late'
  remark: string
}

interface AttendanceRegisterProps {
  formAllocations: FormAllocation[]
}

export default function AttendanceRegister({ formAllocations }: AttendanceRegisterProps) {
  const [selectedFormIdx, setSelectedFormIdx] = useState(0)
  const [attendanceDate, setAttendanceDate] = useState(() => {
    // Default to today's local date
    const d = new Date()
    const offset = d.getTimezoneOffset()
    const localDate = new Date(d.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().split('T')[0]
  })

  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceRecord>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeForm = formAllocations[selectedFormIdx]

  // Load students roster and existing records
  const loadRosterAndAttendance = async () => {
    if (!activeForm) return
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Students
      const rosterRes = await apiSlice.get<{ success: boolean; students: Student[] }>(
        `${endpoints.teacher.students}?classId=${activeForm.classId}&sectionId=${activeForm.sectionId}`
      )
      
      // 2. Fetch Existing Attendance
      const attendanceRes = await apiSlice.get<{ success: boolean; attendance: any[] }>(
        `${endpoints.teacher.attendance}?classId=${activeForm.classId}&sectionId=${activeForm.sectionId}&attendanceDate=${attendanceDate}`
      )

      setStudents(rosterRes.students || [])

      const initialAttendance: Record<number, AttendanceRecord> = {}
      rosterRes.students.forEach((std) => {
        const found = attendanceRes.attendance?.find((a) => a.studentId === std.id)
        initialAttendance[std.id] = {
          status: found ? found.status : 'Present',
          remark: found ? (found.remark || '') : ''
        }
      })
      setAttendanceRecords(initialAttendance)
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRosterAndAttendance()
  }, [selectedFormIdx, attendanceDate])

  // Calculated Summary Metrics
  const summary = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    Object.values(attendanceRecords).forEach((rec) => {
      if (rec.status === 'Present') present++
      else if (rec.status === 'Absent') absent++
      else if (rec.status === 'Late') late++
    })
    return {
      total: students.length,
      present,
      absent,
      late
    }
  }, [students, attendanceRecords])

  const handleSaveAttendance = async () => {
    if (!activeForm) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payloadAttendance = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId: Number(studentId),
        status: data.status,
        remark: data.remark
      }))

      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.teacher.attendance,
        {
          classId: activeForm.classId,
          sectionId: activeForm.sectionId,
          attendanceDate,
          attendanceData: payloadAttendance
        }
      )

      if (res.success) {
        setSuccess('Class attendance register submitted successfully.')
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(res.message || 'Failed to save attendance register.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance register.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-600" />
              Class Attendance Tracker
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Record and track daily attendance register logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Form Room</label>
              <select
                value={selectedFormIdx}
                onChange={(e) => setSelectedFormIdx(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {formAllocations.map((form, idx) => (
                  <option key={idx} value={idx}>
                    {form.className} ({form.sectionName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Register Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none pl-8"
                />
                <Calendar size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 shadow-xs">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{summary.total}</div>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-emerald-200 text-emerald-600 shadow-xs">
            <UserCheck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Present</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{summary.present}</div>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-rose-200 text-rose-600 shadow-xs">
            <UserX size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Absent</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{summary.absent}</div>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-amber-200 text-amber-600 shadow-xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">Late</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{summary.late}</div>
          </div>
        </div>
      </div>

      {/* 3. Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent align-[-0.125em]" />
            <p className="text-sm font-bold text-slate-400 mt-3">Loading register roster...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[10.5px] uppercase tracking-wider">
                    <th className="px-6 py-3.5">Reg No</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5 w-64">Attendance Status</th>
                    <th className="px-6 py-3.5 w-80">Remarks/Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const record = attendanceRecords[student.id] || { status: 'Present', remark: '' }
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{student.registerNo}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-extrabold text-slate-800">
                            {student.lastName}, {student.firstName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {['Present', 'Absent', 'Late'].map((status) => (
                              <button
                                type="button"
                                key={status}
                                onClick={() => {
                                  setAttendanceRecords((prev) => ({
                                    ...prev,
                                    [student.id]: { ...prev[student.id], status }
                                  }))
                                }}
                                className={`px-3 py-1.5 text-xs font-black rounded-lg border transition ${
                                  record.status === status
                                    ? status === 'Present'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                                      : status === 'Absent'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs'
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={record.remark}
                            onChange={(e) => {
                              setAttendanceRecords((prev) => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], remark: e.target.value }
                              }))
                            }}
                            placeholder="Optional remarks (e.g. medical leave)"
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Attendance Button */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Submitting Register...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save & Submit Register
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 italic font-semibold">
            No students registered in this room.
          </div>
        )}
      </div>
    </div>
  )
}
