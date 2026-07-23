'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'
import { FileText, FolderPlus, Download, Trash2, Plus, Sparkles, AlertCircle, Loader2 } from 'lucide-react'

interface MediaItem {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  classTier: string
  topic: string
  accessType: 'FREE' | 'PREMIUM'
  price: string | null
  createdAt: string
}

interface MediaLibraryProps {
  teacherId: number
}

export function MediaLibrary({ teacherId }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Upload Form State
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classTier, setClassTier] = useState('Primary')
  const [topic, setTopic] = useState('')
  const [accessType, setAccessType] = useState<'FREE' | 'PREMIUM'>('FREE')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // Filtering State
  const [filterTier, setFilterTier] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      // Backend route /api/teacher/media
      const res = await apiSlice.get<{ success: boolean; items: MediaItem[] }>(
        `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/media`
      )
      if (res.success) {
        setItems(res.items)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load media items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !topic) {
      alert('Please fill all required fields and select a file.')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('classTier', classTier)
    formData.append('topic', topic)
    formData.append('accessType', accessType)
    if (accessType === 'PREMIUM' && price) {
      formData.append('price', price)
    }
    formData.append('file', file)

    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/media`
      const token = safeStorage.getItem('ugbekun_token') || ''
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const res = await response.json()
      if (res.success) {
        setShowUploadModal(false)
        setTitle('')
        setDescription('')
        setTopic('')
        setPrice('')
        setFile(null)
        fetchMedia()
      } else {
        setError(res.message || 'Upload failed.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload media item.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    setError(null)
    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/media/${itemId}`
      const res = await apiSlice.delete<{ success: boolean; message?: string }>(url)
      if (res.success) {
        fetchMedia()
      } else {
        setError(res.message || 'Failed to delete resource.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete resource.')
    }
  }

  const filteredItems = items.filter(item => {
    const matchesTier = filterTier === 'ALL' || item.classTier === filterTier
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.topic.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTier && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-teal-800 via-emerald-700 to-green-800 p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-white/25 rounded-full border border-white/30 shadow-sm inline-block">
              Resources Workspace
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Managed Media Library</h1>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Share structured reference documents, notes, workbooks, and videos with class tiers.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <FolderPlus size={15} /> Upload Resource
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'Preschool', 'Primary', 'Secondary'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap cursor-pointer ${
                filterTier === tier
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs gap-3">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading resources...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <FileText className="mx-auto text-slate-300 mb-3" size={32} />
          <h3 className="font-extrabold text-slate-800 text-base">No Resources Found</h3>
          <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto mt-1">
            No media library documents match the filters. Share worksheets or textbooks today!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100 uppercase tracking-wide">
                    {item.classTier}
                  </span>
                  {item.accessType === 'PREMIUM' ? (
                    <span className="px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded-md border border-amber-100 shadow-3xs" title="Premium subscription or fee item">
                      ⭐ Premium {item.price ? `(₦${item.price})` : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-md">
                      Free Item
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{item.topic}</p>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : 'N/A'} • {item.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
                
                <div className="flex gap-2">
                  <a
                    href={`http://localhost:5001${item.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition"
                    title="Download/View File"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition cursor-pointer"
                    title="Delete Resource"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-emerald-700">
              <FolderPlus size={20} />
              <h3 className="text-base font-black">Upload Resource to Library</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Primary 2 Mathematics Worksheet"
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize file details..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Class Tier *</label>
                  <select
                    value={classTier}
                    onChange={(e) => setClassTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Preschool">Preschool</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Topic / Area *</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Algebra"
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Access Tier *</label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>

                {accessType === 'PREMIUM' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Price (₦)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FolderPlus size={13} />
                      Save Resource
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
