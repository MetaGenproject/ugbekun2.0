'use client'

import { useState } from 'react'
import {
  Building2,
  Plus,
  Users,
  UserCheck,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  FolderPlus,
  Shield,
  Phone,
  Mail,
  Award,
  DollarSign,
  Layers
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

interface Department {
  id: number
  code: string
  name: string
  headName: string
  headEmail: string
  headPhone: string
  staffCount: number
  budget: string
  location: string
  status: 'active' | 'inactive'
}

type DepartmentTab = 'directory' | 'create' | 'heads'

export function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState<DepartmentTab>('directory')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State for Create Department
  const [deptCode, setDeptCode] = useState('')
  const [deptName, setDeptName] = useState('')
  const [deptHead, setDeptHead] = useState('')
  const [headEmail, setHeadEmail] = useState('')
  const [headPhone, setHeadPhone] = useState('')
  const [deptBudget, setDeptBudget] = useState('')
  const [deptLocation, setDeptLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default Departments Roster
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, code: 'SCI', name: 'Department of Pure & Applied Sciences', headName: 'Dr. Samuel Biobaku', headEmail: 'samuel.biobaku@greenfield.edu', headPhone: '+234 803 111 2233', staffCount: 14, budget: '₦2,500,000', location: 'Science Block Lab 1', status: 'active' },
    { id: 2, code: 'MATH', name: 'Department of Mathematics & Statistics', headName: 'Mrs. Victoria Adams', headEmail: 'victoria.adams@greenfield.edu', headPhone: '+234 802 222 3344', staffCount: 10, budget: '₦1,800,000', location: 'Block B Room 12', status: 'active' },
    { id: 3, code: 'ENG', name: 'Department of Languages & Literature', headName: 'Mr. Christopher Williams', headEmail: 'chris.williams@greenfield.edu', headPhone: '+234 805 333 4455', staffCount: 12, budget: '₦1,500,000', location: 'Humanities Wing 4', status: 'active' },
    { id: 4, code: 'ICT', name: 'Department of Computer Science & ICT', headName: 'Engr. Felix Ojo', headEmail: 'felix.ojo@greenfield.edu', headPhone: '+234 807 444 5566', staffCount: 8, budget: '₦4,200,000', location: 'ICT Center Hub', status: 'active' },
    { id: 5, code: 'SOC', name: 'Department of Humanities & Social Sciences', headName: 'Mrs. Florence Eze', headEmail: 'florence.eze@greenfield.edu', headPhone: '+234 809 555 6677', staffCount: 9, budget: '₦1,200,000', location: 'Main Admin Block 3', status: 'active' },
    { id: 6, code: 'FIN', name: 'Department of Finance & Accounts', headName: 'Mr. Gabriel Okoro', headEmail: 'gabriel.okoro@greenfield.edu', headPhone: '+234 811 666 7788', staffCount: 6, budget: '₦8,000,000', location: 'Bursary Office', status: 'active' },
  ])

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptName || !deptCode) return

    setIsSubmitting(true)
    setTimeout(() => {
      const newDept: Department = {
        id: Date.now(),
        code: deptCode.toUpperCase(),
        name: deptName,
        headName: deptHead || 'Unassigned (TBD)',
        headEmail: headEmail || 'dept@greenfield.edu',
        headPhone: headPhone || '+234 800 000 0000',
        staffCount: 1,
        budget: deptBudget ? `₦${Number(deptBudget).toLocaleString()}` : '₦1,000,000',
        location: deptLocation || 'Main Campus',
        status: 'active'
      }

      setDepartments(prev => [newDept, ...prev])
      setIsSubmitting(false)
      alert(`Department "${deptName}" created successfully!`)
      setDeptCode('')
      setDeptName('')
      setDeptHead('')
      setHeadEmail('')
      setHeadPhone('')
      setDeptBudget('')
      setDeptLocation('')
      setActiveTab('directory')
    }, 600)
  }

  const filteredDepts = departments.filter(d => {
    const query = searchQuery.toLowerCase()
    return (
      d.name.toLowerCase().includes(query) ||
      d.code.toLowerCase().includes(query) ||
      d.headName.toLowerCase().includes(query)
    )
  })

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
              <Building2 className="text-indigo-600" size={24} /> School Departments Management
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Create school departments, manage departmental directories, and assign Department Heads (HODs).
            </p>
          </div>

          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <FolderPlus size={16} /> Create Department
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={15} /> Department Directory
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'create'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderPlus size={15} /> Create Department
        </button>

        <button
          onClick={() => setActiveTab('heads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'heads'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={15} /> Department Heads (HODs)
        </button>
      </div>

      {/* TAB 1: DEPARTMENT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Active Departments ({departments.length})</h3>
                <p className="text-xs text-slate-400 font-medium">Overview of all academic and administrative departments in your school.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by department name or code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Head of Department (HOD)</TableHead>
                    <TableHead>Allocated Staff</TableHead>
                    <TableHead>Budget Allocation</TableHead>
                    <TableHead>Facility Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepts.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono font-black text-indigo-700">
                        <span className="px-2 py-1 rounded bg-indigo-50 border border-indigo-100">{d.code}</span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{d.name}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800">{d.headName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.headPhone}</div>
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-800">{d.staffCount} Personnel</TableCell>
                      <TableCell className="font-mono font-bold text-slate-900">{d.budget}</TableCell>
                      <TableCell className="text-xs text-slate-600">{d.location}</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => alert(`Editing department ${d.name}`)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Showing {filteredDepts.length} department record{filteredDepts.length === 1 ? '' : 's'}.</TableCaption>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE DEPARTMENT */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Create New School Department</h3>
              <p className="text-xs text-slate-500 font-medium">Register a new academic or administrative department and assign HOD leadership.</p>
            </div>
          </div>

          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dept Code</label>
                <input
                  type="text"
                  placeholder="e.g. SCI, ICT"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-slate-50"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Department of Physical Education & Sports"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Head of Department (HOD) Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Samuel Biobaku"
                value={deptHead}
                onChange={e => setDeptHead(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">HOD Email</label>
                <input
                  type="email"
                  placeholder="hod@greenfield.edu"
                  value={headEmail}
                  onChange={e => setHeadEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">HOD Phone Number</label>
                <input
                  type="text"
                  placeholder="+234 803 000 0000"
                  value={headPhone}
                  onChange={e => setHeadPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Annual Budget Allocation (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  value={deptBudget}
                  onChange={e => setDeptBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Facility / Office Location</label>
                <input
                  type="text"
                  placeholder="e.g. Science Wing Room 4"
                  value={deptLocation}
                  onChange={e => setDeptLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={14} /> Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: DEPARTMENT HEADS (HODs) */}
      {activeTab === 'heads' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="text-indigo-600" size={20} />
            <div>
              <h3 className="font-black text-base text-slate-900">Department Heads (HODs) Roster</h3>
              <p className="text-xs text-slate-500 font-medium">Designated Heads of Departments overseeing curriculum execution and staff supervision.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {departments.map(d => (
              <div key={d.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{d.code}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">HOD Active</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{d.headName}</h4>
                  <p className="text-[11px] text-indigo-600 font-bold mt-0.5">{d.name}</p>
                </div>
                <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> <span className="truncate">{d.headEmail}</span></div>
                  <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> <span>{d.headPhone}</span></div>
                  <div className="flex items-center gap-1.5"><Users size={12} className="text-slate-400" /> <span>{d.staffCount} Supervised Staff</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
