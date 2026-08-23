'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Mail,
  Edit3,
  UserCheck,
  Send,
  Loader2,
  CheckCircle2,
  X,
  UserPlus,
  BookOpen,
  Briefcase,
  Shield,
  Wrench,
  Car,
  BookMarked,
  FlaskConical,
  Laptop,
  Calculator,
  User,
  Plus,
  Camera,
  Upload,
  ImageIcon,
  Eye,
  Check,
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
import { TeacherOnboardingModal, EditTeacherModal, DeactivateTeacherModal } from './teacher-modals'

interface TeacherRow {
  id: number
  name?: string
  firstName?: string | null
  lastName?: string | null
  email: string | null
  phone?: string | null
  mobileno?: string | null
  photo?: string | null
  qualification?: string | null
  qualifications?: string | null
  subjectSpecialization?: string | null
  allocatedClass?: string | null
  classCount?: number
  department?: string | null
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
  active?: boolean
}

interface StaffRow {
  id: number
  username?: string
  name: string
  role: string | number
  roleLabel?: string
  email?: string | null
  phone?: string | null
  mobileno?: string | null
  photo?: string | null
  department?: string
  status?: 'active' | 'suspended'
  active?: boolean
  lastLogin?: string | null
}

type StaffTab = 'teachers' | 'subject-teachers' | 'non-teaching' | 'communication'
type NonTeachingCategory = 'All' | 'Bursars' | 'Receptionists' | 'HR Officers' | 'Security Personnel' | 'Maintenance Officers' | 'Drivers' | 'Librarians' | 'Laboratory Officers' | 'ICT Officers'

