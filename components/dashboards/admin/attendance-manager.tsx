'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Calendar,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Save,
  Loader2,
  AlertCircle,
  School,
  Layers,
  Search,
  UserX,
  FileCheck2,
  Briefcase,
  Check,
  Info,
  BarChart3,
  DoorOpen,
  QrCode,
  ShieldCheck,
  Send
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

type AttendanceTab = 'student-attendance' | 'staff-attendance' | 'daily-report' | 'monthly-report' | 'gate-manager'

interface GateLog {
  id: string
  personName: string
  role: 'Student' | 'Staff'
  idNumber: string
  entryTime: string
  exitTime?: string
  gateLocation: string
  status: 'Verified Entry' | 'Exit Recorded' | 'Flagged Gate Entry'
}

export function AttendanceManager() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>('student-attendance')
  const [selectedClass, setSelectedClass] = useState('Primary 4 Gold')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])

  // Gate Logs State
  const [gateLogs, setGateLogs] = useState<GateLog[]>([])

  // Roster States
  const [studentRoster, setStudentRoster] = useState<Array<{ id: number; name: string; rollNo: string; status: string }>>([])
  const [staffRoster, setStaffRoster] = useState<Array<{ id: number; name: string; role: string; clockIn: string; status: string }>>([])

  const handleStudentStatusToggle = (id: number, status: string) => {
    setStudentRoster(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const handleSaveStudentAttendance = () => {
    alert(`Student attendance for ${selectedClass} saved! Automatic SMS alerts sent to parents of absent/late students.`)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="text-emerald-600" size={24} /> Attendance & Gate Manager Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Student & staff roll-call, daily/monthly attendance reports, and MyEduRide automated gate scanner logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gate-manager')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <DoorOpen size={15} className="text-amber-400" /> Gate Scanner Logs
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('student-attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'student-attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={14} /> Student Attendance
        </button>

        <button
          onClick={() => setActiveTab('staff-attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'staff-attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={14} /> Staff Attendance
        </button>

        <button
          onClick={() => setActiveTab('daily-report')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'daily-report' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={14} /> Daily Attendance Report
        </button>

        <button
          onClick={() => setActiveTab('monthly-report')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'monthly-report' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} /> Monthly Attendance Report
        </button>

        <button
          onClick={() => setActiveTab('gate-manager')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'gate-manager' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen size={14} /> Gate Manager Report
        </button>
      </div>

      {/* TAB 1: STUDENT ATTENDANCE */}
      {activeTab === 'student-attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Select Class Stream</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="Primary 4 Gold">Primary 4 Gold</option>
                  <option value="Primary 5 Diamond">Primary 5 Diamond</option>
                  <option value="SSS 1 Science A">SSS 1 Science A</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Attendance Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <button
              onClick={handleSaveStudentAttendance}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Save size={14} /> Save & Send Parent SMS Alerts
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quick Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRoster.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No student attendance records recorded yet for this class on {attendanceDate}.
                  </TableCell>
                </TableRow>
              ) : (
                studentRoster.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-slate-700">{s.rollNo}</TableCell>
                    <TableCell className="font-bold text-slate-900">{s.name}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        s.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        s.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <button onClick={() => handleStudentStatusToggle(s.id, 'PRESENT')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] rounded-lg">Present</button>
                      <button onClick={() => handleStudentStatusToggle(s.id, 'LATE')} className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[11px] rounded-lg">Late</button>
                      <button onClick={() => handleStudentStatusToggle(s.id, 'ABSENT')} className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] rounded-lg">Absent</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: STAFF ATTENDANCE */}
      {activeTab === 'staff-attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Briefcase className="text-emerald-600" size={20} /> Daily Staff Clock-In Tracker
              </h3>
              <p className="text-xs text-slate-500 font-medium">Record staff attendance, arrival times, and leave statuses.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Clock-In Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffRoster.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No staff clock-in entries recorded for today.
                  </TableCell>
                </TableRow>
              ) : (
                staffRoster.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell className="font-bold text-slate-900">{st.name}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">{st.role}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">{st.clockIn}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        st.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {st.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Updating clock-in for ${st.name}`)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition">Edit Time</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: DAILY ATTENDANCE REPORT */}
      {activeTab === 'daily-report' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="text-emerald-600" size={20} /> Daily Attendance Summary Report
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time presence metrics for both staff and students for {attendanceDate}.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Students Present</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">94.2% (1,180 / 1,250)</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Late Arrivals</p>
              <p className="text-2xl font-black text-amber-950 mt-1">32 Students</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Staff Present</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">97.8% (44 / 45 Staff)</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-rose-50">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Absent Students</p>
              <p className="text-2xl font-black text-rose-950 mt-1">38 Absent</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY ATTENDANCE REPORT */}
      {activeTab === 'monthly-report' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-emerald-600" size={20} /> Cumulative Monthly Attendance Trends
              </h3>
              <p className="text-xs text-slate-500 font-medium">Monthly breakdown of student and staff presence rates across class streams.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Stream</TableHead>
                <TableHead>Enrolled Students</TableHead>
                <TableHead>Average Presence Rate</TableHead>
                <TableHead>Chronic Absentee Count</TableHead>
                <TableHead className="text-right">Export Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-slate-900">Primary 4 Gold</TableCell>
                <TableCell className="font-mono text-xs">30 Students</TableCell>
                <TableCell className="font-mono font-bold text-emerald-700">96.5%</TableCell>
                <TableCell className="font-mono text-xs text-slate-700">1 Student</TableCell>
                <TableCell className="text-right"><button onClick={() => alert('Downloading Monthly PDF...')} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">PDF Export</button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: GATE MANAGER ATTENDANCE REPORT */}
      {activeTab === 'gate-manager' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <DoorOpen size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  MyEduRide Gate Scanner Logs <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">Live Turnstile Feed</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Automated QR / NFC RFID student & staff gate entry logs from school entrance turnstiles.</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log Ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID Credential</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Gate Location</TableHead>
                <TableHead className="text-right">Gate Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No automated gate entries logged for today. Turnstiles and scanners are listening on network channels.
                  </TableCell>
                </TableRow>
              ) : (
                gateLogs.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono font-bold text-slate-800">{g.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{g.personName}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.role === 'Student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{g.role}</span></TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{g.idNumber}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{g.entryTime}</TableCell>
                    <TableCell className="text-xs text-slate-600">{g.gateLocation}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        g.status === 'Verified Entry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {g.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
