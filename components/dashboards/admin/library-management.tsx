'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Sparkles,
  Calendar,
  User,
  Check,
  RotateCcw,
  Book,
  Download,
  Trash2,
  ExternalLink,
  Layers,
  Clock,
  ShieldCheck,
  PlayCircle
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

export interface LibraryResource {
  id: number
  title: string
  author: string
  isbn?: string | null
  category: string
  type: 'PHYSICAL_BOOK' | 'ONLINE_EBOOK' | 'STUDY_VIDEO'
  totalCopies: number
  availableCopies: number
  fileUrl?: string | null
  videoUrl?: string | null
  description?: string | null
  isAiGenerated: boolean
  createdAt: string
  issues?: { id: number; borrowerName: string; dueDate: string }[]
}

export interface LibraryIssue {
  id: number
  resourceId: number
  borrowerId: number
  borrowerType: 'STUDENT' | 'STAFF'
  borrowerName: string
  borrowerRole?: string | null
  issueDate: string
  dueDate: string
  returnDate?: string | null
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE'
  remarks?: string | null
  resource: {
    id: number
    title: string
    author: string
    isbn?: string | null
    type: string
  }
}

export function LibraryManagement() {
  const [activeTab, setActiveTab] = useState<'physical' | 'ebooks' | 'videos' | 'issues'>('physical')

  const [resources, setResources] = useState<LibraryResource[]>([])
  const [issues, setIssues] = useState<LibraryIssue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Modals
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [resourceType, setResourceType] = useState<'PHYSICAL_BOOK' | 'ONLINE_EBOOK' | 'STUDY_VIDEO'>('PHYSICAL_BOOK')
  const [resourceForm, setResourceForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Mathematics',
    totalCopies: 5,
    fileUrl: '',
    videoUrl: '',
    description: ''
  })

  // Issue Book Modal
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<LibraryResource | null>(null)
  const [issueForm, setIssueForm] = useState({
    borrowerName: '',
    borrowerType: 'STUDENT',
    borrowerRole: 'JSS 1 Student',
    dueDate: '',
    remarks: ''
  })

  // AI E-Book Draft Modal
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiForm, setAiForm] = useState({
    topic: '',
    subject: 'Mathematics',
    gradeLevel: 'Secondary School',
    guidance: ''
  })
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiDraftContent, setAiDraftContent] = useState('')

  // View E-Book Modal
  const [viewingEbook, setViewingEbook] = useState<LibraryResource | null>(null)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchResources()
    fetchIssues()
  }, [])

  const fetchResources = async () => {
    setIsLoading(true)
    try {
      const res = await apiSlice.get<{ success: boolean; data: LibraryResource[] }>(endpoints.admin.libraryResources)
      if (res.success) setResources(res.data || [])
    } catch (e: any) {
      console.error('Failed to fetch library resources:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIssues = async () => {
    try {
      const res = await apiSlice.get<{ success: boolean; data: LibraryIssue[] }>(endpoints.admin.libraryIssues)
      if (res.success) setIssues(res.data || [])
    } catch (e: any) {
      console.error('Failed to fetch library issues:', e)
    }
  }

  // Handlers
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiSlice.post(endpoints.admin.libraryResources, {
        ...resourceForm,
        type: resourceType,
        totalCopies: parseInt(String(resourceForm.totalCopies), 10) || 1
      })
      setFeedback({ type: 'success', message: 'Library resource added successfully.' })
      setShowResourceModal(false)
      fetchResources()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add resource.' })
    }
  }

  const handleIssueBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBook) return
    try {
      await apiSlice.post(endpoints.admin.libraryIssues, {
        ...issueForm,
        resourceId: selectedBook.id
      })
      setFeedback({ type: 'success', message: `Book "${selectedBook.title}" issued to ${issueForm.borrowerName}.` })
      setShowIssueModal(false)
      setSelectedBook(null)
      fetchResources()
      fetchIssues()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to issue book.' })
    }
  }

  const handleReturnBook = async (issueId: number) => {
    try {
      await apiSlice.put(endpoints.admin.returnLibraryBook(issueId), {})
      setFeedback({ type: 'success', message: 'Book marked as returned. Available stock restored.' })
      fetchResources()
      fetchIssues()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process return.' })
    }
  }

  const handleDeleteResource = async (id: number) => {
    if (!confirm('Are you sure you want to remove this resource from the library?')) return
    try {
      await apiSlice.delete(endpoints.admin.deleteLibraryResource(id))
      setFeedback({ type: 'success', message: 'Resource removed successfully.' })
      fetchResources()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete resource.' })
    }
  }

  // AI E-Book Generation Handler
  const handleGenerateAiEbook = async () => {
    if (!aiForm.topic || !aiForm.subject) {
      setFeedback({ type: 'error', message: 'Topic and Subject are required for AI drafting.' })
      return
    }
    setIsGeneratingAi(true)
    try {
      const res = await apiSlice.post<{ success: boolean; draftContent: string }>(endpoints.admin.aiEbookDraft, aiForm)
      if (res.success) {
        setAiDraftContent(res.draftContent)
        setFeedback({ type: 'success', message: 'AI e-book study content generated successfully.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate AI e-book draft.' })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSaveAiEbookResource = async () => {
    if (!aiDraftContent) return
    try {
      await apiSlice.post(endpoints.admin.libraryResources, {
        title: `${aiForm.topic} (${aiForm.subject} Study Guide)`,
        author: 'AI Curriculum Assistant',
        category: aiForm.subject,
        type: 'ONLINE_EBOOK',
        totalCopies: 999,
        description: aiDraftContent,
        isAiGenerated: true
      })
      setFeedback({ type: 'success', message: 'AI generated study e-book saved to library.' })
      setShowAiModal(false)
      setAiDraftContent('')
      fetchResources()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save AI e-book.' })
    }
  }

  // Categorized resources
  const physicalBooks = resources.filter((r) => r.type === 'PHYSICAL_BOOK')
  const onlineEbooks = resources.filter((r) => r.type === 'ONLINE_EBOOK')
  const studyVideos = resources.filter((r) => r.type === 'STUDY_VIDEO')
  const activeIssues = issues.filter((i) => i.status === 'ISSUED' || i.status === 'OVERDUE')

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen size={16} /> Library & E-Learning Resource Suite
          </div>
          <h1 className="text-2xl font-bold text-slate-900">School Library & Digital Study Hub</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage physical book catalogs, book issuing/returns, online e-books, study video lectures, and AI e-book drafting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} /> Draft E-Book (AI)
          </button>
          <button
            onClick={() => {
              setResourceType('PHYSICAL_BOOK')
              setShowResourceModal(true)
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Upload / Add Resource
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Book size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{physicalBooks.length}</div>
            <div className="text-xs font-medium text-indigo-800">Physical Books in Stock</div>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeIssues.length}</div>
            <div className="text-xs font-medium text-amber-800">Currently Issued Books</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{onlineEbooks.length}</div>
            <div className="text-xs font-medium text-blue-800">Hosted Online E-Books</div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Video size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{studyVideos.length}</div>
            <div className="text-xs font-medium text-emerald-800">Study Video Lectures</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('physical')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'physical' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Book size={18} /> Physical Books ({physicalBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('ebooks')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'ebooks' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} /> Online E-Books & AI ({onlineEbooks.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'videos' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Video size={18} /> Study Video Library ({studyVideos.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'issues' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={18} /> Book Issuing & Return Log ({issues.length})
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PHYSICAL BOOKS CATALOG */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'physical' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by book title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                setResourceType('PHYSICAL_BOOK')
                setShowResourceModal(true)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Add Physical Book
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicalBooks.map((book) => (
              <div key={book.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                      {book.category}
                    </span>
                    <button
                      onClick={() => handleDeleteResource(book.id)}
                      className="text-slate-300 hover:text-rose-600 transition"
                      title="Remove Book"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{book.title}</h3>
                  <div className="text-xs text-slate-500 font-medium">By {book.author}</div>
                  {book.isbn && <div className="text-[11px] font-mono text-slate-400">ISBN: {book.isbn}</div>}
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Available Stock:</span>
                    <span className={`font-bold ${book.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {book.availableCopies} / {book.totalCopies} Copies
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBook(book)
                      setIssueForm({
                        borrowerName: '',
                        borrowerType: 'STUDENT',
                        borrowerRole: 'Grade 5 Student',
                        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                        remarks: ''
                      })
                      setShowIssueModal(true)
                    }}
                    disabled={book.availableCopies <= 0}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen size={14} /> {book.availableCopies > 0 ? 'Issue Book to Student/Staff' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: ONLINE E-BOOKS & AI STUDIO */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ebooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Hosted Digital E-Books & AI Textbooks</div>
            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles size={16} /> Draft E-Book with AI
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineEbooks.map((book) => (
              <div key={book.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                      {book.isAiGenerated && <Sparkles size={12} />} {book.category}
                    </span>
                    <button onClick={() => handleDeleteResource(book.id)} className="text-slate-300 hover:text-rose-600 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{book.title}</h3>
                  <div className="text-xs text-slate-500 font-medium">Author: {book.author}</div>
                  {book.description && (
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono line-clamp-3 border">
                      {book.description}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <button
                    onClick={() => setViewingEbook(book)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen size={14} /> Read Online E-Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: STUDY VIDEO LIBRARY */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Educational Video Lectures & Tutorial Content</div>
            <button
              onClick={() => {
                setResourceType('STUDY_VIDEO')
                setShowResourceModal(true)
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Add Study Video
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyVideos.map((video) => (
              <div key={video.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Video size={12} /> {video.category}
                    </span>
                    <button onClick={() => handleDeleteResource(video.id)} className="text-slate-300 hover:text-rose-600 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{video.title}</h3>
                  <div className="text-xs text-slate-500 font-medium">Instructor / Source: {video.author}</div>
                  {video.description && <p className="text-xs text-slate-600 line-clamp-2">{video.description}</p>}
                </div>

                <div className="pt-3 border-t">
                  {video.videoUrl ? (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlayCircle size={16} /> Watch Video Lecture <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div className="text-xs text-slate-400 text-center font-medium">No Video URL attached</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: ISSUANCE & RETURN LOG DESK */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">Borrower Audit Trail & Overdue Tracker</div>
            <button onClick={fetchIssues} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition">
              Refresh Audit Log
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                    <th className="p-4">Book Title</th>
                    <th className="p-4">Borrower Name</th>
                    <th className="p-4">Borrower Role</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{iss.resource?.title}</td>
                      <td className="p-4 font-bold text-indigo-700">{iss.borrowerName}</td>
                      <td className="p-4 text-slate-500">{iss.borrowerRole || iss.borrowerType}</td>
                      <td className="p-4 text-slate-600">{new Date(iss.issueDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-slate-700">{new Date(iss.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            iss.status === 'RETURNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : iss.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iss.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {iss.status !== 'RETURNED' && (
                          <button
                            onClick={() => handleReturnBook(iss.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <RotateCcw size={12} /> Mark as Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ALL MODAL OVERLAYS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}

      {/* MODAL 1: ADD RESOURCE (PHYSICAL / EBOOK / VIDEO) */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Library Resource</h2>
              <button onClick={() => setShowResourceModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resource Format *</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="PHYSICAL_BOOK">Physical Book (In Library)</option>
                  <option value="ONLINE_EBOOK">Online E-Book (Digital Text/PDF)</option>
                  <option value="STUDY_VIDEO">Study Video Lecture</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Title / Book Name *"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Author / Publisher *"
                  value={resourceForm.author}
                  onChange={(e) => setResourceForm({ ...resourceForm, author: e.target.value })}
                  required
                  className="p-2.5 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Science)"
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              {resourceType === 'PHYSICAL_BOOK' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ISBN (Optional)"
                    value={resourceForm.isbn}
                    onChange={(e) => setResourceForm({ ...resourceForm, isbn: e.target.value })}
                    className="p-2.5 border rounded-xl"
                  />
                  <input
                    type="number"
                    placeholder="Total Stock Copies"
                    value={resourceForm.totalCopies}
                    onChange={(e) => setResourceForm({ ...resourceForm, totalCopies: parseInt(e.target.value, 10) })}
                    className="p-2.5 border rounded-xl"
                  />
                </div>
              )}

              {resourceType === 'STUDY_VIDEO' && (
                <input
                  type="url"
                  placeholder="Video URL (e.g. YouTube, Vimeo, MP4 link) *"
                  value={resourceForm.videoUrl}
                  onChange={(e) => setResourceForm({ ...resourceForm, videoUrl: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              )}

              <textarea
                rows={3}
                placeholder="Short Description / Summary..."
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowResourceModal(false)} className="px-4 py-2 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE BOOK TO BORROWER */}
      {showIssueModal && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Issue Physical Book</h2>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-indigo-900">{selectedBook.title}</div>
              <div className="text-indigo-700">Author: {selectedBook.author}</div>
              <div className="text-emerald-700 font-bold">Available Stock: {selectedBook.availableCopies} Copy(ies)</div>
            </div>

            <form onSubmit={handleIssueBookSubmit} className="space-y-3 text-xs font-medium">
              <input
                type="text"
                placeholder="Borrower Full Name *"
                value={issueForm.borrowerName}
                onChange={(e) => setIssueForm({ ...issueForm, borrowerName: e.target.value })}
                required
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={issueForm.borrowerType}
                  onChange={(e) => setIssueForm({ ...issueForm, borrowerType: e.target.value as any })}
                  className="p-2.5 border rounded-xl"
                >
                  <option value="STUDENT">Student Borrower</option>
                  <option value="STAFF">Staff / Teacher</option>
                </select>
                <input
                  type="text"
                  placeholder="Role / Class (e.g. Grade 5)"
                  value={issueForm.borrowerRole}
                  onChange={(e) => setIssueForm({ ...issueForm, borrowerRole: e.target.value })}
                  className="p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Return Due Date *</label>
                <input
                  type="date"
                  value={issueForm.dueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Remarks (Optional)..."
                value={issueForm.remarks}
                onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer">
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AI E-BOOK DRAFTING STUDIO */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} /> AI E-Book Content Drafting Studio
              </h2>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subject *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={aiForm.subject}
                    onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chapter Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g. Algebraic Equations"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Grade / Class Level</label>
                <input
                  type="text"
                  placeholder="e.g. JSS 1 / Grade 7"
                  value={aiForm.gradeLevel}
                  onChange={(e) => setAiForm({ ...aiForm, gradeLevel: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateAiEbook}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} /> {isGeneratingAi ? 'Generating E-Book Content...' : 'Generate E-Book Chapter (AI)'}
                </button>
              </div>

              {aiDraftContent && (
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Generated E-Book Chapter (Editable)</label>
                  <textarea
                    rows={8}
                    value={aiDraftContent}
                    onChange={(e) => setAiDraftContent(e.target.value)}
                    className="w-full p-3 border rounded-xl font-mono text-[11px] bg-slate-50"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAiModal(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                {aiDraftContent && (
                  <button
                    type="button"
                    onClick={handleSaveAiEbookResource}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Save E-Book to Library
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: READ ONLINE E-BOOK VIEWER */}
      {viewingEbook && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewingEbook.title}</h2>
                <div className="text-xs text-slate-500 font-semibold">Author: {viewingEbook.author}</div>
              </div>
              <button onClick={() => setViewingEbook(null)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {viewingEbook.description || 'No digital content text attached.'}
            </div>

            <div className="flex justify-end border-t pt-3">
              <button onClick={() => setViewingEbook(null)} className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
