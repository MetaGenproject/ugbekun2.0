'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  UserPlus,
  Sparkles,
  FileSpreadsheet,
  Globe,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Upload,
  Bot,
  Loader2,
  FileText,
  Check,
  Download,
  AlertTriangle,
  GraduationCap,
  Users,
  Award,
  BarChart3,
  Building2,
  Mail,
  Phone,
  Calendar
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

type AdmissionTab = 
  | 'register' 
  | 'bulk' 
  | 'online-applications' 
  | 'entrance-exam' 
  | 'screening' 
  | 'approval' 
  | 'reports'

interface Applicant {
  id: string
  fullName: string
  targetClass: string
  parentName: string
  parentPhone: string
  examScore?: number
  screeningStatus: 'pending' | 'passed' | 'flagged'
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'waitlisted'
  appliedDate: string
}

export function AdmissionsManagement() {
  const [activeTab, setActiveTab] = useState<AdmissionTab>('register')

  // Register Student Single Form State
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regGender, setRegGender] = useState('Male')
  const [regDob, setRegDob] = useState('')
  const [regClass, setRegClass] = useState('Primary 1')
  const [regParentName, setRegParentName] = useState('')
  const [regParentPhone, setRegParentPhone] = useState('')
  const [regParentEmail, setRegParentEmail] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // AI Bulk Roster Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiPreviewData, setAiPreviewData] = useState<Array<{ name: string; class: string; parent: string; phone: string; status: string }>>([])

  // Applicant Roster State
  const [applicants, setApplicants] = useState<Applicant[]>([
    { id: 'ADM-2026-001', fullName: 'Chinedu Joseph Okafor', targetClass: 'Primary 1', parentName: 'Mr. Emmanuel Okafor', parentPhone: '+234 803 123 4567', examScore: 88, screeningStatus: 'passed', approvalStatus: 'approved', appliedDate: '2026-07-28' },
    { id: 'ADM-2026-002', fullName: 'Amina Abubakar Bello', targetClass: 'Primary 3', parentName: 'Hajiya Fatima Bello', parentPhone: '+234 802 987 6543', examScore: 92, screeningStatus: 'passed', approvalStatus: 'approved', appliedDate: '2026-07-29' },
    { id: 'ADM-2026-003', fullName: 'David Oluwaseun Adeleke', targetClass: 'JSS 1', parentName: 'Dr. Tunde Adeleke', parentPhone: '+234 805 111 2233', examScore: 74, screeningStatus: 'passed', approvalStatus: 'pending', appliedDate: '2026-07-30' },
    { id: 'ADM-2026-004', fullName: 'Zainab Ibrahim Sani', targetClass: 'Primary 2', parentName: 'Mallam Ibrahim Sani', parentPhone: '+234 807 444 5566', examScore: 65, screeningStatus: 'pending', approvalStatus: 'pending', appliedDate: '2026-08-01' },
    { id: 'ADM-2026-005', fullName: 'Emeka Victor Nnamdi', targetClass: 'SSS 1', parentName: 'Chief Nnamdi Okeke', parentPhone: '+234 809 333 7788', examScore: 45, screeningStatus: 'flagged', approvalStatus: 'waitlisted', appliedDate: '2026-08-01' },
  ])

  const [searchQuery, setSearchQuery] = useState('')

  // Single Student Registration Handler
  const handleSingleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regFirstName || !regLastName) return

    setIsRegistering(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      const newApplicant: Applicant = {
        id: `ADM-2026-0${applicants.length + 1}`,
        fullName: `${regFirstName} ${regLastName}`,
        targetClass: regClass,
        parentName: regParentName || 'Parent / Guardian',
        parentPhone: regParentPhone || '+234 800 000 0000',
        examScore: 85,
        screeningStatus: 'passed',
        approvalStatus: 'approved',
        appliedDate: new Date().toISOString().split('T')[0]
      }
      setApplicants(prev => [newApplicant, ...prev])
      alert(`Student ${regFirstName} ${regLastName} registered successfully!`)
      setRegFirstName('')
      setRegLastName('')
      setRegParentName('')
      setRegParentPhone('')
      setRegParentEmail('')
      setRegAddress('')
      setActiveTab('approval')
    } catch (err) {
      alert('Registration failed.')
    } finally {
      setIsRegistering(false)
    }
  }

  // AI Bulk Upload Handler
  const handleSimulateAiBulkUpload = () => {
    setIsAiProcessing(true)
    setTimeout(() => {
      setAiPreviewData([
        { name: 'Kelechi Samuel Nwosu', class: 'Primary 1', parent: 'Mr. Nwosu', phone: '+234 803 999 1111', status: '✓ OSe AI Validated' },
        { name: 'Fatima Maryam Yusuf', class: 'Primary 2', parent: 'Mrs. Yusuf', phone: '+234 802 888 2222', status: '✓ OSe AI Validated' },
        { name: 'Blessing Grace Okon', class: 'Primary 4', parent: 'Elder Okon', phone: '+234 805 777 3333', status: '✓ OSe AI Validated' },
        { name: 'Tariq Ahmed Danladi', class: 'JSS 1', parent: 'Mallam Danladi', phone: '+234 807 666 4444', status: '✓ Duplicate Phone Corrected' },
      ])
      setIsAiProcessing(false)
    }, 1200)
  }

  const handleCommitBulkAdmissions = () => {
    if (aiPreviewData.length === 0) return
    const newItems: Applicant[] = aiPreviewData.map((item, idx) => ({
      id: `ADM-2026-0${applicants.length + idx + 1}`,
      fullName: item.name,
      targetClass: item.class,
      parentName: item.parent,
      parentPhone: item.phone,
      examScore: 80 + idx,
      screeningStatus: 'passed',
      approvalStatus: 'approved',
      appliedDate: new Date().toISOString().split('T')[0]
    }))

    setApplicants(prev => [...newItems, ...prev])
    alert(`Bulk Roster of ${aiPreviewData.length} students processed and admitted via OSe AI!`)
    setAiPreviewData([])
    setActiveTab('approval')
  }

  const handleUpdateApproval = (id: string, status: 'approved' | 'rejected' | 'waitlisted') => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, approvalStatus: status } : a))
  }

  const filteredApplicants = applicants.filter(a => {
    const q = searchQuery.toLowerCase()
    return a.fullName.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.targetClass.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="text-blue-600" size={24} /> Admissions & Enrolment Management
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Student registration, AI-assisted bulk admissions, online applications, entrance exams, and screening approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('bulk')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" /> AI Bulk Admission
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <UserPlus size={15} /> Register Student
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'register' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus size={14} /> Register Student
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'bulk' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={14} className="text-amber-300" /> Bulk Admission (AI Assisted)
        </button>

        <button
          onClick={() => setActiveTab('online-applications')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'online-applications' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={14} /> Online Applications
        </button>

        <button
          onClick={() => setActiveTab('entrance-exam')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'entrance-exam' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={14} /> Entrance Examination
        </button>

        <button
          onClick={() => setActiveTab('screening')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'screening' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={14} /> Admission Screening
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'approval' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 size={14} /> Admission Approval
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'reports' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} /> Admission Reports
        </button>
      </div>

      {/* TAB 1: REGISTER STUDENT */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Direct Student Enrolment Registration</h3>
              <p className="text-xs text-slate-500 font-medium">Enter student information to generate an official admission record.</p>
            </div>
          </div>

          <form onSubmit={handleSingleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chinedu"
                  value={regFirstName}
                  onChange={e => setRegFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Okafor"
                  value={regLastName}
                  onChange={e => setRegLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={e => setRegGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={regDob}
                  onChange={e => setRegDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Class *</label>
                <select
                  value={regClass}
                  onChange={e => setRegClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="Nursery 1">Nursery 1</option>
                  <option value="Nursery 2">Nursery 2</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="JSS 1">JSS 1</option>
                  <option value="SSS 1">SSS 1</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 mb-2 uppercase tracking-wider">Parent / Guardian Linking</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Parent Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Emmanuel Okafor"
                    value={regParentName}
                    onChange={e => setRegParentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Parent Phone Number</label>
                  <input
                    type="text"
                    placeholder="+234 803 000 0000"
                    value={regParentPhone}
                    onChange={e => setRegParentPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold font-mono bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Parent Email</label>
                <input
                  type="email"
                  placeholder="parent@gmail.com"
                  value={regParentEmail}
                  onChange={e => setRegParentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Lagos, Nigeria"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isRegistering}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isRegistering ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Register & Submit Enrolment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BULK ADMISSION (AI ASSISTED) */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  AI-Assisted Bulk Roster Enrolment <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded border border-amber-200">Powered by OSe AI</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Upload CSV / Excel spreadsheets for automated validation and batch enrolment.</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-3">
            <FileSpreadsheet className="mx-auto text-slate-400" size={36} />
            <div>
              <p className="text-xs font-bold text-slate-800">Upload Student Roster CSV or Excel File</p>
              <p className="text-[11px] text-slate-400">OSe AI will sanitize formatting, detect duplicate phone numbers, and auto-assign admission numbers.</p>
            </div>
            <button
              onClick={handleSimulateAiBulkUpload}
              disabled={isAiProcessing}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              {isAiProcessing ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Sparkles size={14} className="text-amber-400" />} Run OSe AI Bulk Batch Process
            </button>
          </div>

          {aiPreviewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">OSe AI Batch Validation Preview ({aiPreviewData.length} Students)</h4>
                <button
                  onClick={handleCommitBulkAdmissions}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} /> Approve & Enrol All
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Target Class</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead>OSe AI Audit Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiPreviewData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-slate-900">{item.name}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.class}</TableCell>
                      <TableCell className="text-xs text-slate-600">{item.parent}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{item.phone}</TableCell>
                      <TableCell>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ONLINE APPLICATIONS */}
      {activeTab === 'online-applications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={20} /> Public Online Applications Portal
              </h3>
              <p className="text-xs text-slate-500 font-medium">Applications submitted remotely by parents via the Ugbekun school web portal.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application Ref</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Target Class</TableHead>
                <TableHead>Parent / Guardian</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-bold text-blue-700">{a.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{a.fullName}</TableCell>
                  <TableCell className="font-semibold text-slate-700">{a.targetClass}</TableCell>
                  <TableCell className="text-xs text-slate-600">{a.parentName} ({a.parentPhone})</TableCell>
                  <TableCell className="text-xs text-slate-500">{a.appliedDate}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setActiveTab('screening')}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition"
                    >
                      Review Application
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: ENTRANCE EXAMINATION */}
      {activeTab === 'entrance-exam' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Award className="text-amber-500" size={20} /> Entrance Examination Scores
              </h3>
              <p className="text-xs text-slate-500 font-medium">Scheduled entrance test scores for incoming primary and secondary candidates.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant ID</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Target Class</TableHead>
                <TableHead>Test Score (%)</TableHead>
                <TableHead>Exam Remark</TableHead>
                <TableHead className="text-right">Score Entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-bold text-slate-700">{a.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{a.fullName}</TableCell>
                  <TableCell className="font-semibold text-slate-700">{a.targetClass}</TableCell>
                  <TableCell className="font-mono font-black text-slate-900">{a.examScore ?? '—'} / 100</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      (a.examScore || 0) >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {(a.examScore || 0) >= 70 ? 'Passed Entrance Test' : 'Needs Review'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => alert(`Entering test score for ${a.fullName}`)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                    >
                      Update Score
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: ADMISSION SCREENING */}
      {activeTab === 'screening' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileCheck className="text-indigo-600" size={20} /> Document Verification & Interview Screening
              </h3>
              <p className="text-xs text-slate-500 font-medium">Verify birth certificates, previous school transcripts, and physical interview notes.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Target Class</TableHead>
                <TableHead>Birth Certificate</TableHead>
                <TableHead>Immunization</TableHead>
                <TableHead>Screening Outcome</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold text-slate-900">{a.fullName}</TableCell>
                  <TableCell className="font-semibold text-slate-700">{a.targetClass}</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600">✓ Verified</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600">✓ Verified</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {a.screeningStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setActiveTab('approval')}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition"
                    >
                      Proceed to Approval
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 6: ADMISSION APPROVAL */}
      {activeTab === 'approval' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} /> Final Admission Approval & Letter Issuance
              </h3>
              <p className="text-xs text-slate-500 font-medium">Approve candidates, allocate official student IDs, and generate admission letters.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant ID</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Exam Score</TableHead>
                <TableHead>Approval Decision</TableHead>
                <TableHead className="text-right">Admission Letter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{a.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{a.fullName}</TableCell>
                  <TableCell className="font-semibold text-slate-700">{a.targetClass}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-800">{a.examScore}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateApproval(a.id, 'approved')}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer ${
                          a.approvalStatus === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateApproval(a.id, 'waitlisted')}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer ${
                          a.approvalStatus === 'waitlisted' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                        }`}
                      >
                        Waitlist
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => alert(`Printing Admission Letter for ${a.fullName}...`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      <Download size={12} /> Print Letter
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 7: ADMISSION REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} /> Admissions Analytics & Summary Reports
              </h3>
              <p className="text-xs text-slate-500 font-medium">Session admission conversion rates, class distribution, and gender metrics.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Applications</p>
              <p className="text-2xl font-black text-slate-900 mt-1">42 Applications</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Approved Enrolments</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">36 Admitted</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Waitlisted Applicants</p>
              <p className="text-2xl font-black text-amber-950 mt-1">4 Waitlisted</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-blue-50">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Conversion Rate</p>
              <p className="text-2xl font-black text-blue-950 mt-1">85.7%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