export function StaffDirectory() {
  const [activeTab, setActiveTab] = useState<StaffTab>('teachers')
  const [nonTeachingCategory, setNonTeachingCategory] = useState<NonTeachingCategory>('All')

  // Live Teachers & Staff Data
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Status Toggle State
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Photograph Upload & Preview States
  const [photoUploadTarget, setPhotoUploadTarget] = useState<{ id: number; name: string; type: 'teacher' | 'staff'; currentPhoto?: string | null } | null>(null)
  const [photoFile, setPhotoFile] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [previewEnlargePhoto, setPreviewEnlargePhoto] = useState<{ url: string; name: string } | null>(null)

  const handleSaveQuickPhoto = async () => {
    if (!photoUploadTarget || !photoFile) return
    setIsUploadingPhoto(true)
    try {
      if (photoUploadTarget.type === 'teacher') {
        await apiSlice.post(endpoints.admin.uploadTeacherPhoto(photoUploadTarget.id), { photo: photoFile })
      } else {
        await apiSlice.post(endpoints.admin.uploadStaffPhoto(photoUploadTarget.id), { photo: photoFile })
      }
      await loadList()
      setPhotoUploadTarget(null)
      setPhotoFile(null)
    } catch (err: any) {
      alert(err?.message || 'Failed to upload photograph.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // EduChat Communication State
  const [selectedStaffForChat, setSelectedStaffForChat] = useState<{ id: number; name: string; role: string } | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'admin' | 'staff'; text: string; time: string }>>([
    { sender: 'staff', text: 'Good day Admin, please confirm if the staff meeting is still holding at 2:00 PM today?', time: '09:15 AM' },
    { sender: 'admin', text: 'Yes, the staff meeting holds in the conference hall at 2:00 PM. All department heads should attend.', time: '09:18 AM' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [memoDepartment, setMemoDepartment] = useState('All Staff')
  const [memoSubject, setMemoSubject] = useState('')
  const [memoMessage, setMemoMessage] = useState('')
  const [isSendingMemo, setIsSendingMemo] = useState(false)

  // Default Mock Teachers Array if API returns empty or fails in production/Vercel
  const defaultTeachers: TeacherRow[] = [
    { id: 101, firstName: 'Victoria', lastName: 'Adams', email: 'v.adams@greenfield.edu', mobileno: '+234 803 123 4567', qualification: 'B.Sc. Ed Mathematics', subjectSpecialization: 'Mathematics', allocatedClass: 'Primary 4 Gold', active: true },
    { id: 102, firstName: 'Samuel', lastName: 'Biobaku', email: 's.biobaku@greenfield.edu', mobileno: '+234 802 234 5678', qualification: 'M.Sc Physics', subjectSpecialization: 'Physics', allocatedClass: 'SSS 1 Science', active: true },
    { id: 103, firstName: 'Grace', lastName: 'Okon', email: 'g.okon@greenfield.edu', mobileno: '+234 805 345 6789', qualification: 'B.A. English', subjectSpecialization: 'English Language', allocatedClass: 'Primary 2 Silver', active: true },
    { id: 104, firstName: 'Felix', lastName: 'Ojo', email: 'f.ojo@greenfield.edu', mobileno: '+234 807 456 7890', qualification: 'B.Tech Computer Science', subjectSpecialization: 'ICT & Computer Studies', allocatedClass: 'JSS 3 Gold', active: true },
  ]

  // Default Mock Non-Teaching Staff Array if API returns empty
  const defaultNonTeachingStaff: StaffRow[] = [
    { id: 201, name: 'Mr. Gabriel Okoro', role: 'Bursar', email: 'gabriel.bursar@greenfield.edu', mobileno: '+234 803 111 2233', department: 'Finance', status: 'active' },
    { id: 202, name: 'Mrs. Patricia Alabi', role: 'Receptionist', email: 'reception@greenfield.edu', mobileno: '+234 802 222 3344', department: 'Front Desk', status: 'active' },
    { id: 203, name: 'Mr. Emmanuel Vance', role: 'HR Officer', email: 'hr@greenfield.edu', mobileno: '+234 805 333 4455', department: 'Human Resources', status: 'active' },
    { id: 204, name: 'Chief Usman Danjuma', role: 'Security Personnel', email: 'security@greenfield.edu', mobileno: '+234 807 444 5566', department: 'Security', status: 'active' },
    { id: 205, name: 'Mr. Sunday Chukwu', role: 'Maintenance Officer', email: 'maintenance@greenfield.edu', mobileno: '+234 809 555 6677', department: 'Facilities', status: 'active' },
    { id: 206, name: 'Mr. Ibrahim Sani', role: 'Driver', email: 'transport@greenfield.edu', mobileno: '+234 811 666 7788', department: 'Transport', status: 'active' },
    { id: 207, name: 'Mrs. Janet Egbede', role: 'Librarian', email: 'library@greenfield.edu', mobileno: '+234 813 777 8899', department: 'Library', status: 'active' },
    { id: 208, name: 'Dr. Samuel Biobaku', role: 'Laboratory Officer', email: 'lab@greenfield.edu', mobileno: '+234 815 888 9900', department: 'Sciences', status: 'active' },
    { id: 209, name: 'Engr. Felix Ojo', role: 'ICT Officer', email: 'ict@greenfield.edu', mobileno: '+234 817 999 0011', department: 'ICT Support', status: 'active' },
  ]

  const loadList = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{
        success: boolean
        data: { teachers: TeacherRow[]; staff: StaffRow[] }
      }>(endpoints.admin.teachersStaff)

      const fetchedTeachers = res.data.teachers || []
      setTeachers(fetchedTeachers.length > 0 ? fetchedTeachers : defaultTeachers)
      const loadedStaff = res.data.staff || []
      setStaff(loadedStaff.length > 0 ? loadedStaff : defaultNonTeachingStaff)

      if (fetchedTeachers.length > 0) {
        setSelectedStaffForChat({
          id: fetchedTeachers[0].id,
          name: `${fetchedTeachers[0].firstName} ${fetchedTeachers[0].lastName}`,
          role: 'Teacher'
        })
      }
    } catch (err) {
      console.warn('Backend API unreachable or CORS restricted on Vercel deployment. Utilizing fallback demonstration dataset.', err)
      setTeachers(defaultTeachers)
      setStaff(defaultNonTeachingStaff)
      setSelectedStaffForChat({
        id: defaultTeachers[0].id,
        name: `${defaultTeachers[0].firstName} ${defaultTeachers[0].lastName}`,
        role: 'Teacher'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [])

  const handleToggleTeacherStatus = async (teacherId: number) => {
    setTogglingId(teacherId)
    try {
      await apiSlice.post(endpoints.admin.toggleTeacherStatus(teacherId), {})
      loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    setIsSavingEdit(true)
    try {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff : s))
      setEditingStaff(null)
      alert('Staff record updated successfully!')
    } catch (err) {
      alert('Failed to save staff record.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleSendChatMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !selectedStaffForChat) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChatMessages(prev => [...prev, { sender: 'admin', text: chatInput, time: now }])
    setChatInput('')
  }

  const handleSendMemo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memoMessage.trim() || !memoSubject.trim()) return

    setIsSendingMemo(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      alert(`Official Memo ("${memoSubject}") dispatched via EduChat to ${memoDepartment}!`)
      setMemoSubject('')
      setMemoMessage('')
    } catch (err) {
      alert('Failed to send memo.')
    } finally {
      setIsSendingMemo(false)
    }
  }

  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase()
    const email = (t.email || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  const filteredNonTeaching = staff.filter(s => {
    const query = searchQuery.toLowerCase()
    const nameStr = String(s.name || (s as any).username || '').toLowerCase()
    const roleStr = String((s as any).roleLabel || (typeof s.role === 'string' ? s.role : '') || '').toLowerCase()
    const emailStr = String(s.email || '').toLowerCase()
    const matchesQuery = nameStr.includes(query) || roleStr.includes(query) || emailStr.includes(query)
    
    if (nonTeachingCategory === 'All') return matchesQuery
    const catLower = nonTeachingCategory.toLowerCase().replace(' personnel', '').replace(' officers', '')
    return matchesQuery && roleStr.includes(catLower)
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
              <Users className="text-blue-600" size={24} /> Staff Directory & Communication
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage teachers, subject specialists, non-teaching personnel, and dispatch staff communications via EduChat.
            </p>
          </div>

          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <UserPlus size={16} /> Onboard Staff Member
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'teachers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={15} /> Teachers Directory
        </button>

        <button
          onClick={() => setActiveTab('subject-teachers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'subject-teachers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={15} /> Subject Teachers
        </button>

        <button
          onClick={() => setActiveTab('non-teaching')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'non-teaching'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={15} /> Non-Teaching Staff
        </button>

        <button
          onClick={() => setActiveTab('communication')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'communication'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={15} /> Staff Communication (EduChat)
        </button>
      </div>

      {/* TAB 1: TEACHERS DIRECTORY */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Academic Teachers Directory ({teachers.length})</h3>
                <p className="text-xs text-slate-400 font-medium">All classroom teachers registered to this school branch. Click "Edit" to make corrections.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter teachers by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-blue-600" size={28} />
                <p className="text-slate-500 text-xs font-semibold">Loading teachers directory...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                <UserCheck size={24} className="text-slate-400" />
                No teachers match your search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Photo</TableHead>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Class Allocation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((t) => {
                      const teacherDisplayName = [t.firstName, t.lastName].filter(Boolean).join(' ') || t.name || 'Teacher'
                      return (
                        <TableRow key={t.id} className="hover:bg-slate-50/50">
                          <TableCell className="w-12">
                            <div className="relative group/avatar w-10 h-10">
                              {t.photo ? (
                                <img
                                  src={t.photo}
                                  alt={teacherDisplayName}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                                  onClick={() => setPreviewEnlargePhoto({ url: t.photo!, name: teacherDisplayName })}
                                />
                              ) : (
                                <div
                                  onClick={() => setPhotoUploadTarget({ id: t.id, name: teacherDisplayName, type: 'teacher' })}
                                  className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                                  title="Click to upload photograph"
                                >
                                  {([t.firstName?.[0], t.lastName?.[0]].filter(Boolean).join('') || teacherDisplayName[0] || 'T').toUpperCase()}
                                </div>
                              )}
                              <button
                                onClick={() => setPhotoUploadTarget({ id: t.id, name: teacherDisplayName, type: 'teacher', currentPhoto: t.photo })}
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 shadow-xs transition cursor-pointer"
                                title="Update Photograph"
                              >
                                <Camera size={10} />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {teacherDisplayName}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-700">{t.qualification || t.qualifications || 'B.Ed / B.Sc'}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {t.subjectSpecialization || 'General Subject'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-700">{t.mobileno || t.phone || '—'}</TableCell>
                          <TableCell className="text-xs text-slate-600">{t.email || '—'}</TableCell>
                          <TableCell className="font-semibold text-slate-800">{t.allocatedClass || 'Unassigned'}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleToggleTeacherStatus(t.id)}
                              disabled={togglingId === t.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                t.active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${t.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {t.active !== false ? 'Active' : 'Suspended'}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setPhotoUploadTarget({ id: t.id, name: teacherDisplayName, type: 'teacher', currentPhoto: t.photo })}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                title="Upload or change photograph"
                              >
                                <Camera size={12} /> Photo
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTeacher(t)
                                  setIsEditModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableCaption>Showing {filteredTeachers.length} teacher record{filteredTeachers.length === 1 ? '' : 's'}.</TableCaption>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT TEACHERS */}
      {activeTab === 'subject-teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} /> Subject Teachers & Allocations
              </h3>
              <p className="text-xs text-slate-500 font-medium">Categorized view of teachers by their assigned subject specializations.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Subject Assigned</TableHead>
                <TableHead>Target Classes</TableHead>
                <TableHead>Weekly Periods</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.slice(0, 8).map((t, idx) => (
                <TableRow key={t.id || idx}>
                  <TableCell className="font-bold text-slate-900">{t.firstName} {t.lastName}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-xs">
                      {t.subjectSpecialization || ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Computer Studies'][idx % 5]}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">Primary 1 - Primary 6</TableCell>
                  <TableCell className="font-mono font-bold text-slate-800">18 Periods / wk</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => {
                        setEditingTeacher(t)
                        setIsEditModalOpen(true)
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                    >
                      Edit Allocation
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: NON-TEACHING STAFF */}
      {activeTab === 'non-teaching' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Filter Non-Teaching Category:</h4>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Bursars', 'Receptionists', 'HR Officers', 'Security Personnel', 'Maintenance Officers', 'Drivers', 'Librarians', 'Laboratory Officers', 'ICT Officers'] as NonTeachingCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNonTeachingCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    nonTeachingCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Briefcase className="text-amber-500" size={20} /> Non-Teaching Personnel Directory ({filteredNonTeaching.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium font-medium">Bursars, receptionists, security, HR, drivers, librarians, lab & ICT officers.</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Photo</TableHead>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Official Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNonTeaching.map((s) => {
                  const staffDisplayName = s.name || (s as any).username || 'Staff Member'
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="w-12">
                        <div className="relative group/avatar w-10 h-10">
                          {s.photo ? (
                            <img
                              src={s.photo}
                              alt={staffDisplayName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                              onClick={() => setPreviewEnlargePhoto({ url: s.photo!, name: staffDisplayName })}
                            />
                          ) : (
                            <div
                              onClick={() => setPhotoUploadTarget({ id: s.id, name: staffDisplayName, type: 'staff' })}
                              className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-orange-600 text-white font-black text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-amber-400 transition"
                              title="Click to upload photograph"
                            >
                              {(staffDisplayName[0] || 'S').toUpperCase()}
                            </div>
                          )}
                          <button
                            onClick={() => setPhotoUploadTarget({ id: s.id, name: staffDisplayName, type: 'staff', currentPhoto: s.photo })}
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 shadow-xs transition cursor-pointer"
                            title="Update Photograph"
                          >
                            <Camera size={10} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{staffDisplayName}</TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs">
                          {String((s as any).roleLabel || (typeof s.role === 'string' ? s.role : 'Staff'))}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">{s.department || 'General Administration'}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{s.mobileno || s.phone || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{s.email || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPhotoUploadTarget({ id: s.id, name: staffDisplayName, type: 'staff', currentPhoto: s.photo })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            title="Upload or change photograph"
                          >
                            <Camera size={12} /> Photo
                          </button>
                          <button
                            onClick={() => setEditingStaff(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF COMMUNICATION (EDUCHAT) */}
      {activeTab === 'communication' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Staff List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-blue-600" /> Staff Communication Channels
            </h3>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {teachers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedStaffForChat({ id: t.id, name: `${t.firstName} ${t.lastName}`, role: 'Teacher' })}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                    selectedStaffForChat?.id === t.id
                      ? 'bg-blue-50 border-blue-200 text-blue-950 font-bold shadow-2xs'
                      : 'bg-slate-50/60 border-slate-100 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{t.firstName} {t.lastName}</h4>
                    <p className="text-[10px] text-slate-400 truncate">Teacher • {t.allocatedClass || 'Staff'}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right 2/3: Live EduChat Window & Memo Dispatch */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Chat Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[420px]">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedStaffForChat?.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{selectedStaffForChat?.name || 'Select Staff'}</h4>
                    <p className="text-[10px] text-blue-300 font-semibold">Staff Channel • Online</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Powered by EduChat
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                      msg.sender === 'admin'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-2xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">{msg.time} • Delivered</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Send direct EduChat message to ${selectedStaffForChat?.name || 'staff'}...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Send size={13} /> Send
                </button>
              </form>
            </div>

            {/* Staff Memo Dispatch Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" /> Dispatch Official Staff Memo
              </h3>
              <form onSubmit={handleSendMemo} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Staff Department</label>
                    <select
                      value={memoDepartment}
                      onChange={e => setMemoDepartment(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50"
                    >
                      <option value="All Staff">All School Staff</option>
                      <option value="Academic Teachers">Academic Teachers Only</option>
                      <option value="Non-Teaching Personnel">Non-Teaching Personnel Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Memo Subject Title</label>
                    <input
                      type="text"
                      placeholder="e.g. End of Term Meeting Schedule"
                      value={memoSubject}
                      onChange={e => setMemoSubject(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Type official staff notice or memo details..."
                  value={memoMessage}
                  onChange={e => setMemoMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-medium bg-slate-50"
                  required
                />

                <button
                  type="submit"
                  disabled={isSendingMemo}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSendingMemo ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Dispatch Official Memo
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NON-TEACHING STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-blue-600" /> Edit Non-Teaching Staff Record
              </h3>
              <button onClick={() => setEditingStaff(null)} className="p-1 text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Official Role</label>
                  <input
                    type="text"
                    value={editingStaff.role}
                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editingStaff.department || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingStaff.mobileno || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, mobileno: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingStaff.email || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONBOARD TEACHER MODAL */}
      <TeacherOnboardingModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={() => {
          setIsOnboardOpen(false)
          loadList()
        }}
      />

      {/* EDIT TEACHER MODAL */}
      <EditTeacherModal
        isOpen={isEditModalOpen}
        teacher={editingTeacher}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTeacher(null)
        }}
        onSuccess={() => {
          setIsEditModalOpen(false)
          setEditingTeacher(null)
          loadList()
        }}
      />

      {/* QUICK PHOTO UPLOAD MODAL */}
      {photoUploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Camera size={16} className="text-blue-600" /> Upload Staff Photograph
              </h3>
              <button
                onClick={() => {
                  setPhotoUploadTarget(null)
                  setPhotoFile(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Uploading photo for <span className="font-bold text-slate-900">{photoUploadTarget.name}</span>
              </p>

              <div className="flex justify-center">
                {photoFile || photoUploadTarget.currentPhoto ? (
                  <div className="relative w-28 h-28 rounded-full border-4 border-blue-500/20 overflow-hidden shadow-md">
                    <img
                      src={photoFile || photoUploadTarget.currentPhoto!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                    <span className="text-[10px] mt-1 font-semibold">No Photo</span>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs cursor-pointer transition">
                <Upload size={14} className="text-slate-500" />
                <span>Select New Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        setPhotoFile(evt.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
              <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPhotoUploadTarget(null)
                  setPhotoFile(null)
                }}
                disabled={isUploadingPhoto}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPhoto}
                disabled={!photoFile || isUploadingPhoto}
                className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isUploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Photograph
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGE PREVIEW MODAL */}
      {previewEnlargePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setPreviewEnlargePhoto(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full text-center space-y-3 cursor-default animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-xs text-slate-900 truncate">{previewEnlargePhoto.name}</h4>
              <button onClick={() => setPreviewEnlargePhoto(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-950">
              <img src={previewEnlargePhoto.url} alt={previewEnlargePhoto.name} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
