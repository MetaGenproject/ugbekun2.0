'use client'

import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, User, Calendar, Shield, ArrowRight, CheckCircle, FileText, TrendingDown, DollarSign, X } from 'lucide-react'
import { endpoints } from '@/lib/apiSlice'

interface Student {
  id: number
  firstName: string
  lastName: string
  registerNo: string
}

interface AttritionRisk {
  id: number
  studentId: number
  attendanceScore: number
  academicScore: number
  financialScore: number
  sentimentScore: number
  compositeDrift: number
  riskLevel: string
  isIsolated: boolean
  student: Student
}

interface InterventionAlert {
  id: number
  riskId: number
  status: string
  parentPlan: string
  remediationSteps: string[]
  createdAt: string
  risk: AttritionRisk
}

export function TeacherAttritionRadar() {
  const [alerts, setAlerts] = useState<InterventionAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<InterventionAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const token = localStorage.getItem('ugbekun_token') || localStorage.getItem('token')
      const res = await fetch(endpoints.teacher.attritionDashboard, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setAlerts(data.alerts || [])
      } else {
        setErrorMessage(data.message || 'Failed to load attrition alerts.')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Network error fetching attrition dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (alertId: number, nextStatus: string) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('ugbekun_token') || localStorage.getItem('token')
      const res = await fetch(endpoints.teacher.attritionAction(alertId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const data = await res.json()
      if (data.success) {
        // Refresh alert feed
        await fetchAlerts()
        setSelectedAlert(null)
      } else {
        alert(data.message || 'Failed to update alert status.')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating alert status.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="relative rounded-2xl overflow-hidden border border-rose-500/20 bg-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Early Intervention Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">AI Predictive Attrition Radar</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Calculates real-time composite student drift vectors based on micro-attendance logs, financial delinquent aging, and continuous assessment grade velocity.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3">
            <div className="text-center">
              <p className="text-2xl font-black text-rose-500">{alerts.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Active Risk Flags</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Analyzing student drift profiles...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center text-rose-400 text-sm font-semibold">
          {errorMessage}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">No Flagged Students</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Excellent! Currently, no student enrollments under your Form Classrooms exhibit drift characteristics exceeding the critical warning threshold.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((alertItem) => {
            const risk = alertItem.risk
            const student = risk.student
            const driftPercent = Math.round(risk.compositeDrift * 100)

            return (
              <div
                key={alertItem.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between group transition-all"
              >
                <div className="space-y-4">
                  {/* Student Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-white group-hover:text-rose-400 transition-colors">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs text-slate-500">Reg: {student.registerNo}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                        risk.riskLevel === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {risk.riskLevel} RISK
                    </span>
                  </div>

                  {/* Drift Vector Visual */}
                  <div className="space-y-2 bg-slate-900/60 rounded-xl p-3 border border-slate-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Composite Drift Vector</span>
                      <span className="font-black text-white">{driftPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          risk.riskLevel === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${driftPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Sub-component quick preview */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-900/40 rounded-lg p-2 border border-slate-900/20">
                      <Activity size={12} className="text-rose-400" />
                      <span>Att. Risk: {Math.round(risk.attendanceScore * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900/40 rounded-lg p-2 border border-slate-900/20">
                      <TrendingDown size={12} className="text-rose-400" />
                      <span>Acad. Risk: {Math.round(risk.academicScore * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar size={12} />
                    Flagged: {new Date(alertItem.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedAlert(alertItem)}
                    className="text-xs font-bold text-rose-400 hover:text-white transition flex items-center gap-1"
                  >
                    Investigate File
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide-out/Overlay Modal for File Investigation */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white">Student Intervention File</h3>
                  <p className="text-xs text-slate-400">
                    {selectedAlert.risk.student.firstName} {selectedAlert.risk.student.lastName} · {selectedAlert.risk.student.registerNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/40 hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Component breakdown indices */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indicator Diagnostic Vectors</h4>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center space-y-1">
                    <Activity size={18} className="text-rose-400 mx-auto" />
                    <p className="text-xl font-black text-white">{Math.round(selectedAlert.risk.attendanceScore * 100)}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Attendance Dip</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center space-y-1">
                    <TrendingDown size={18} className="text-amber-400 mx-auto" />
                    <p className="text-xl font-black text-white">{Math.round(selectedAlert.risk.academicScore * 100)}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Assessment Decay</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center space-y-1">
                    <DollarSign size={18} className="text-sky-400 mx-auto" />
                    <p className="text-xl font-black text-white">{Math.round(selectedAlert.risk.financialScore * 100)}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Fee Delinquency</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center space-y-1">
                    <FileText size={18} className="text-indigo-400 mx-auto" />
                    <p className="text-xl font-black text-white">{Math.round(selectedAlert.risk.sentimentScore * 100)}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Negative Commentary</p>
                  </div>
                </div>
              </div>

              {/* Actionable parent engagement plan */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-rose-400" />
                  AI Pre-Drafted Parent Engagement Plan
                </h4>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-h-64 overflow-y-auto">
                  <div className="prose prose-invert prose-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedAlert.parentPlan}
                  </div>
                </div>
              </div>

              {/* Remediation Checklist */}
              {selectedAlert.remediationSteps && selectedAlert.remediationSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Remediation Actions</h4>
                  <div className="space-y-2">
                    {selectedAlert.remediationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-900/60 border border-slate-900 rounded-xl p-3">
                        <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-400 bg-slate-950">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-xs text-slate-500">
                Isolation Flag: <strong className="text-rose-400">{selectedAlert.risk.isIsolated ? 'ACTIVE (SECURED)' : 'INACTIVE'}</strong>
              </span>
              <div className="flex items-center gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedAlert.id, 'DISMISSED')}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Dismiss Flag
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedAlert.id, 'RESOLVED')}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={14} className="stroke-[2.5]" />
                  Mark as Resolved & Release Isolation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
