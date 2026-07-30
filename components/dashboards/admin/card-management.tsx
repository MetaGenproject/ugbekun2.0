'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard,
  Layers,
  UserPlus,
  Search,
  Download,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Palette,
  Eye,
  Save,
  RefreshCw,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Sparkles,
  QrCode,
  AlertTriangle,
  School,
  Hash,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { toast } from 'sonner'

interface CardTemplate {
  schoolName: string
  branchName: string
  logo: string | null
  primaryColor: string
  secondaryColor: string
  layoutType: 'classic' | 'modern' | 'minimal'
}

interface CardStats {
  totalCards: number
  activeCards: number
  revokedCards: number
}

interface IdCardEntry {
  id: number
  entityType: 'student' | 'staff'
  cardNumber: string
  verifyToken: string
  status: 'active' | 'revoked'
  issuedAt: string
  expiresAt: string | null
  revokedAt: string | null
  revokedReason: string | null
  name: string
  photo: string | null
  role: string
}

interface ClassOption {
  id: number
  name: string
  sections: { section: { id: number; name: string } }[]
}

function CardPreview({
  template,
  sample,
}: {
  template: CardTemplate
  sample: { name: string; role: string; cardNo: string; type: 'student' | 'staff' }
}) {
  const { primaryColor, secondaryColor, layoutType, schoolName } = template

  if (layoutType === 'modern') {
    return (
      <div
        className="relative w-[260px] h-[160px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col h-full p-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-white/90 tracking-widest uppercase">{schoolName}</span>
            <span className="text-[8px] font-bold text-white/70 bg-white/20 px-1.5 py-0.5 rounded-full">
              {sample.type === 'student' ? 'Student' : 'Staff'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-auto">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
              {sample.type === 'student' ? <School size={18} className="text-white" /> : <Briefcase size={18} className="text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-[11px] leading-tight truncate">{sample.name}</p>
              <p className="text-white/70 text-[9px] font-semibold mt-0.5">{sample.role}</p>
            </div>
            <div className="ml-auto"><QrCode size={28} className="text-white/60" /></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[8px] text-white/60 font-mono">{sample.cardNo}</span>
            <span className="text-[8px] text-white/50">Valid 2025–2026</span>
          </div>
        </div>
      </div>
    )
  }

  if (layoutType === 'minimal') {
    return (
      <div className="relative w-[260px] h-[160px] rounded-2xl shadow-2xl overflow-hidden bg-white border-2 flex flex-col"
        style={{ borderColor: primaryColor }}
      >
        <div className="h-1.5 w-full" style={{ background: primaryColor }} />
        <div className="flex flex-col h-full p-4 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: primaryColor }}>{schoolName}</span>
            <span className="text-[8px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full">
              {sample.type === 'student' ? 'Student ID' : 'Staff ID'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
              style={{ borderColor: secondaryColor, background: `${primaryColor}15` }}>
              {sample.type === 'student' ? <School size={20} style={{ color: primaryColor }} /> : <Briefcase size={20} style={{ color: primaryColor }} />}
            </div>
            <div>
              <p className="font-black text-[12px] text-slate-800 leading-tight">{sample.name}</p>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{sample.role}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-[8px] text-slate-400 font-mono">{sample.cardNo}</span>
            <QrCode size={22} style={{ color: primaryColor }} className="opacity-60" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-[260px] h-[160px] rounded-2xl shadow-2xl overflow-hidden flex"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${secondaryColor} 60%, #000 120%)` }}
    >
      <div className="w-10 h-full flex flex-col items-center justify-center gap-2 bg-black/20 border-r border-white/10 flex-shrink-0">
        {sample.type === 'student' ? <School size={14} className="text-white/70" /> : <Briefcase size={14} className="text-white/70" />}
        <div className="h-16 w-px bg-white/20" />
        <QrCode size={14} className="text-white/60" />
      </div>
      <div className="flex flex-col flex-1 p-3">
        <span className="text-[8px] font-black text-white/80 tracking-widest uppercase leading-tight line-clamp-1">{schoolName}</span>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/20">
            {sample.type === 'student' ? <School size={16} className="text-white" /> : <Briefcase size={16} className="text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-[11px] leading-tight truncate">{sample.name}</p>
            <p className="text-white/70 text-[9px] font-semibold">{sample.role}</p>
          </div>
        </div>
        <div className="mt-auto pt-2 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[7px] font-bold uppercase tracking-widest">Card No.</p>
            <p className="text-white font-mono text-[8px] font-bold">{sample.cardNo}</p>
          </div>
          <span className="text-[8px] text-white/50">2025–2026</span>
        </div>
      </div>
    </div>
  )
}

export function CardManagement() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'designer' | 'provision'>('ledger')
  const [template, setTemplate] = useState<CardTemplate>({
    schoolName: 'My School', branchName: 'Main Campus', logo: null,
    primaryColor: '#1b5e20', secondaryColor: '#2e7d32', layoutType: 'classic',
  })
  const [stats, setStats] = useState<CardStats>({ totalCards: 0, activeCards: 0, revokedCards: 0 })
  const [loadingTemplate, setLoadingTemplate] = useState(true)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [draftColor1, setDraftColor1] = useState('#1b5e20')
  const [draftColor2, setDraftColor2] = useState('#2e7d32')
  const [draftLayout, setDraftLayout] = useState<'classic' | 'modern' | 'minimal'>('classic')
  const [previewType, setPreviewType] = useState<'student' | 'staff'>('student')
  const [cards, setCards] = useState<IdCardEntry[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [revokingCard, setRevokingCard] = useState<IdCardEntry | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [isRevoking, setIsRevoking] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [provisioning, setProvisioning] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)

  useEffect(() => { loadTemplate() }, [])
  useEffect(() => { if (activeTab === 'ledger') loadCards() }, [activeTab, page, filterStatus, filterType])
  useEffect(() => { if (activeTab === 'provision' && classes.length === 0) loadClasses() }, [activeTab])
  useEffect(() => {
    if (activeTab === 'designer') {
      setDraftColor1(template.primaryColor)
      setDraftColor2(template.secondaryColor)
      setDraftLayout(template.layoutType)
    }
  }, [activeTab])

  const loadTemplate = async () => {
    setLoadingTemplate(true)
    try {
      const res = await apiSlice.get<{ success: boolean; template: CardTemplate; stats: CardStats }>(endpoints.admin.cardTemplate)
      if (res.success) {
        setTemplate(res.template)
        setStats(res.stats)
        setDraftColor1(res.template.primaryColor)
        setDraftColor2(res.template.secondaryColor)
        setDraftLayout(res.template.layoutType)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load card template.')
    } finally {
      setLoadingTemplate(false)
    }
  }

  const loadCards = async () => {
    setLoadingCards(true)
    try {
      const q = `?page=${page}&limit=12&search=${encodeURIComponent(search)}` + (filterStatus ? `&status=${filterStatus}` : '') + (filterType ? `&entityType=${filterType}` : '')
      const res = await apiSlice.get<{ success: boolean; data: IdCardEntry[]; pagination: { totalPages: number; total: number } }>(endpoints.admin.idCards(q))
      setCards(res.data || [])
      setTotalPages(res.pagination?.totalPages || 1)
      setTotalCount(res.pagination?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load ID cards.')
    } finally {
      setLoadingCards(false)
    }
  }

  const loadClasses = async () => {
    setLoadingClasses(true)
    try {
      const res = await apiSlice.get<{ success: boolean; classes: ClassOption[] }>(endpoints.admin.classesSections)
      setClasses(res.classes || [])
    } catch { toast.error('Failed to load classes.') } finally { setLoadingClasses(false) }
  }

  const handleSaveTemplate = async () => {
    setSavingTemplate(true)
    try {
      const res = await apiSlice.put<{ success: boolean; message: string }>(endpoints.admin.cardTemplate, { primaryColor: draftColor1, secondaryColor: draftColor2, layoutType: draftLayout })
      if (res.success) {
        setTemplate((prev) => ({ ...prev, primaryColor: draftColor1, secondaryColor: draftColor2, layoutType: draftLayout }))
        toast.success(res.message || 'Template saved!')
      }
    } catch (err: any) { toast.error(err.message || 'Failed to save template.') } finally { setSavingTemplate(false) }
  }

  const handleRevoke = async () => {
    if (!revokingCard) return
    setIsRevoking(true)
    try {
      const res = await apiSlice.put<{ success: boolean; message: string }>(endpoints.admin.revokeIdCard(revokingCard.id), { reason: revokeReason })
      toast.success(res.message || 'Card revoked.')
      setRevokingCard(null); setRevokeReason('')
      loadCards(); loadTemplate()
    } catch (err: any) { toast.error(err.message || 'Revocation failed.') } finally { setIsRevoking(false) }
  }

  const handleDownload = (card: IdCardEntry) => {
    toast.info(`Preparing card for ${card.name}…`)
    apiSlice.download(endpoints.admin.downloadIdCard(card.id), `ID_Card_${card.cardNumber.replace(/\//g, '_')}.pdf`).catch((err) => toast.error(err.message || 'Download failed.'))
  }

  const handleBatchProvision = async () => {
    if (!selectedClassId || !selectedSectionId) { toast.error('Please select both a class and a section.'); return }
    setProvisioning(true)
    try {
      const res = await apiSlice.post<{ success: boolean; message: string }>(endpoints.admin.provisionBatchIdCard, { classId: parseInt(selectedClassId, 10), sectionId: parseInt(selectedSectionId, 10) })
      toast.success(res.message || 'Batch provisioning complete.')
      setSelectedClassId(''); setSelectedSectionId('')
      loadTemplate()
    } catch (err: any) { toast.error(err.message || 'Batch provisioning failed.') } finally { setProvisioning(false) }
  }

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadCards() }
  const selectedClass = classes.find((c) => String(c.id) === selectedClassId)
  const availableSections = selectedClass?.sections || []
  const draftPreviewTemplate: CardTemplate = { ...template, primaryColor: draftColor1, secondaryColor: draftColor2, layoutType: draftLayout }
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl"
        style={{ background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 60%, #0f172a 100%)` }}>
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-white/90 border border-white/20">
              <CreditCard size={13} className="text-white" />
              Identity &amp; Card Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Card Management Desk</h1>
            <p className="text-white/70 text-sm max-w-xl">Design, issue, track, and revoke school ID cards for students and staff with a fully branded card template.</p>
          </div>
          {loadingTemplate ? (
            <div className="ml-auto flex items-center gap-2 text-white/60"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : (
            <div className="ml-auto flex gap-3 flex-wrap">
              {[
                { label: 'Total Issued', value: stats.totalCards, extra: 'bg-white/15' },
                { label: 'Active', value: stats.activeCards, extra: 'bg-emerald-500/20' },
                { label: 'Revoked', value: stats.revokedCards, extra: 'bg-rose-500/20' },
              ].map((s) => (
                <div key={s.label} className={`${s.extra} backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/10`}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] font-semibold text-white/70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
        {([
          { id: 'ledger', label: 'Card Ledger', icon: Layers },
          { id: 'designer', label: 'Card Designer', icon: Palette },
          { id: 'provision', label: 'Issue Cards', icon: UserPlus },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ───────────────────── LEDGER TAB ───────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by name or card number…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500">
              <option value="">All Types</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition cursor-pointer" style={{ background: template.primaryColor }}>Search</button>
            <button type="button" onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setPage(1); setTimeout(loadCards, 50) }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer">
              <RefreshCw size={13} />
            </button>
          </form>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">Showing <strong>{cards.length}</strong> of <strong>{totalCount}</strong> ID cards</p>
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
          </div>

          {loadingCards ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 size={22} className="animate-spin" /><span className="text-sm font-semibold">Loading ID cards…</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><CreditCard size={28} className="text-slate-300" /></div>
              <p className="text-sm font-semibold text-slate-400">No ID cards found</p>
              <p className="text-xs text-slate-300">Issue cards from the <strong>Issue Cards</strong> tab to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.id} className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-md ${card.status === 'revoked' ? 'border-rose-100 opacity-75' : 'border-slate-100'}`}>
                  <div className="h-1.5 w-full" style={{ background: card.status === 'active' ? template.primaryColor : '#ef4444' }} />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100" style={{ background: `${template.primaryColor}18` }}>
                          {card.entityType === 'student' ? <School size={18} style={{ color: template.primaryColor }} /> : <Briefcase size={18} style={{ color: template.primaryColor }} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[130px]">{card.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{card.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${card.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {card.status === 'active' ? '✓ Active' : '✗ Revoked'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] border-t border-slate-50 pt-2.5">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Card No</span>
                        <p className="font-mono font-bold text-slate-700 text-[9px] mt-0.5 truncate">{card.cardNumber}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Type</span>
                        <p className="font-bold text-slate-700 capitalize mt-0.5">{card.entityType}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Issued</span>
                        <p className="font-bold text-slate-700 mt-0.5">{fmtDate(card.issuedAt)}</p>
                      </div>
                      {card.status === 'revoked' && (
                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wide">Revoked</span>
                          <p className="font-bold text-rose-600 mt-0.5">{fmtDate(card.revokedAt)}</p>
                        </div>
                      )}
                    </div>
                    {card.status === 'revoked' && card.revokedReason && (
                      <p className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 leading-snug">
                        <strong>Reason:</strong> {card.revokedReason}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleDownload(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer">
                        <Download size={12} /> Download PDF
                      </button>
                      {card.status === 'active' && (
                        <button onClick={() => { setRevokingCard(card); setRevokeReason('') }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                          <ShieldOff size={12} /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = page <= 4 ? i + 1 : page - 3 + i
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${pg === page ? 'text-white shadow' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    style={pg === page ? { background: template.primaryColor } : {}}>
                    {pg}
                  </button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────── DESIGNER TAB ───────────────────── */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${template.primaryColor}18` }}>
                  <Palette size={18} style={{ color: template.primaryColor }} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Card Template Designer</h2>
                  <p className="text-xs text-slate-400">Customize the visual identity of all issued cards</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Card Layout</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['classic', 'modern', 'minimal'] as const).map((layout) => (
                    <button key={layout} onClick={() => setDraftLayout(layout)}
                      className={`py-3 rounded-xl border text-xs font-bold capitalize flex flex-col items-center gap-1.5 transition cursor-pointer ${draftLayout === layout ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <LayoutTemplate size={16} className={draftLayout === layout ? 'text-emerald-600' : 'text-slate-400'} />
                      {layout}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Brand Colors</label>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Primary Color</span>
                    <span className="text-[11px] font-mono text-slate-400">{draftColor1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={draftColor1} onChange={(e) => setDraftColor1(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                    <div className="flex-1 h-10 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="w-full h-full" style={{ background: `linear-gradient(90deg, ${draftColor1}, ${draftColor2})` }} />
                    </div>
                    <input type="color" value={draftColor2} onChange={(e) => setDraftColor2(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Secondary Color</span>
                    <span className="text-[11px] font-mono text-slate-400">{draftColor2}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Quick Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['#1b5e20','#2e7d32'],['#1a237e','#283593'],['#b71c1c','#c62828'],
                      ['#4a148c','#6a1b9a'],['#e65100','#ef6c00'],['#006064','#00838f'],
                      ['#212121','#424242'],['#1565c0','#1976d2'],
                    ].map(([c1, c2]) => (
                      <button key={c1} title={c1} onClick={() => { setDraftColor1(c1); setDraftColor2(c2) }}
                        className="w-7 h-7 rounded-lg border-2 border-white shadow hover:scale-110 transition-transform cursor-pointer"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Preview As</label>
                <div className="flex gap-2">
                  {(['student', 'staff'] as const).map((t) => (
                    <button key={t} onClick={() => setPreviewType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer border items-center justify-center flex gap-1 ${previewType === t ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      style={previewType === t ? { background: template.primaryColor } : {}}>
                      {t === 'student' ? <><School size={12} />Student</> : <><Briefcase size={12} />Staff</>}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveTemplate} disabled={savingTemplate}
                className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60 cursor-pointer shadow"
                style={{ background: `linear-gradient(135deg, ${draftColor1}, ${draftColor2})` }}>
                {savingTemplate ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingTemplate ? 'Saving Template…' : 'Save Card Template'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Eye size={16} className="text-slate-400" />
                <h2 className="text-sm font-black text-slate-700">Live Preview</h2>
                <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold"><Sparkles size={9} className="inline mr-1" />Real-time</span>
              </div>
              <div className="flex justify-center py-8 rounded-2xl" style={{ background: `linear-gradient(135deg, ${draftColor1}15, ${draftColor2}10)` }}>
                <CardPreview template={draftPreviewTemplate}
                  sample={{ name: previewType === 'student' ? 'Amara Johnson' : 'Mr. Emmanuel Oke', role: previewType === 'student' ? 'Grade 5 · Section A' : 'Head of Science Dept.', cardNo: previewType === 'student' ? 'IDC/STU/2026/0042' : 'IDC/STF/2026/0007', type: previewType }} />
              </div>
              <div className="mt-4 flex justify-center">
                <div className="w-[260px] h-[160px] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                  <QrCode size={40} className="text-slate-300" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">QR Verification Code</p>
                    <p className="text-[8px] text-slate-300 mt-0.5">Scan to verify card authenticity</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-semibold">Front &amp; Back Card Preview</p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600">Card Specifications</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[['Standard Size','CR80 (85.6 × 54mm)'],['Format','PDF / Printable'],['QR Verification','Unique per card'],['Card Number','Auto-generated']].map(([l, v]) => (
                  <div key={l} className="bg-white rounded-xl p-2.5 border border-slate-100">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">{l}</p>
                    <p className="text-slate-700 font-bold mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────── PROVISION TAB ───────────────────── */}
      {activeTab === 'provision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50"><Users size={18} className="text-emerald-600" /></div>
              <div>
                <h2 className="text-sm font-black text-slate-800">Batch Issue — By Class</h2>
                <p className="text-xs text-slate-400">Issue ID cards to all students in a selected class &amp; section</p>
              </div>
            </div>
            {loadingClasses ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400"><Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading classes…</span></div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Select Classroom</label>
                  <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId('') }}
                    className="w-full px-3 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20">
                    <option value="">— Choose a class —</option>
                    {classes.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Select Section</label>
                  <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} disabled={!selectedClassId || availableSections.length === 0}
                    className="w-full px-3 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">— Choose a section —</option>
                    {availableSections.map((s) => <option key={s.section.id} value={String(s.section.id)}>{s.section.name}</option>)}
                  </select>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <Hash size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-700 font-semibold leading-snug">Cards are issued only to students who don&apos;t already have an active card. Existing cards are preserved.</p>
                </div>
                <button onClick={handleBatchProvision} disabled={provisioning || !selectedClassId || !selectedSectionId}
                  className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})` }}>
                  {provisioning ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {provisioning ? 'Issuing Cards…' : 'Issue Batch ID Cards'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2"><Sparkles size={16} className="text-amber-500" /><h2 className="text-sm font-black text-slate-800">How Card Issuance Works</h2></div>
              <ol className="space-y-3">
                {[['1','Select Class & Section','Pick the classroom and section to provision cards for.'],
                  ['2','Cards Auto-Generated','A unique card number and QR token is created for each student.'],
                  ['3','Download PDF','Go to the Card Ledger tab to download individual PDF cards.'],
                  ['4','Print & Distribute','Print on CR80 card paper or standard A4 and laminate.']].map(([step, title, desc]) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow" style={{ background: template.primaryColor }}>{step}</span>
                    <div><p className="text-xs font-bold text-slate-700">{title}</p><p className="text-[10px] text-slate-400 mt-0.5">{desc}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-800">Revoking a Card</p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">Revoking permanently disables the card. The QR code will show &quot;Revoked&quot; when scanned. You can re-issue a new card after revoking.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black text-slate-700 mb-3">Card Overview Snapshot</p>
              <div className="space-y-2">
                {[['Total Issued', stats.totalCards, template.primaryColor],['Currently Active', stats.activeCards, '#16a34a'],['Revoked', stats.revokedCards, '#dc2626']].map(([label, value, color]) => (
                  <div key={String(label)} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: String(color) }} />
                    <span className="text-xs text-slate-600 flex-1">{label}</span>
                    <span className="text-xs font-black text-slate-800">{value}</span>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ background: String(color), width: stats.totalCards > 0 ? `${Math.round((Number(value) / stats.totalCards) * 100)}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0"><ShieldOff size={22} className="text-rose-600" /></div>
              <div>
                <h3 className="text-base font-black text-slate-900">Revoke ID Card</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-slate-500">Card Holder</p>
              <p className="font-black text-slate-800">{revokingCard.name}</p>
              <p className="text-xs text-slate-500 font-mono">{revokingCard.cardNumber}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Reason for Revocation</label>
              <textarea rows={3} placeholder="Enter the reason for revoking this card…" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRevokingCard(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer">Cancel</button>
              <button onClick={handleRevoke} disabled={isRevoking}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                {isRevoking ? <Loader2 size={15} className="animate-spin" /> : <ShieldOff size={15} />}
                {isRevoking ? 'Revoking…' : 'Revoke Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
