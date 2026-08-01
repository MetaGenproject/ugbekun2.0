'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  CheckCircle2,
  Edit3,
  Trash2,
  Search,
  Layers,
  Sparkles,
  Award,
  BookMarked,
  Sliders,
  Settings2,
  School,
  UserCheck,
  Building,
  Check,
  FileText
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

type AcademicTab = 'classes' | 'teachers-assigned' | 'streams' | 'subjects' | 'subject-assignment' | 'curriculum'

interface ClassItem {
  id: number
  name: string
  section: string
  formTeacher: string
  armsCount: number
  capacity: number
  enrolled: number
}

interface StreamItem {
  id: number
  className: string
  armName: string
  leadTeacher: string
  capacity: number
  enrolled: number
}

interface SubjectItem {
  id: number
  code: string
  name: string
  type: 'Core' | 'Elective' | 'Vocational'
  category: string
  weeklyPeriods: number
}

export function AcademicStructure() {
  const [activeTab, setActiveTab] = useState<AcademicTab>('classes')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Class Modal / Form state
  const [newClassName, setNewClassName] = useState('')
  const [newClassSection, setNewClassSection] = useState('Primary')
  const [newClassCapacity, setNewClassCapacity] = useState('35')

  // Create Stream Form state
  const [streamClass, setStreamClass] = useState('Primary 1')
  const [streamArmName, setStreamArmName] = useState('Gold')
  const [streamTeacher, setStreamTeacher] = useState('Mrs. Victoria Adams')

  // Create Subject Form state
  const [subjCode, setSubjCode] = useState('MTH')
  const [subjName, setSubjName] = useState('Mathematics')
  const [subjType, setSubjType] = useState<'Core' | 'Elective' | 'Vocational'>('Core')
  const [subjCategory, setSubjCategory] = useState('STEM / Numeracy')
  const [subjPeriods, setSubjPeriods] = useState('5')

  // Roster States
  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 1, name: 'Primary 1', section: 'Primary Section', formTeacher: 'Mrs. Victoria Adams', armsCount: 3, capacity: 105, enrolled: 88 },
    { id: 2, name: 'Primary 2', section: 'Primary Section', formTeacher: 'Mr. Christopher Williams', armsCount: 3, capacity: 105, enrolled: 92 },
    { id: 3, name: 'Primary 3', section: 'Primary Section', formTeacher: 'Mrs. Florence Eze', armsCount: 2, capacity: 70, enrolled: 65 },
    { id: 4, name: 'Primary 4', section: 'Primary Section', formTeacher: 'Dr. Samuel Biobaku', armsCount: 2, capacity: 70, enrolled: 68 },
    { id: 5, name: 'JSS 1', section: 'Junior Secondary', formTeacher: 'Engr. Felix Ojo', armsCount: 3, capacity: 120, enrolled: 110 },
    { id: 6, name: 'SSS 1', section: 'Senior Secondary', formTeacher: 'Mr. Gabriel Okoro', armsCount: 3, capacity: 120, enrolled: 104 },
  ])

  const [streams, setStreams] = useState<StreamItem[]>([
    { id: 1, className: 'Primary 1', armName: 'Primary 1 Gold', leadTeacher: 'Mrs. Victoria Adams', capacity: 35, enrolled: 30 },
    { id: 2, className: 'Primary 1', armName: 'Primary 1 Diamond', leadTeacher: 'Mr. John Okafor', capacity: 35, enrolled: 29 },
    { id: 3, className: 'Primary 1', armName: 'Primary 1 Silver', leadTeacher: 'Miss Sarah Bio', capacity: 35, enrolled: 29 },
    { id: 4, className: 'SSS 1', armName: 'SSS 1 Science A', leadTeacher: 'Dr. Samuel Biobaku', capacity: 40, enrolled: 38 },
    { id: 5, className: 'SSS 1', armName: 'SSS 1 Commercial B', leadTeacher: 'Mr. Gabriel Okoro', capacity: 40, enrolled: 34 },
    { id: 6, className: 'SSS 1', armName: 'SSS 1 Arts C', leadTeacher: 'Mrs. Florence Eze', capacity: 40, enrolled: 32 },
  ])

  const [subjects, setSubjects] = useState<SubjectItem[]>([
    { id: 1, code: 'MTH 101', name: 'Mathematics', type: 'Core', category: 'STEM & Numeracy', weeklyPeriods: 5 },
    { id: 2, code: 'ENG 101', name: 'English Language', type: 'Core', category: 'Languages', weeklyPeriods: 5 },
    { id: 3, code: 'BSC 101', name: 'Basic Science & Technology', type: 'Core', category: 'Sciences', weeklyPeriods: 4 },
    { id: 4, code: 'ICT 101', name: 'Computer Studies / ICT', type: 'Core', category: 'Technology', weeklyPeriods: 3 },
    { id: 5, code: 'SOC 101', name: 'Social Studies & Civic Education', type: 'Core', category: 'Humanities', weeklyPeriods: 3 },
    { id: 6, code: 'PHY 301', name: 'Physics', type: 'Elective', category: 'Senior Sciences', weeklyPeriods: 4 },
    { id: 7, code: 'CHM 301', name: 'Chemistry', type: 'Elective', category: 'Senior Sciences', weeklyPeriods: 4 },
    { id: 8, code: 'ACC 301', name: 'Financial Accounting', type: 'Elective', category: 'Commercials', weeklyPeriods: 4 },
  ])

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName) return

    const item: ClassItem = {
      id: Date.now(),
      name: newClassName,
      section: `${newClassSection} Section`,
      formTeacher: 'Unassigned',
      armsCount: 1,
      capacity: Number(newClassCapacity) || 35,
      enrolled: 0
    }
    setClasses(prev => [...prev, item])
    setNewClassName('')
    alert(`Class "${newClassName}" created successfully!`)
  }

  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault()
    if (!streamArmName) return

    const item: StreamItem = {
      id: Date.now(),
      className: streamClass,
      armName: `${streamClass} ${streamArmName}`,
      leadTeacher: streamTeacher,
      capacity: 35,
      enrolled: 0
    }
    setStreams(prev => [...prev, item])
    setStreamArmName('')
    alert(`Stream "${streamClass} ${streamArmName}" added successfully!`)
  }

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjName || !subjCode) return

    const item: SubjectItem = {
      id: Date.now(),
      code: subjCode.toUpperCase(),
      name: subjName,
      type: subjType,
      category: subjCategory,
      weeklyPeriods: Number(subjPeriods) || 4
    }
    setSubjects(prev => [...prev, item])
    setSubjCode('')
    setSubjName('')
    alert(`Subject "${subjName}" created successfully!`)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-purple-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="text-purple-600" size={24} /> Academic Structure & Curriculum
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Configure classes, teacher allocations, streams/arms, subject catalogs, and national scheme of work compliance.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('classes')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus size={16} /> New Academic Entity
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'classes' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School size={14} /> Classes Creation
        </button>

        <button
          onClick={() => setActiveTab('teachers-assigned')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'teachers-assigned' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={14} /> Teachers Assigned
        </button>

        <button
          onClick={() => setActiveTab('streams')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'streams' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={14} /> Streams / Arms
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'subjects' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={14} /> Subjects Creation
        </button>

        <button
          onClick={() => setActiveTab('subject-assignment')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'subject-assignment' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookMarked size={14} /> Subject Assigned to Classes
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'curriculum' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={14} /> Curriculum & Scheme
        </button>
      </div>

      {/* TAB 1: CLASSES CREATION */}
      {activeTab === 'classes' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Create Class Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} className="text-purple-600" /> Create Academic Class
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Class Title</label>
                <input
                  type="text"
                  placeholder="e.g. Primary 6, SSS 2"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Academic Section</label>
                <select
                  value={newClassSection}
                  onChange={e => setNewClassSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value="Pre-School">Pre-School / Early Years</option>
                  <option value="Primary">Primary Section</option>
                  <option value="Junior Secondary">Junior Secondary (JSS)</option>
                  <option value="Senior Secondary">Senior Secondary (SSS)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Capacity</label>
                <input
                  type="number"
                  placeholder="35"
                  value={newClassCapacity}
                  onChange={e => setNewClassCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Class Level
              </button>
            </form>
          </div>

          {/* Right 2/3: Classes Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <School size={14} className="text-purple-600" /> Active Class Levels ({classes.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Form Teacher</TableHead>
                  <TableHead>Arms / Streams</TableHead>
                  <TableHead>Capacity / Enrolled</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                    <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">{c.section}</span></TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{c.formTeacher}</TableCell>
                    <TableCell className="font-bold text-slate-800">{c.armsCount} Arms</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">{c.enrolled} / {c.capacity}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Editing ${c.name}`)} className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHERS ASSIGNED TO CLASSES */}
      {activeTab === 'teachers-assigned' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="text-purple-600" size={20} /> Primary Form Teachers & Class Masters
              </h3>
              <p className="text-xs text-slate-500 font-medium">Assigned class masters responsible for daily registration, attendance, and moral supervision.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Level</TableHead>
                <TableHead>Assigned Form Teacher</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Total Students Managed</TableHead>
                <TableHead className="text-right">Reassign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                  <TableCell className="font-bold text-purple-900">{c.formTeacher}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">+234 803 111 2233</TableCell>
                  <TableCell className="font-mono font-bold text-slate-800">{c.enrolled} Students</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => alert(`Reassigning teacher for ${c.name}`)} className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition">
                      Change Teacher
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: STREAMS / ARMS */}
      {activeTab === 'streams' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Create Stream Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-purple-600" /> Add Class Stream / Arm
            </h3>
            <form onSubmit={handleCreateStream} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Parent Class Level</label>
                <select
                  value={streamClass}
                  onChange={e => setStreamClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Stream / Arm Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gold, Diamond, Science A"
                  value={streamArmName}
                  onChange={e => setStreamArmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Arm Lead Teacher</label>
                <input
                  type="text"
                  value={streamTeacher}
                  onChange={e => setStreamTeacher(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Stream Arm
              </button>
            </form>
          </div>

          {/* Right 2/3: Streams Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-purple-600" /> Configured Class Streams ({streams.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stream Arm Full Name</TableHead>
                  <TableHead>Parent Class</TableHead>
                  <TableHead>Arm Lead Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold text-slate-900">{s.armName}</TableCell>
                    <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{s.className}</span></TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{s.leadTeacher}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">{s.enrolled} / {s.capacity}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Editing ${s.armName}`)} className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECTS CREATION */}
      {activeTab === 'subjects' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Create Subject Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-600" /> Register New Subject
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. MTH 101"
                  value={subjCode}
                  onChange={e => setSubjCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agricultural Science"
                  value={subjName}
                  onChange={e => setSubjName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={subjType}
                    onChange={e => setSubjType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Vocational">Vocational</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Periods / Wk</label>
                  <input
                    type="number"
                    value={subjPeriods}
                    onChange={e => setSubjPeriods(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Create Subject
              </button>
            </form>
          </div>

          {/* Right 2/3: Subjects Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-600" /> Master Subject Catalog ({subjects.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weekly Periods</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono font-bold text-purple-700">{sub.code}</TableCell>
                    <TableCell className="font-bold text-slate-900">{sub.name}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.type === 'Core' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{sub.type}</span></TableCell>
                    <TableCell className="text-xs text-slate-600">{sub.category}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{sub.weeklyPeriods} Periods</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => alert(`Editing ${sub.name}`)} className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 5: SUBJECT ASSIGNED TO CLASSES */}
      {activeTab === 'subject-assignment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BookMarked className="text-purple-600" size={20} /> Class-Subject Mapping Grid
              </h3>
              <p className="text-xs text-slate-500 font-medium">Assign core and elective subjects to specific class levels and streams.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Level</TableHead>
                <TableHead>Assigned Subjects</TableHead>
                <TableHead>Total Load</TableHead>
                <TableHead className="text-right">Manage Mapping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c, idx) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subjects.slice(0, 4 + (idx % 4)).map(sub => (
                        <span key={sub.id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-800">{12 + idx * 2} Subjects</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => alert(`Modifying subject map for ${c.name}`)} className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition">
                      Configure Mapping
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 6: CURRICULUM */}
      {activeTab === 'curriculum' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Award className="text-amber-500" size={20} /> Curriculum Standards & Scheme of Work
              </h3>
              <p className="text-xs text-slate-500 font-medium">National NERDC and International Cambridge IGCSE Curriculum alignment.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-extrabold text-sm text-slate-900">NERDC Nigerian National Curriculum</h4>
              <p className="text-xs text-slate-500 font-medium">9-Year Basic Education & Senior Secondary Curriculum Compliance 2026 Edition.</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">✓ Active standard</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-extrabold text-sm text-slate-900">Cambridge IGCSE Curriculum</h4>
              <p className="text-xs text-slate-500 font-medium">International Secondary Syllabus for Checkpoint & O-Level examinations.</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">✓ Active standard</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-extrabold text-sm text-slate-900">Scheme of Work Compliance Audit</h4>
              <p className="text-xs text-slate-500 font-medium">OSe AI automated auditing of weekly lesson plans against national curriculum benchmarks.</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">98.4% Compliant</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
