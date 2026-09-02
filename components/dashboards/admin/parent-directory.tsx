import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { UserCredentialModal } from './user-credential-modal'
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Mail,
  Edit3,
  UserCheck,
  Send,
  AlertTriangle,
  HeartPulse,
  Shield,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  Bot,
  UserPlus,
  Bell,
  MapPin,
  Briefcase,
  KeyRound,
  PhoneCall,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  RefreshCw,
  Check,
  CheckCheck,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface LinkedStudent {
  id: number
  name: string
  registerNo?: string
  className?: string
  sectionName?: string
}

interface ParentRecord {
  id: number
  userId?: number
  name: string
  relation: string
  mobileno: string | null
  email: string | null
  city: string | null
  state: string | null
  studentCount: number
  students?: LinkedStudent[]
  occupation?: string
  address?: string
  status?: 'active' | 'suspended'
}

type ParentTab = 'directory' | 'educhat' | 'emergency'

interface ChatMessage {
  id: number
  parentId: number
  senderType: 'ADMIN' | 'PARENT' | 'TEACHER'
  recipientRole?: string
  subject?: string
  message: string
  isRead?: boolean
  createdAt: string
  updatedAt?: string
}

export function ParentDirectory() {
  const [activeTab, setActiveTab] = useState<ParentTab>('directory')

  // Live Data State
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // Edit Parent Modal State
  const [editingParent, setEditingParent] = useState<ParentRecord | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete Parent Modal State
  const [deletingParent, setDeletingParent] = useState<ParentRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Manage User Credentials State
  const [manageUserCredentials, setManageUserCredentials] = useState<{ userId: number; name: string; role: string } | null>(null)

  // EduChat State
  const [selectedParentForChat, setSelectedParentForChat] = useState<ParentRecord | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')

  // Message Edit / Delete States (CRUD)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false)

  // Broadcast State
  const [broadcastTarget, setBroadcastTarget] = useState('all')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  useEffect(() => {
    const loadParents = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiSlice.get<{
          success: boolean
          data: { parents?: any[]; students?: any[] } | any[]
        }>(endpoints.admin.studentsParents)

        const rawList = Array.isArray(res.data)
          ? res.data
          : (res.data?.parents || [])

        const formatted: ParentRecord[] = rawList.map((p: any) => ({
          id: p.id,
          userId: p.userId || p.id,
          name: p.name || `${p.fatherName || ''} ${p.motherName || ''}`.trim() || 'Parent/Guardian',
          relation: p.relation || 'Parent',
          mobileno: p.mobileno || p.phone || '',
          email: p.email || '',
          city: p.city || '',
          state: p.state || '',
          studentCount: p.studentCount || p._count?.students || (p.students ? p.students.length : 0),
          students: p.students || [],
          occupation: p.occupation || '',
          address: p.address || [p.city, p.state].filter(Boolean).join(', ') || '',
          status: p.active === false ? 'suspended' : 'active'
        }))

        setParents(formatted)
        if (formatted.length > 0) {
          setSelectedParentForChat(formatted[0])
        } else {
          setSelectedParentForChat(null)
        }
      } catch (err: any) {
        console.error('Failed to load parents list:', err)
        setError(err?.message || 'Failed to load parents from live database.')
        setParents([])
        setSelectedParentForChat(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadParents()
  }, [])

  // Load EduChat message thread for selected parent
  const loadChatMessages = async (parentId: number) => {
    setIsLoadingChat(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: ChatMessage[] }>(
        endpoints.admin.parentMessages(parentId)
      )
      if (res?.data) {
        setChatMessages(res.data)
      } else {
        setChatMessages([])
      }
    } catch (err) {
      console.error('Failed to load chat messages for parent:', err)
      setChatMessages([])
    } finally {
      setIsLoadingChat(false)
    }
  }

  useEffect(() => {
    if (selectedParentForChat?.id) {
      loadChatMessages(selectedParentForChat.id)
    }
  }, [selectedParentForChat?.id])

  const handleSaveParentEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParent) return

    setIsSavingEdit(true)
    try {
      await apiSlice.put(endpoints.admin.updateParent(editingParent.id), {
        name: editingParent.name,
        relation: editingParent.relation,
        mobileno: editingParent.mobileno,
        email: editingParent.email,
        occupation: editingParent.occupation,
        address: editingParent.address,
      })
      setParents(prev => prev.map(p => p.id === editingParent.id ? editingParent : p))
      setEditingParent(null)
      alert('Parent details updated successfully!')
    } catch (err: any) {
      alert(err?.message || 'Failed to save parent details.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteParent = async () => {
    if (!deletingParent) return

    setIsDeleting(true)
    try {
      await apiSlice.delete(endpoints.admin.deleteParent(deletingParent.id))
      setParents(prev => prev.filter(p => p.id !== deletingParent.id))
      setDeletingParent(null)
      alert('Parent record deleted successfully.')
    } catch (err: any) {
      alert(err?.message || 'Failed to delete parent record.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !selectedParentForChat) return

    const textToSend = chatInput.trim()
    setChatInput('')
    setIsSendingChat(true)

    try {
      const res = await apiSlice.post<{ success: boolean; data: ChatMessage }>(
        endpoints.admin.sendParentMessage(selectedParentForChat.id),
        { message: textToSend }
      )
      if (res?.data) {
        setChatMessages(prev => [...prev, res.data])
      } else {
        await loadChatMessages(selectedParentForChat.id)
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to send message via EduChat.')
    } finally {
      setIsSendingChat(false)
    }
  }

  const handleUpdateChatMessage = async (messageId: number) => {
    if (!editingMessageText.trim()) return

    setIsUpdatingMessage(true)
    try {
      await apiSlice.put(endpoints.admin.updateParentMessage(messageId), {
        message: editingMessageText.trim(),
      })
      setChatMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, message: editingMessageText.trim(), updatedAt: new Date().toISOString() } : m))
      )
      setEditingMessageId(null)
      setEditingMessageText('')
    } catch (err: any) {
      alert(err?.message || 'Failed to update message.')
    } finally {
      setIsUpdatingMessage(false)
    }
  }

  const handleDeleteChatMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await apiSlice.delete(endpoints.admin.deleteParentMessage(messageId))
      setChatMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (err: any) {
      alert(err?.message || 'Failed to delete message.')
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMessage.trim()) return

    setIsBroadcasting(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(
        endpoints.admin.sendParentBroadcast,
        { target: broadcastTarget, message: broadcastMessage }
      )
      alert(res?.message || 'Broadcast notification dispatched via EduChat!')
      setBroadcastMessage('')
      if (selectedParentForChat) {
        loadChatMessages(selectedParentForChat.id)
      }
    } catch (err: any) {
      alert(err?.message || 'Broadcast failed.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const filteredParents = parents.filter(p => {
    const query = searchQuery.toLowerCase()
    const childrenNames = p.students?.map(s => `${s.name} ${s.className || ''}`).join(' ').toLowerCase() || ''
    return (
      p.name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.mobileno?.toLowerCase().includes(query) ||
      p.relation?.toLowerCase().includes(query) ||
      p.address?.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      childrenNames.includes(query)
    )
  })

  const totalItems = filteredParents.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedParents = filteredParents.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-600" size={24} /> Parents & Guardians Management
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage parent directory records, communicate instantly via EduChat, and access emergency contacts.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'directory'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={15} /> Parent Directory
        </button>

        <button
          onClick={() => setActiveTab('educhat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'educhat'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={15} /> Parent Communication (EduChat)
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'emergency'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartPulse size={15} /> Emergency Contacts
        </button>
      </div>

      {/* TAB 1: PARENT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Parent Directory ({parents.length})</h3>
                <p className="text-xs text-slate-400 font-medium">All registered parents and guardians. Click "Edit" to correct guardian details.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by parent name, email, phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
                <p className="text-slate-500 text-xs font-semibold">Loading parent directory...</p>
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                <Users size={24} className="text-slate-400" />
                No parent records match your search filter.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="font-extrabold text-slate-800">Parent / Guardian</TableHead>
                        <TableHead className="font-extrabold text-slate-800">Relation</TableHead>
                        <TableHead className="font-extrabold text-slate-800 min-w-[200px] max-w-[280px]">Linked Children</TableHead>
                        <TableHead className="font-extrabold text-slate-800">Phone Number</TableHead>
                        <TableHead className="font-extrabold text-slate-800 min-w-[160px] max-w-[220px]">Email Address</TableHead>
                        <TableHead className="font-extrabold text-slate-800 min-w-[160px] max-w-[240px]">Location</TableHead>
                        <TableHead className="font-extrabold text-slate-800 text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedParents.map((parent) => {
                        const locationParts = [parent.address, parent.city, parent.state].filter(Boolean)
                        const locationText = locationParts.length > 0 ? Array.from(new Set(locationParts)).join(', ') : '—'

                        return (
                          <TableRow key={parent.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-bold text-slate-900 py-3.5">
                              <div className="text-xs font-bold text-slate-900">{parent.name || '—'}</div>
                              {parent.occupation && (
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{parent.occupation}</div>
                              )}
                            </TableCell>

                            <TableCell className="py-3.5">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                                {parent.relation || 'Parent'}
                              </span>
                            </TableCell>

                            {/* LINKED CHILDREN (WRAPPED & DISPLAYED) */}
                            <TableCell className="max-w-[280px] whitespace-normal break-words py-3.5">
                              {parent.students && parent.students.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {parent.students.map((st: any) => {
                                    const stName = st.name || [st.firstName, st.lastName].filter(Boolean).join(' ') || `Child #${st.id}`
                                    const classTag = [st.className, st.sectionName].filter(Boolean).join(' ')
                                    return (
                                      <span
                                        key={st.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-950 border border-blue-200/80 text-[11px] font-bold shadow-2xs hover:bg-blue-100 transition"
                                      >
                                        <span className="truncate max-w-[180px]">{stName}</span>
                                        {classTag && (
                                          <span className="text-[9px] font-black text-blue-700 bg-blue-100/90 border border-blue-200/50 px-1.5 py-0.2 rounded-md">
                                            {classTag}
                                          </span>
                                        )}
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="font-bold text-slate-500 text-xs italic">
                                  {parent.studentCount > 0 ? `${parent.studentCount} Child${parent.studentCount === 1 ? '' : 'ren'}` : 'No linked children'}
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="font-mono text-xs font-semibold text-slate-800 py-3.5">
                              {parent.mobileno || '—'}
                            </TableCell>

                            {/* EMAIL ADDRESS (WRAPPED EXPLICITLY) */}
                            <TableCell className="max-w-[220px] min-w-[150px] whitespace-normal break-all text-xs font-semibold text-slate-700 py-3.5 leading-snug">
                              {parent.email || '—'}
                            </TableCell>

                            {/* LOCATION (WRAPPED EXPLICITLY) */}
                            <TableCell className="max-w-[240px] min-w-[150px] whitespace-normal break-words text-xs font-medium text-slate-600 py-3.5 leading-snug">
                              {locationText}
                            </TableCell>

                            {/* ACTIONS DROPDOWN MENU */}
                            <TableCell className="text-right py-3.5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition cursor-pointer">
                                    Actions <ChevronDown size={13} className="text-slate-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-xl border-slate-200 bg-white z-50">
                                  <DropdownMenuItem
                                    onClick={() => setManageUserCredentials({ userId: (parent as any).userId || parent.id, name: parent.name, role: 'Parent' })}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-800 rounded-xl hover:bg-amber-50 cursor-pointer"
                                  >
                                    <KeyRound size={14} className="text-amber-600" /> Credentials
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedParentForChat(parent)
                                      setActiveTab('educhat')
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-800 rounded-xl hover:bg-emerald-50 cursor-pointer"
                                  >
                                    <MessageSquare size={14} className="text-emerald-600" /> Chat via EduChat
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1 border-slate-100" />
                                  <DropdownMenuItem
                                    onClick={() => setEditingParent(parent)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-800 rounded-xl hover:bg-blue-50 cursor-pointer"
                                  >
                                    <Edit3 size={14} className="text-blue-600" /> Edit Record
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeletingParent(parent)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 rounded-xl hover:bg-rose-50 cursor-pointer"
                                  >
                                    <Trash2 size={14} className="text-rose-600" /> Delete Record
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 px-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-slate-300">|</span>
                    <span>
                      Showing <strong className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalItems}</strong> parent records
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    
                    <div className="px-3.5 py-1.5 text-xs font-black text-slate-800 bg-slate-100 rounded-xl border border-slate-200/60">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARENT COMMUNICATION (EDUCHAT) */}
      {activeTab === 'educhat' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 1/3: Parent Chat Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-600" /> EduChat Channels
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{parents.length} Parents</span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Filter parent chat channel..."
                value={chatSearchQuery}
                onChange={e => setChatSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {parents
                .filter(p => !chatSearchQuery || p.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || p.relation.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParentForChat(p)}
                    className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border cursor-pointer ${
                      selectedParentForChat?.id === p.id
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-slate-50/60 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate">{p.name}</h4>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded uppercase">
                          {p.relation}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.mobileno || p.email || 'No contact info'}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Right 2/3: Live EduChat Window & Broadcast Box */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Chat Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[460px]">
              {/* Chat Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                    {selectedParentForChat?.name?.[0] || 'P'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      {selectedParentForChat?.name || 'Select a Parent'}
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    </h4>
                    <p className="text-[10px] text-emerald-300 font-semibold">
                      EduChat Channel • {selectedParentForChat?.relation || 'Parent'} ({selectedParentForChat?.mobileno || 'Online'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedParentForChat && loadChatMessages(selectedParentForChat.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Refresh conversation"
                  >
                    <RefreshCw size={13} className={isLoadingChat ? 'animate-spin' : ''} />
                  </button>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    EduChat Direct
                  </span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
                {isLoadingChat ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-slate-400">
                    <Loader2 className="animate-spin text-emerald-600" size={24} />
                    <p className="text-xs font-semibold">Loading EduChat thread...</p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-slate-400 text-center">
                    <MessageSquare size={28} className="text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No previous messages with {selectedParentForChat?.name || 'this parent'}.</p>
                    <p className="text-[11px] text-slate-400">Type a message below to start live conversation.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isAdmin = msg.senderType === 'ADMIN'
                    const isEditing = editingMessageId === msg.id

                    return (
                      <div key={msg.id} className={`flex flex-col group ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="relative max-w-[80%]">
                          {isEditing ? (
                            <div className="p-2.5 bg-white border border-emerald-300 rounded-2xl shadow-md space-y-2">
                              <textarea
                                rows={2}
                                value={editingMessageText}
                                onChange={e => setEditingMessageText(e.target.value)}
                                className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateChatMessage(msg.id)}
                                  disabled={isUpdatingMessage}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
                                >
                                  {isUpdatingMessage ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed transition shadow-2xs ${
                              isAdmin
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                            }`}>
                              {msg.message}

                              {/* CRUD Actions Bar on Hover */}
                              <div className={`absolute top-1 ${isAdmin ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-md z-10`}>
                                {isAdmin && (
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(msg.id)
                                      setEditingMessageText(msg.message)
                                    }}
                                    className="p-1 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                                    title="Edit message"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteChatMessage(msg.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] font-semibold text-slate-400">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.updatedAt && <span className="text-amber-600 font-bold">• Edited</span>}
                          {isAdmin ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/80">
                              <CheckCheck size={11} className={msg.isRead ? "text-blue-600" : "text-emerald-600"} />
                              <span className={msg.isRead ? "text-blue-700" : "text-emerald-700"}>
                                {msg.isRead ? 'Delivered & Read' : 'Delivered'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400">• Received</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Send direct EduChat message to ${selectedParentForChat?.name || 'parent'}...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 bg-slate-50"
                  disabled={!selectedParentForChat || isSendingChat}
                />
                <button
                  type="submit"
                  disabled={!selectedParentForChat || isSendingChat || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  {isSendingChat ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
                </button>
              </form>
            </div>

            {/* Broadcast Announcement Form */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={14} className="text-amber-500" /> Broadcast Parent Announcement
              </h3>
              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Audience</label>
                    <select
                      value={broadcastTarget}
                      onChange={e => setBroadcastTarget(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 cursor-pointer"
                    >
                      <option value="all">All School Parents</option>
                      <option value="primary">Primary Section Parents</option>
                      <option value="secondary">Secondary Section Parents</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Dispatch Channels</label>
                    <div className="flex items-center gap-3 pt-1 text-xs font-bold text-slate-700">
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked readOnly /> EduChat</label>
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked readOnly /> SMS</label>
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked readOnly /> Email</label>
                    </div>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Type urgent announcement or fee alert to dispatch..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-medium bg-slate-50"
                  required
                />

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isBroadcasting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Dispatch Broadcast
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY CONTACTS */}
      {activeTab === 'emergency' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="text-rose-600" size={20} />
            <div>
              <h3 className="font-black text-base text-slate-900">Emergency Contacts Directory</h3>
              <p className="text-xs text-slate-500 font-medium">Instant quick-dial emergency contacts for parent response, medical dispatches, and student safety.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {parents.slice(0, 6).map(p => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 uppercase">Emergency</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{p.relation} • {p.studentCount} Student linked</p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{p.mobileno || '+234 803 000 1122'}</span>
                  <a
                    href={`tel:${p.mobileno || ''}`}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                    title="Call Emergency Number"
                  >
                    <PhoneCall size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT PARENT MODAL */}
      {editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-blue-600" /> Edit Parent Record
              </h3>
              <button onClick={() => setEditingParent(null)} className="p-1 text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveParentEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingParent.name}
                  onChange={e => setEditingParent({ ...editingParent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                  <select
                    value={['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Sponsor'].includes(editingParent.relation || '') ? editingParent.relation : 'Other'}
                    onChange={e => {
                      const val = e.target.value
                      if (val !== 'Other') {
                        setEditingParent({ ...editingParent, relation: val })
                      } else if (['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Sponsor'].includes(editingParent.relation || '')) {
                        setEditingParent({ ...editingParent, relation: '' })
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer mb-1.5"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Other">Other (Type below)</option>
                  </select>

                  {(!['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Sponsor'].includes(editingParent.relation || '')) && (
                    <input
                      type="text"
                      placeholder="Specify custom relationship (e.g. Stepfather, Next of kin...)"
                      value={editingParent.relation || ''}
                      onChange={e => setEditingParent({ ...editingParent, relation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingParent.mobileno || ''}
                    onChange={e => setEditingParent({ ...editingParent, mobileno: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingParent.email || ''}
                  onChange={e => setEditingParent({ ...editingParent, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Occupation</label>
                <input
                  type="text"
                  value={editingParent.occupation || ''}
                  onChange={e => setEditingParent({ ...editingParent, occupation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editingParent.address || ''}
                  onChange={e => setEditingParent({ ...editingParent, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PARENT CONFIRMATION MODAL */}
      {deletingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Delete Parent Record</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              Are you sure you want to permanently delete parent record for <strong className="text-slate-900">{deletingParent.name}</strong>? Any linked students will be unlinked.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingParent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteParent}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE USER CREDENTIALS MODAL */}
      <UserCredentialModal
        userId={manageUserCredentials?.userId || null}
        userName={manageUserCredentials?.name || ''}
        roleName={manageUserCredentials?.role}
        isOpen={Boolean(manageUserCredentials)}
        onClose={() => setManageUserCredentials(null)}
      />
    </div>
  )
}
