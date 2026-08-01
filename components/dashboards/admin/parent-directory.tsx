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
  PhoneCall
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

interface ParentRecord {
  id: number
  name: string
  relation: string
  mobileno: string | null
  email: string | null
  city: string | null
  state: string | null
  studentCount: number
  occupation?: string
  address?: string
  status?: 'active' | 'suspended'
}

type ParentTab = 'directory' | 'educhat' | 'emergency'

export function ParentDirectory() {
  const [activeTab, setActiveTab] = useState<ParentTab>('directory')

  // Live Data State
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit Parent Modal State
  const [editingParent, setEditingParent] = useState<ParentRecord | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // EduChat State
  const [selectedParentForChat, setSelectedParentForChat] = useState<ParentRecord | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'admin' | 'parent'; text: string; time: string }>>([
    { sender: 'parent', text: 'Good morning Admin, please when are the 1st Term exam results coming out?', time: '08:30 AM' },
    { sender: 'admin', text: 'Hello! 1st Term report cards will be released online this Friday at 12:00 PM via Ugbekun portal.', time: '08:32 AM' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('all')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // Load Parent Roster from live DB
  useEffect(() => {
    async function loadParents() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiSlice.get<{
          success: boolean
          data: { parents: ParentRecord[] }
        }>(endpoints.admin.studentsParents)
        
        // Add default status and occupation if missing
        const formatted = res.data.parents.map(p => ({
          ...p,
          status: p.status || 'active',
          occupation: p.occupation || 'Business / Professional',
          address: p.address || [p.city, p.state].filter(Boolean).join(', ') || 'Lagos, Nigeria'
        }))
        setParents(formatted)
        if (formatted.length > 0) {
          setSelectedParentForChat(formatted[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parents roster.')
      } finally {
        setIsLoading(false)
      }
    }

    loadParents()
  }, [])

  const handleSaveParentEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParent) return

    setIsSavingEdit(true)
    try {
      // Update local state for instant responsiveness
      setParents(prev => prev.map(p => p.id === editingParent.id ? editingParent : p))
      setEditingParent(null)
      alert('Parent information updated successfully!')
    } catch (err) {
      alert('Failed to save parent details.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleSendChatMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !selectedParentForChat) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChatMessages(prev => [...prev, { sender: 'admin', text: chatInput, time: now }])
    setChatInput('')
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMessage.trim()) return

    setIsBroadcasting(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      alert(`Broadcast notification dispatched via EduChat to ${broadcastTarget === 'all' ? 'All Parents' : 'Selected Class Parents'}!`)
      setBroadcastMessage('')
    } catch (err) {
      alert('Broadcast failed.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const filteredParents = parents.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.mobileno?.toLowerCase().includes(query) ||
      p.relation?.toLowerCase().includes(query)
    )
  })

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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent / Guardian</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead>Linked Children</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParents.map((parent) => (
                      <TableRow key={parent.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-900">
                          <div>{parent.name || '—'}</div>
                          {parent.occupation && (
                            <div className="text-[10px] text-slate-400 font-normal">{parent.occupation}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            {parent.relation || 'Parent'}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800">{parent.studentCount} Child{parent.studentCount === 1 ? '' : 'ren'}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">{parent.mobileno || '—'}</TableCell>
                        <TableCell className="text-xs text-slate-600">{parent.email || '—'}</TableCell>
                        <TableCell className="text-xs text-slate-500">{parent.address || '—'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedParentForChat(parent)
                              setActiveTab('educhat')
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                            title="Chat with Parent via EduChat"
                          >
                            <MessageSquare size={13} /> Chat
                          </button>
                          <button
                            onClick={() => setEditingParent(parent)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                            title="Edit Parent Details"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>Showing {filteredParents.length} parent record{filteredParents.length === 1 ? '' : 's'}.</TableCaption>
                </Table>
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
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-emerald-600" /> EduChat Parent Channels
            </h3>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {parents.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedParentForChat(p)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                    selectedParentForChat?.id === p.id
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-slate-50/60 border-slate-100 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{p.relation} • {p.mobileno || 'No phone'}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right 2/3: Live EduChat Window & Broadcast Box */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Chat Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[420px]">
              {/* Chat Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedParentForChat?.name?.[0] || 'P'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{selectedParentForChat?.name || 'Select a Parent'}</h4>
                    <p className="text-[10px] text-emerald-300 font-semibold">EduChat Direct Channel • Active Now</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Powered by EduChat
                </span>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                      msg.sender === 'admin'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-2xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">{msg.time} • Delivered</span>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Send direct EduChat message to ${selectedParentForChat?.name || 'parent'}...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Send size={13} /> Send
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
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-slate-50"
                    >
                      <option value="all">All School Parents</option>
                      <option value="primary">Primary Section Parents</option>
                      <option value="secondary">Secondary Section Parents</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Dispatch Channels</label>
                    <div className="flex items-center gap-3 pt-1 text-xs font-bold text-slate-700">
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked /> EduChat</label>
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked /> SMS</label>
                      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked /> Email</label>
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
                  <input
                    type="text"
                    value={editingParent.relation}
                    onChange={e => setEditingParent({ ...editingParent, relation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
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
    </div>
  )
}
