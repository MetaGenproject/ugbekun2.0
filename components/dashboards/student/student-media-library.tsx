'use client'

import { useState, useEffect } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { FileText, Download, Sparkles, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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
}

export function StudentMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<MediaItem | null>(null)
  const [unlockedItems, setUnlockedItems] = useState<number[]>([]) // track mocked purchases locally
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      // Endpoint /api/student/media
      const url = `${endpoints.student.profile.split('/profile')[0]}/media`
      const res = await apiSlice.get<{ success: boolean; items: MediaItem[] }>(url)
      if (res.success) {
        setItems(res.items)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load library resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUnlockClick = (item: MediaItem) => {
    setCheckoutItem(item)
    setShowCheckout(true)
  }

  const handleProcessPayment = () => {
    if (!checkoutItem) return
    setIsProcessingPayment(true)
    setTimeout(() => {
      setUnlockedItems(prev => [...prev, checkoutItem.id])
      setIsProcessingPayment(false)
      setShowCheckout(false)
      setCheckoutItem(null)
      alert(`Successfully unlocked "${checkoutItem.title}"!`)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-white/25 rounded-full border border-white/30 shadow-sm inline-block">
            Academy Library
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Study Media Center</h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Access free study worksheets, textbook notes, and premium guides unlocked by your class instructor.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs gap-3">
          <Loader2 size={24} className="animate-spin text-purple-600" />
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Browsing catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <FileText className="mx-auto text-slate-300 mb-3" size={32} />
          <h3 className="font-extrabold text-slate-800 text-base">No Class Resources Available</h3>
          <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto mt-1">
            Your form teacher has not uploaded resource files for this class tier yet.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isUnlocked = item.accessType === 'FREE' || unlockedItems.includes(item.id)

            return (
              <div key={item.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:shadow-sm transition">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                      {item.topic}
                    </span>
                    {item.accessType === 'PREMIUM' ? (
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                        isUnlocked 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {isUnlocked ? '🔓 Unlocked' : `⭐ Premium (₦${item.price || '0'})`}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-md">
                        Free Access
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {item.mimeType?.split('/')[1] || 'DOC'} • {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : 'N/A'}
                  </span>

                  {isUnlocked ? (
                    <a
                      href={`http://localhost:5001${item.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-3xs transition"
                    >
                      <Download size={12} /> Open Resource
                    </a>
                  ) : (
                    <button
                      onClick={() => handleUnlockClick(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black shadow-3xs transition cursor-pointer"
                    >
                      <CreditCard size={12} /> Unlock Resource
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Checkout Modal Dialog */}
      {showCheckout && checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200 text-slate-800">
            <div className="flex items-center gap-2 text-indigo-700 border-b border-slate-100 pb-3">
              <Sparkles size={20} className="text-amber-500 animate-pulse" />
              <h3 className="text-base font-black">Unlock Premium Study Material</h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                You are about to unlock premium resource material. To mock checkout payment and authorize download:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="text-xs font-black text-slate-800">{checkoutItem.title}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{checkoutItem.topic} • Class Tier: {checkoutItem.classTier}</p>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-black text-slate-900">
                <span>Total Due:</span>
                <span className="text-amber-600 font-black">₦{checkoutItem.price}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                disabled={isProcessingPayment}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <CreditCard size={13} />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
