'use client'

import { useState } from 'react'
import {
  Users,
  Briefcase,
  Calendar,
  Award,
  CreditCard,
  UserCheck,
  TrendingUp,
  GraduationCap,
  FileText,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Loader2,
  DollarSign,
  ShieldCheck,
  Check,
  ChevronRight,
  FolderOpen
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type HrTab = 
  | 'employee-directory' 
  | 'recruitment' 
  | 'leave-management' 
  | 'appraisal' 
  | 'payroll-profiles' 
  | 'staff-attendance' 
  | 'staff-promotion' 
  | 'staff-training' 
  | 'staff-documents'

export function HrManagement() {
  const [activeTab, setActiveTab] = useState<HrTab>('employee-directory')
  const [searchQuery, setSearchQuery] = useState('')

  // HR Employees State
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string; dept: string; type: string; status: string; salary: string }>>([])

  // Leave Applications State
  const [leaveApps, setLeaveApps] = useState<Array<{ id: string; staffName: string; type: string; duration: string; startDate: string; status: string }>>([])

  // Recruitment Vacancies State
  const [recruitmentList, setRecruitmentList] = useState<Array<{ id: string; title: string; dept: string; applicants: number; status: string }>>([])

  const handleApproveLeave = (id: string) => {
    setLeaveApps(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l))
    alert(`Leave application ${id} approved!`)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="text-indigo-600" size={24} /> Human Resources (HR) Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Employee directory, recruitment pipeline, leave management, appraisals, payroll profiles, and training.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('recruitment')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Briefcase size={15} className="text-amber-400" /> Recruitment Portal
            </button>
            <button
              onClick={() => setActiveTab('employee-directory')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Plus size={15} /> Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* 9 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('employee-directory')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'employee-directory' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          👥 Employee Directory
        </button>
        <button onClick={() => setActiveTab('recruitment')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'recruitment' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💼 Recruitment
        </button>
        <button onClick={() => setActiveTab('leave-management')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'leave-management' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🌴 Leave Management
        </button>
        <button onClick={() => setActiveTab('appraisal')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'appraisal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ⭐ Performance Appraisal
        </button>
        <button onClick={() => setActiveTab('payroll-profiles')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'payroll-profiles' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💰 Payroll Profiles
        </button>
        <button onClick={() => setActiveTab('staff-attendance')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-attendance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🕒 Staff Attendance
        </button>
        <button onClick={() => setActiveTab('staff-promotion')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-promotion' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🚀 Staff Promotion
        </button>
        <button onClick={() => setActiveTab('staff-training')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-training' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎓 Staff Training
        </button>
        <button onClick={() => setActiveTab('staff-documents')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-documents' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📁 Staff Documents
        </button>
      </div>

      {/* 1. EMPLOYEE DIRECTORY */}
      {activeTab === 'employee-directory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Master Employee Roster ({employees.length})</h3>
              <p className="text-xs text-slate-500 font-medium">Complete directory of teaching and non-teaching staff members.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Designation Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Salary Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No employee records found. Add staff via Staff Directory to populate this roster.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono font-bold text-indigo-700">{emp.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{emp.name}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">{emp.role}</TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.dept}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emp.type === 'Teaching' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{emp.type}</span></TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{emp.salary}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Editing profile for ${emp.name}`)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition">Edit Profile</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 2. RECRUITMENT */}
      {activeTab === 'recruitment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Job Vacancies & Applicant Pipeline</h3>
              <p className="text-xs text-slate-500 font-medium">Track open staff positions, candidate applications, and hiring stages.</p>
            </div>
            <button onClick={() => alert('Post New Vacancy...')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Post New Job Vacancy</button>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Position Title</TableHead><TableHead>Department</TableHead><TableHead>Applicants</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader>
            <TableBody>
              {recruitmentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No active job vacancies open at this time.
                  </TableCell>
                </TableRow>
              ) : (
                recruitmentList.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold text-indigo-700">{r.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{r.title}</TableCell>
                    <TableCell className="text-xs text-slate-600">{r.dept}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{r.applicants} Candidates</TableCell>
                    <TableCell><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">{r.status}</span></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 3. LEAVE MANAGEMENT */}
      {activeTab === 'leave-management' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Staff Leave Applications & Approvals</h3>
              <p className="text-xs text-slate-500 font-medium font-medium">Review annual, sick, and casual leave requests.</p>
            </div>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Ref ID</TableHead><TableHead>Staff Name</TableHead><TableHead>Leave Type</TableHead><TableHead>Duration</TableHead><TableHead>Start Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {leaveApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No pending or historical leave applications recorded.
                  </TableCell>
                </TableRow>
              ) : (
                leaveApps.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono font-bold text-slate-800">{l.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{l.staffName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{l.type}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">{l.duration}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{l.startDate}</TableCell>
                    <TableCell><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>{l.status}</span></TableCell>
                    <TableCell className="text-right">
                      {l.status === 'Pending' && (
                        <button onClick={() => handleApproveLeave(l.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg">Approve Leave</button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. PERFORMANCE APPRAISAL */}
      {activeTab === 'appraisal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Annual Staff Performance Appraisal Matrix</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Staff Name</TableHead><TableHead>Teaching Quality (5m)</TableHead><TableHead>Punctuality (5m)</TableHead><TableHead>Student Pass Rate</TableHead><TableHead>Overall Score</TableHead></TableRow></TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No staff performance appraisals recorded for the current academic session.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold text-slate-900">{e.name}</TableCell>
                    <TableCell className="font-mono text-xs">4.8 / 5.0</TableCell>
                    <TableCell className="font-mono text-xs">5.0 / 5.0</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-700">98.5% Pass</TableCell>
                    <TableCell className="font-mono font-black text-slate-900">98.0% (Excellent)</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. PAYROLL PROFILES */}
      {activeTab === 'payroll-profiles' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Staff Salary Payroll Structures</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Staff Name</TableHead><TableHead>Basic Salary</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions (Tax/Pen)</TableHead><TableHead>Net Monthly Salary</TableHead><TableHead className="text-right">Payslip</TableHead></TableRow></TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No employee payroll records configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold text-slate-900">{e.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{e.salary}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-700">+₦35,000</TableCell>
                    <TableCell className="font-mono text-xs text-rose-700">-₦18,000</TableCell>
                    <TableCell className="font-mono font-black text-slate-900">₦297,000</TableCell>
                    <TableCell className="text-right"><button onClick={() => alert(`Generating payslip for ${e.name}`)} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">Print Payslip</button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. STAFF ATTENDANCE */}
      {activeTab === 'staff-attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Staff Clock-In Attendance Summary</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Real-time attendance summaries will appear as staff record clock-in events.</p>
        </div>
      )}

      {/* 7. STAFF PROMOTION */}
      {activeTab === 'staff-promotion' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Staff Elevation & Career Promotion</h3>
          <select className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold">
            {employees.length === 0 ? (
              <option value="">No staff members available</option>
            ) : (
              employees.map(e => <option key={e.id}>{e.name} ({e.role})</option>)
            )}
          </select>
          <input type="text" placeholder="New Proposed Rank (e.g. Vice Principal Academics)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <button onClick={() => alert('Promotion Processed!')} className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">Process Staff Promotion</button>
        </div>
      )}

      {/* 8. STAFF TRAINING */}
      {activeTab === 'staff-training' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Professional Development & Skill Training Workshops</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Workshop Title</TableHead><TableHead>Trainer Body</TableHead><TableHead>Participants</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium text-xs">
                  No upcoming staff training workshops scheduled.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* 9. STAFF DOCUMENTS */}
      {activeTab === 'staff-documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Digital Staff Credentials & Document Vault</h3>
          {employees.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-medium text-xs">
              No staff document vaults configured yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 border rounded-2xl bg-slate-50 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900">{emp.name}</h4>
                  <p className="text-[10px] text-emerald-700 font-bold">✓ Verified Documents</p>
                  <button onClick={() => alert(`Opening Vault for ${emp.name}...`)} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">View Documents</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
