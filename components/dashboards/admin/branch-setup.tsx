'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { 
  Plus, 
  Settings, 
  Layers, 
  BookOpen, 
  Award, 
  Check, 
  Loader2, 
  BookMarked,
  Info
} from 'lucide-react'

interface ClassData {
  id: number
  name: string
  nameNumeric: string
  isEcd: boolean
  sections: {
    section: {
      id: number
      name: string
    }
  }[]
}

interface SectionData {
  id: number
  name: string
  capacity: string | null
}

interface SubjectData {
  id: number
  name: string
  subjectCode: string
  subjectType: string
  subjectAuthor: string
}

interface SubjectAssignment {
  id: number
  class: { name: string }
  section: { name: string }
  subject: { name: string; subjectCode: string }
  teacher: { name: string }
}

interface ExamData {
  id: number
  name: string
  remark: string
  markDistribution: string
}

interface Teacher {
  id: number
  name: string
}

export function BranchSetup() {
  const [activeTab, setActiveTab] = useState<'classrooms' | 'subjects' | 'exams'>('classrooms')

  // Classes & Sections state
  const [classes, setClasses] = useState<ClassData[]>([])
  const [sections, setSections] = useState<SectionData[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classError, setClassError] = useState<string | null>(null)

  // Form states
  const [newClassName, setNewClassName] = useState('')
  const [newClassNumeric, setNewClassNumeric] = useState('')
  const [newClassIsEcd, setNewClassIsEcd] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionCapacity, setNewSectionCapacity] = useState('')
  const [isSubmittingClass, setIsSubmittingClass] = useState(false)
  const [isSubmittingSection, setIsSubmittingSection] = useState(false)

  // Allocation state
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([])
  const [selectedClassIsEcd, setSelectedClassIsEcd] = useState(false)
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false)

  // Subjects state
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectCode, setNewSubjectCode] = useState('')
  const [newSubjectType, setNewSubjectType] = useState('Mandatory')
  const [newSubjectAuthor, setNewSubjectAuthor] = useState('')
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false)

  // Subject assignment form state
  const [assignClassId, setAssignClassId] = useState('')
  const [assignSectionId, setAssignSectionId] = useState('')
  const [assignSubjectId, setAssignSubjectId] = useState('')
  const [assignTeacherId, setAssignTeacherId] = useState('')
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false)

  // Exams state
  const [exams, setExams] = useState<ExamData[]>([])
  const [newExamName, setNewExamName] = useState('')
  const [newExamRemark, setNewExamRemark] = useState('')
  const [newExamDist, setNewExamDist] = useState<string[]>([])
  const [distInput, setDistInput] = useState('')
  const [isSubmittingExam, setIsSubmittingExam] = useState(false)

  // Global notifications
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotify({ type, message })
    setTimeout(() => setNotify(null), 5000)
  }

  // Load classrooms (classes, sections, teachers)
  async function loadClassrooms() {
    setIsLoadingClasses(true)
    setClassError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; classes: ClassData[]; sections: SectionData[] }>(
        endpoints.admin.classesSections
      )
      setClasses(res.classes)
      setSections(res.sections)

      // Fetch teachers for curriculum dropdown
      const tRes = await apiSlice.get<{ success: boolean; data: { teachers: Teacher[] } }>(
        endpoints.admin.teachersStaff
      )
      setTeachers(tRes.data.teachers)
    } catch (err) {
      setClassError(err instanceof Error ? err.message : 'Failed to load branch configuration.')
    } finally {
      setIsLoadingClasses(false)
    }
  }

  // Load Subjects & Curriculum Assigns
  async function loadSubjects() {
    try {
      const res = await apiSlice.get<{ success: boolean; subjects: SubjectData[]; assignments: SubjectAssignment[] }>(
        endpoints.admin.subjects
      )
      setSubjects(res.subjects)
      setAssignments(res.assignments)
    } catch (err) {
      showNotification('error', 'Failed to load curriculum subjects.')
    }
  }

  // Load Exams
  async function loadExams() {
    try {
      const res = await apiSlice.get<{ success: boolean; exams: ExamData[] }>(
        endpoints.admin.exams
      )
      setExams(res.exams)
    } catch (err) {
      showNotification('error', 'Failed to load exams matrix.')
    }
  }

  useEffect(() => {
    loadClassrooms()
  }, [])

  useEffect(() => {
    if (activeTab === 'subjects') {
      loadSubjects()
    } else if (activeTab === 'exams') {
      loadExams()
    }
  }, [activeTab])

  // Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName) return

    setIsSubmittingClass(true)
    try {
      await apiSlice.post(endpoints.admin.classes, {
        name: newClassName,
        nameNumeric: newClassNumeric,
        isEcd: newClassIsEcd,
      })
      setNewClassName('')
      setNewClassNumeric('')
      setNewClassIsEcd(false)
      showNotification('success', 'Academic Class successfully registered!')
      await loadClassrooms()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to create class.')
    } finally {
      setIsSubmittingClass(false)
    }
  }

  // Create Section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionName) return

    setIsSubmittingSection(true)
    try {
      await apiSlice.post(endpoints.admin.sections, {
        name: newSectionName,
        capacity: newSectionCapacity,
      })
      setNewSectionName('')
      setNewSectionCapacity('')
      showNotification('success', 'Class Section successfully registered!')
      await loadClassrooms()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to create section.')
    } finally {
      setIsSubmittingSection(false)
    }
  }

  // Handle Class Click for allocation
  const handleSelectClass = (cls: ClassData) => {
    setSelectedClassId(cls.id)
    setSelectedSectionIds(cls.sections.map(s => s.section.id))
    setSelectedClassIsEcd(cls.isEcd)
  }

  // Handle allocation submission
  const handleSaveAllocation = async () => {
    if (!selectedClassId) return

    setIsSubmittingAllocation(true)
    try {
      // Save sections allocation
      await apiSlice.post(endpoints.admin.allocateSections, {
        classId: selectedClassId,
        sectionIds: selectedSectionIds,
      })
      // Save class ECD status toggle
      await apiSlice.post(endpoints.admin.toggleEcdClass, {
        classId: selectedClassId,
        isEcd: selectedClassIsEcd,
      })
      
      showNotification('success', 'Classroom configuration updated successfully!')
      setSelectedClassId(null)
      await loadClassrooms()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to save classroom configurations.')
    } finally {
      setIsSubmittingAllocation(false)
    }
  }

  // Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName || !newSubjectCode) return

    setIsSubmittingSubject(true)
    try {
      await apiSlice.post(endpoints.admin.subjects, {
        name: newSubjectName,
        subjectCode: newSubjectCode,
        subjectType: newSubjectType,
        subjectAuthor: newSubjectAuthor,
      })
      setNewSubjectName('')
      setNewSubjectCode('')
      setNewSubjectAuthor('')
      showNotification('success', 'Academic Subject successfully created!')
      await loadSubjects()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to create subject.')
    } finally {
      setIsSubmittingSubject(false)
    }
  }

  // Assign Subject to Teacher & Class/Section
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignClassId || !assignSectionId || !assignSubjectId || !assignTeacherId) {
      showNotification('error', 'Please fill all assignments fields.')
      return
    }

    setIsSubmittingAssign(true)
    try {
      await apiSlice.post(endpoints.admin.assignSubject, {
        classId: Number(assignClassId),
        sectionId: Number(assignSectionId),
        subjectId: Number(assignSubjectId),
        teacherId: Number(assignTeacherId),
      })
      setAssignClassId('')
      setAssignSectionId('')
      setAssignSubjectId('')
      setAssignTeacherId('')
      showNotification('success', 'Subject assignment created/updated successfully!')
      await loadSubjects()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to assign subject.')
    } finally {
      setIsSubmittingAssign(false)
    }
  }

  // Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExamName || newExamDist.length === 0) {
      showNotification('error', 'Exam name and at least one mark distribution metric is required.')
      return
    }

    setIsSubmittingExam(true)
    try {
      await apiSlice.post(endpoints.admin.exams, {
        name: newExamName,
        remark: newExamRemark,
        markDistribution: newExamDist,
      })
      setNewExamName('')
      setNewExamRemark('')
      setNewExamDist([])
      showNotification('success', 'Exam configuration matrix successfully defined!')
      await loadExams()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to create exam matrix.')
    } finally {
      setIsSubmittingExam(false)
    }
  }

  // Add Distribution Chip
  const addDistChip = () => {
    if (!distInput.trim()) return
    if (newExamDist.includes(distInput.trim())) return
    setNewExamDist([...newExamDist, distInput.trim()])
    setDistInput('')
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Branch Setup Desk</h1>
            <p className="text-slate-500 text-sm font-medium">Configure classes, subjects, allocations, and grading structures for your school.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('classrooms')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition duration-200 ${activeTab === 'classrooms' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Layers size={14} /> Classrooms
            </button>
            <button 
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition duration-200 ${activeTab === 'subjects' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BookOpen size={14} /> Curriculum
            </button>
            <button 
              onClick={() => setActiveTab('exams')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition duration-200 ${activeTab === 'exams' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Award size={14} /> Evaluation Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {notify && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3.5 shadow-xl flex items-center gap-3 animate-slide-up font-semibold text-sm ${notify.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          <div className={`w-2 h-2 rounded-full ${notify.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {notify.message}
        </div>
      )}

      {isLoadingClasses ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-500 text-sm font-semibold">Loading branch config...</p>
        </div>
      ) : classError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
          {classError}
        </div>
      ) : (
        <>
          {/* CLASSROOMS TAB */}
          {activeTab === 'classrooms' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Class & Section Creation Forms */}
              <div className="space-y-6 lg:col-span-1">
                {/* Create Class Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" /> Create New Class
                  </h3>
                  <form onSubmit={handleCreateClass} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Class Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Primary 1, Nursery 2" 
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Numeric Value</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1, 2" 
                        value={newClassNumeric}
                        onChange={e => setNewClassNumeric(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox" 
                        id="newClassIsEcd"
                        checked={newClassIsEcd}
                        onChange={e => setNewClassIsEcd(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="newClassIsEcd" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        ECD / Montessori Class
                      </label>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingClass}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      {isSubmittingClass ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Save Class
                    </button>
                  </form>
                </div>

                {/* Create Section Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-amber-600" /> Create New Section
                  </h3>
                  <form onSubmit={handleCreateSection} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Section Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Gold, A, Silver" 
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Capacity</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 40" 
                        value={newSectionCapacity}
                        onChange={e => setNewSectionCapacity(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingSection}
                      className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      {isSubmittingSection ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Save Section
                    </button>
                  </form>
                </div>
              </div>

              {/* Class & Section Listing Workspace */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Settings size={16} className="text-blue-600" /> Classrooms Allocation Map
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Click on a Class below to manage and allocate sections to it.</p>
                  
                  {classes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No classes configured yet. Create one on the left panel.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {classes.map(cls => (
                        <div 
                          key={cls.id}
                          onClick={() => handleSelectClass(cls)}
                          className={`p-4 rounded-xl border transition duration-200 cursor-pointer flex flex-col justify-between h-28 hover:shadow-md ${selectedClassId === cls.id ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-400">Class ID #{cls.id}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <h4 className="font-extrabold text-slate-800 text-base">{cls.name}</h4>
                              {cls.isEcd && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold uppercase">ECD</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cls.sections.length === 0 ? (
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">No sections allocated</span>
                            ) : (
                              cls.sections.map(s => (
                                <span key={s.section.id} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-bold uppercase">
                                  Section {s.section.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Allocation Overlay */}
                {selectedClassId !== null && (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Allocate Sections for: <span className="text-blue-600">{classes.find(c => c.id === selectedClassId)?.name}</span>
                      </h4>
                      <button 
                        onClick={() => setSelectedClassId(null)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {sections.map(sec => {
                        const isSelected = selectedSectionIds.includes(sec.id)
                        return (
                          <div
                            key={sec.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSectionIds(selectedSectionIds.filter(id => id !== sec.id))
                              } else {
                                setSelectedSectionIds([...selectedSectionIds, sec.id])
                              }
                            }}
                            className={`p-3 rounded-lg border text-center transition cursor-pointer font-bold text-xs flex flex-col justify-center gap-1 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          >
                            <span>{sec.name}</span>
                            {sec.capacity && <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>Max {sec.capacity}</span>}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="selectedClassIsEcd"
                        checked={selectedClassIsEcd}
                        onChange={e => setSelectedClassIsEcd(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <label htmlFor="selectedClassIsEcd" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                          Designate as ECD / Montessori Class
                        </label>
                        <p className="text-[10px] text-slate-400 font-medium leading-normal">
                          ECD classes reject numerical grading and enable the qualitative descriptive assessment rubric.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveAllocation}
                      disabled={isSubmittingAllocation}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      {isSubmittingAllocation ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save Allocations
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CURRICULUM TAB */}
          {activeTab === 'subjects' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Forms side */}
              <div className="space-y-6 lg:col-span-1">
                {/* Create Subject Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" /> Create Subject
                  </h3>
                  <form onSubmit={handleCreateSubject} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Subject Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mathematics, Basic Science" 
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Subject Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MTH101, SCI202" 
                        value={newSubjectCode}
                        onChange={e => setNewSubjectCode(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Subject Type</label>
                      <select 
                        value={newSubjectType}
                        onChange={e => setNewSubjectType(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      >
                        <option value="Mandatory">Mandatory</option>
                        <option value="Elective">Elective</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Author / Textbook</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MacMillan Publications" 
                        value={newSubjectAuthor}
                        onChange={e => setNewSubjectAuthor(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingSubject}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      {isSubmittingSubject ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Save Subject
                    </button>
                  </form>
                </div>

                {/* Allocate Subject to Class-Section-Teacher */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BookMarked size={16} className="text-amber-600" /> Assign to Curriculum
                  </h3>
                  <form onSubmit={handleAssignSubject} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Select Class</label>
                      <select 
                        value={assignClassId}
                        onChange={e => setAssignClassId(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      >
                        <option value="">-- Choose Class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Select Section</label>
                      <select 
                        value={assignSectionId}
                        onChange={e => setAssignSectionId(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      >
                        <option value="">-- Choose Section --</option>
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Select Subject</label>
                      <select 
                        value={assignSubjectId}
                        onChange={e => setAssignSubjectId(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      >
                        <option value="">-- Choose Subject --</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.subjectCode})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Assign Subject Teacher</label>
                      <select 
                        value={assignTeacherId}
                        onChange={e => setAssignTeacherId(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      >
                        <option value="">-- Choose Teacher --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingAssign}
                      className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      {isSubmittingAssign ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Link Subject
                    </button>
                  </form>
                </div>
              </div>

              {/* Assignments List view */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" /> Active Course Assignments
                  </h3>
                  {assignments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No subjects assigned to any class-sections yet. Complete the assignment form on the left.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="pb-3">Class/Section</th>
                            <th className="pb-3">Subject Details</th>
                            <th className="pb-3">Assigned Faculty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {assignments.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5">
                                <span className="text-slate-950 font-bold">{a.class.name}</span>
                                <span className="text-xs text-slate-400 ml-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md font-bold uppercase">Sec {a.section.name}</span>
                              </td>
                              <td className="py-3.5">
                                <div className="text-slate-950 font-extrabold">{a.subject.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-black">{a.subject.subjectCode}</div>
                              </td>
                              <td className="py-3.5 text-blue-600 font-bold">{a.teacher.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Exam creation panel */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" /> Create Academic Exam
                  </h3>
                  <form onSubmit={handleCreateExam} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Exam Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1st Term Examination, Mid-Term CA" 
                        value={newExamName}
                        onChange={e => setNewExamName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Mark Evaluation Metrics (Distributions)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Classwork, Exam, Project" 
                          value={distInput}
                          onChange={e => setDistInput(e.target.value)}
                          className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
                        />
                        <button 
                          type="button"
                          onClick={addDistChip}
                          className="px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold text-xs cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {newExamDist.length === 0 ? (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Info size={10} /> Add grading criteria columns (e.g. Test, Examination)
                          </span>
                        ) : (
                          newExamDist.map((chip, idx) => (
                            <span 
                              key={idx} 
                              onClick={() => setNewExamDist(newExamDist.filter((_, i) => i !== idx))}
                              className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition"
                            >
                              {chip} <span className="font-extrabold">×</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Remarks / Description</label>
                      <textarea 
                        placeholder="Evaluation instructions..." 
                        value={newExamRemark}
                        onChange={e => setNewExamRemark(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 h-20 resize-none"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingExam}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      {isSubmittingExam ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Deploy Exam Matrix
                    </button>
                  </form>
                </div>
              </div>

              {/* Exam listing workspace */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Award size={16} className="text-blue-600" /> Active Evaluation Matrices
                  </h3>
                  {exams.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No exams configured yet. Complete the form to deploy an evaluation matrix.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {exams.map(ex => {
                        let parsedDist: string[] = []
                        try {
                          parsedDist = JSON.parse(ex.markDistribution)
                        } catch {
                          parsedDist = []
                        }
                        return (
                          <div 
                            key={ex.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between h-32 hover:shadow-sm"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-400">Exam ID #{ex.id}</span>
                              <h4 className="font-extrabold text-slate-800 text-base mt-0.5">{ex.name}</h4>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block">Grading Columns Bound:</span>
                              <div className="flex flex-wrap gap-1">
                                {parsedDist.length === 0 ? (
                                  <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">General Score</span>
                                ) : (
                                  parsedDist.map((dId, idx) => (
                                    <span key={idx} className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-extrabold uppercase">
                                      {dId}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
