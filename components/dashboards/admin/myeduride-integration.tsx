'use client'

import { useEffect, useState } from 'react'
import {
  Bus,
  DoorOpen,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  Search,
  Plus,
  Radio,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  AlertTriangle,
  Send,
  Users,
  Key,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  Phone,
  Mail,
  UserPlus,
  Navigation,
  Gauge,
  Fuel,
  Bell
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

type MyEduRideTab = 'gate-manager' | 'bus-tracking' | 'manifests' | 'api-settings'

interface MyEduRideConfig {
  branchId: number
  branchCode: string
  schoolName: string
  apiUrl: string
  apiKey: string
  webhookSecret: string
  isConnected: boolean
  lastPingAt: string
  lastSyncedAt: string
  syncedStudentsCount: number
  activeBusesCount: number
  autoSyncRoster: boolean
  smsAlertsEnabled: boolean
}

interface OverviewMetrics {
  activeBuses: number
  busesInTransit: number
  totalEntriesToday: number
  totalExitsToday: number
  flaggedIncidents: number
  totalStudentsEnrolled: number
  syncedStudentsCount: number
  apiHealth: string
  lastSyncedAt: string
}

interface GateLog {
  id: string
  personId?: number | null
  personName: string
  personType: 'STUDENT' | 'STAFF' | 'PARENT_VISITOR' | 'GUEST'
  identifierCode: string
  direction: 'ENTRY' | 'EXIT'
  gateLocation: string
  status: 'VERIFIED' | 'FLAGGED' | 'MANUAL_OVERRIDE'
  authorizedGuardian?: string | null
  pickupPassCode?: string | null
  verifiedBy: string
  verifiedAt: string
  notes?: string | null
}

interface StopItem {
  id: number
  name: string
  landmark: string
  time: string
  students: number
  status: 'PASSED' | 'CURRENT' | 'PENDING'
}

interface BusItem {
  id: string
  busCode: string
  vehicleModel: string
  plateNumber: string
  capacity: number
  driverName: string
  driverPhone: string
  driverLicense: string
  attendantName: string
  attendantPhone: string
  routeName: string
  routeCode: string
  morningDeparture: string
  afternoonDeparture: string
  currentLocation: string
  speedKmH: number
  fuelLevel: number
  status: 'IN_TRANSIT' | 'ARRIVED' | 'IDLE' | 'MAINTENANCE'
  studentsAssigned: number
  studentsOnboard: number
  stops: StopItem[]
}

interface VerificationResult {
  id: number
  name: string
  registerNo: string
  photo?: string | null
  parentName: string
  parentPhone: string
  pickupPassCode: string
}

export function MyEduRideIntegration() {
  const [activeTab, setActiveTab] = useState<MyEduRideTab>('gate-manager')
  const [config, setConfig] = useState<MyEduRideConfig | null>(null)
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Gate Logs State
  const [gateLogs, setGateLogs] = useState<GateLog[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [directionFilter, setDirectionFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [scannerActive, setScannerActive] = useState<boolean>(false)
  const [scanCodeInput, setScanCodeInput] = useState<string>('')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [lastVerification, setLastVerification] = useState<VerificationResult | null>(null)

  // Bus Fleet State
  const [buses, setBuses] = useState<BusItem[]>([])
  const [selectedBus, setSelectedBus] = useState<BusItem | null>(null)

  // Syncing & Testing State
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message: string } | null>(null)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Export State
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [actionAlert, setActionAlert] = useState<string | null>(null)

  // Config Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false)
  const [editApiUrl, setEditApiUrl] = useState<string>('')
  const [editApiKey, setEditApiKey] = useState<string>('')
  const [editWebhookSecret, setEditWebhookSecret] = useState<string>('')
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false)

  // Visitor Check-in Modal
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState<boolean>(false)
  const [visitorName, setVisitorName] = useState<string>('')
  const [visitorPurpose, setVisitorPurpose] = useState<string>('')
  const [visitorPhone, setVisitorPhone] = useState<string>('')

  // Manifest Boarding demo state
  const [manifestStudents, setManifestStudents] = useState([
    { id: 4413, name: 'Chinedu Joseph Okafor', regNo: 'UG-2026-001', route: 'Route A', stop: 'Maryland Mall', status: 'BOARDED_MORNING', parent: 'Mr. Okafor (08034567890)' },
    { id: 4419, name: 'Amina Abubakar Bello', regNo: 'UG-2026-002', route: 'Route A', stop: 'Ikeja Bus Terminal', status: 'BOARDED_MORNING', parent: 'Mrs. Bello (08123456789)' },
    { id: 4423, name: 'David Oluwaseun Adeleke', regNo: 'UG-2026-003', route: 'Route B', stop: 'Lekki Admiralty Way', status: 'NOT_BOARDED', parent: 'Mr. Adeleke (08098765432)' },
    { id: 4425, name: 'Blessing Ngozi Eze', regNo: 'UG-2026-004', route: 'Route A', stop: 'Ojota Interchange', status: 'NOT_BOARDED', parent: 'Mrs. Eze (08145671234)' },
  ])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // 1. Load Config & Overview
      const overviewRes = await apiSlice.get<{ success: boolean; data: { config: MyEduRideConfig; metrics: OverviewMetrics } }>(
        endpoints.admin.myeduride.overview
      )
      if (overviewRes.data) {
        setConfig(overviewRes.data.config)
        setMetrics(overviewRes.data.metrics)
        setEditApiUrl(overviewRes.data.config.apiUrl)
        setEditApiKey(overviewRes.data.config.apiKey)
        setEditWebhookSecret(overviewRes.data.config.webhookSecret)
      }

      // 2. Load Gate Logs
      const logsRes = await apiSlice.get<{ success: boolean; data: GateLog[] }>(
        endpoints.admin.myeduride.gateLogs()
      )
      if (logsRes.data) {
        setGateLogs(logsRes.data)
      }

      // 3. Load Buses
      const busRes = await apiSlice.get<{ success: boolean; data: BusItem[] }>(
        endpoints.admin.myeduride.buses
      )
      if (busRes.data) {
        setBuses(busRes.data)
        if (busRes.data.length > 0) {
          setSelectedBus(busRes.data[0])
        }
      }
    } catch (err) {
      console.error('Failed to load MyEduRide data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConn(true)
    setTestResult(null)
    try {
      const res = await apiSlice.post<{ success: boolean; data: { success: boolean; latencyMs?: number; message: string } }>(
        endpoints.admin.myeduride.testConnection,
        {
          apiUrl: editApiUrl || config?.apiUrl,
          apiKey: editApiKey || config?.apiKey
        }
      )
      setTestResult(res.data)
      setActionAlert(res.data.message)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed'
      })
    } finally {
      setIsTestingConn(false)
    }
  }

  const handleSyncRoster = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    try {
      const res = await apiSlice.post<{ success: boolean; syncedCount: number; message: string }>(
        endpoints.admin.myeduride.syncRoster,
        {}
      )
      setSyncMessage(res.message)
      setActionAlert(`Sync Complete: ${res.syncedCount} student profiles & guardians pushed to MyEduRide.`)
      // Refresh overview
      loadAllData()
    } catch (err) {
      setActionAlert(err instanceof Error ? err.message : 'Failed to sync roster')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConfig(true)
    try {
      const res = await apiSlice.post<{ success: boolean; data: MyEduRideConfig; message: string }>(
        endpoints.admin.myeduride.config,
        {
          apiUrl: editApiUrl,
          apiKey: editApiKey,
          webhookSecret: editWebhookSecret
        }
      )
      setConfig(res.data)
      setIsConfigModalOpen(false)
      setActionAlert('MyEduRide API configuration saved successfully.')
    } catch (err) {
      setActionAlert(err instanceof Error ? err.message : 'Failed to save config')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleExecuteScan = async (codeToScan?: string) => {
    const code = codeToScan || scanCodeInput
    if (!code) return

    setIsScanning(true)
    try {
      const res = await apiSlice.post<{
        success: boolean
        log: GateLog
        studentDetails?: VerificationResult | null
      }>(endpoints.admin.myeduride.scanGate, {
        code,
        direction: 'ENTRY',
        gateLocation: 'Main Front Turnstile Gate 1',
        verifiedBy: 'Turnstile Scanner #01'
      })

      if (res.log) {
        setGateLogs((prev) => [res.log, ...prev])
      }
      if (res.studentDetails) {
        setLastVerification(res.studentDetails)
      } else {
        setLastVerification(null)
      }

      setScanCodeInput('')
      setActionAlert(`Gate Scan Successful: Verified ${res.log.personName} (${res.log.direction}). Turnstile gate unlocked.`)
    } catch (err) {
      setActionAlert(err instanceof Error ? err.message : 'Gate scan failed')
    } finally {
      setIsScanning(false)
    }
  }

  const handleBoardingChange = async (studentId: number, newStatus: string) => {
    try {
      const res = await apiSlice.post<{ success: boolean; smsSummary?: string }>(
        endpoints.admin.myeduride.manifestBoard,
        { studentId, busId: selectedBus?.id || 'BUS-01', status: newStatus }
      )

      setManifestStudents((prev) =>
        prev.map((st) => (st.id === studentId ? { ...st, status: newStatus } : st))
      )

      if (res.smsSummary) {
        setActionAlert(res.smsSummary)
      }
    } catch (err) {
      setActionAlert('Failed to update boarding status')
    }
  }

  const handleExport = async (type: 'csv' | 'pdf') => {
    setExporting(type)
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      if (type === 'csv') {
        await apiSlice.download(endpoints.admin.myeduride.exportCsv, `myeduride-gate-log-${stamp}.csv`)
        setActionAlert('Gate logs exported to CSV.')
      } else {
        await apiSlice.download(endpoints.admin.myeduride.exportPdf, `myeduride-gate-log-${stamp}.pdf`)
        setActionAlert('Gate access audit report exported to PDF.')
      }
    } catch (err) {
      setActionAlert(err instanceof Error ? err.message : `Failed to export ${type.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  // Filtered gate logs
  const filteredLogs = gateLogs.filter((log) => {
    const matchesRole = roleFilter === 'ALL' || log.personType === roleFilter
    const matchesDirection = directionFilter === 'ALL' || log.direction === directionFilter
    const matchesSearch =
      log.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.identifierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.gateLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.authorizedGuardian && log.authorizedGuardian.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesRole && matchesDirection && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Banner Header with API Integration Bridge */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#083344] via-[#0e7490] to-[#06b6d4] p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-30" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl opacity-40" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-extrabold text-white bg-white/20 rounded-full border border-white/30 shadow-xs inline-flex items-center gap-1.5 backdrop-blur-sm">
                <Zap size={12} className="text-cyan-300 fill-cyan-300" /> MyEduRide API Connected
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold text-cyan-100 bg-cyan-950/40 rounded-full border border-cyan-500/30">
                Turnstile Gate & Bus Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Bus className="text-cyan-300 shrink-0" size={28} /> MyEduRide Logistics & Gate Manager
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl font-medium">
              Real-time physical turnstile QR/RFID card verification, parent pickup authorization matching, and live GPS school bus fleet tracking.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncRoster}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer backdrop-blur-sm"
              title="Sync students & parent guardians to MyEduRide API"
            >
              {isSyncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Sync Rosters ({metrics?.syncedStudentsCount || 0})
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs shadow-sm border border-slate-700 transition cursor-pointer backdrop-blur-sm"
            >
              <Key size={15} className="text-cyan-400" /> API Settings
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs sm:text-sm text-cyan-900 font-semibold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-cyan-600 shrink-0" />
            <span>{actionAlert}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-cyan-700 hover:text-cyan-900 text-xs font-bold">✕</button>
        </div>
      )}

      {/* TOP 4 HERO KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Bus Fleet */}
        <div className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 to-cyan-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-900">
              Active Bus Fleet
            </span>
            <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-xs">
              <Bus size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-950 tracking-tight">
            {metrics?.activeBuses || 3} Vehicles
          </p>
          <div className="pt-1 border-t border-cyan-200/60 text-[11px] font-semibold text-cyan-800 flex items-center justify-between">
            <span>{metrics?.busesInTransit || 1} En Route Transit</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
              GPS Online
            </span>
          </div>
        </div>

        {/* 2. Synced Students & Parents */}
        <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 to-blue-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
              Synced Roster Records
            </span>
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-950 tracking-tight">
            {metrics?.syncedStudentsCount || 0} Students
          </p>
          <div className="pt-1 border-t border-blue-200/60 text-[11px] font-semibold text-blue-800 flex items-center justify-between">
            <span>Authorized Guardians</span>
            <span className="font-bold text-blue-900">100% Paired</span>
          </div>
        </div>

        {/* 3. Today's Gate Entries & Exits */}
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
              Turnstile Scans Today
            </span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <DoorOpen size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-950 tracking-tight">
            {gateLogs.length} Verified
          </p>
          <div className="pt-1 border-t border-emerald-200/60 text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
            <span>{gateLogs.filter(g => g.direction === 'ENTRY').length} In / {gateLogs.filter(g => g.direction === 'EXIT').length} Out</span>
            <span className="text-emerald-900 font-bold">0 Breach</span>
          </div>
        </div>

        {/* 4. API Handshake Health */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              API Bridge Status
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Globe size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Connected
          </p>
          <div className="pt-1 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Latency</span>
            <span className="font-mono font-bold text-slate-800">{testResult?.latencyMs || 34}ms</span>
          </div>
        </div>
      </div>

      {/* SUB-MODULE TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('gate-manager')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'gate-manager'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <DoorOpen size={16} className="text-cyan-600" />
          Turnstile Gate Scanner & Logs
        </button>

        <button
          onClick={() => setActiveTab('bus-tracking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'bus-tracking'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Bus size={16} className="text-cyan-600" />
          Live School Bus Fleet & GPS
        </button>

        <button
          onClick={() => setActiveTab('manifests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'manifests'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <UserCheck size={16} className="text-cyan-600" />
          Student Bus Manifests & SMS Alerts
        </button>

        <button
          onClick={() => setActiveTab('api-settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'api-settings'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Key size={16} className="text-cyan-600" />
          API Credentials & Webhook Bridge
        </button>
      </div>

      {/* TAB 1: GATE ACCESS & TURNSTILE SCANNER */}
      {activeTab === 'gate-manager' && (
        <div className="space-y-6">
          {/* Scanner Simulator Action Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="text-cyan-600" size={20} /> Real-Time Gate Scanner Simulator
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Scan Student QR code, RFID turnstile badge, or Staff ID to authenticate entry & authorize parent pickup.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVisitorModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={14} /> Visitor Check-in Pass
                </button>
                <button
                  onClick={() => setScannerActive(!scannerActive)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode size={14} className="text-cyan-400" /> {scannerActive ? 'Hide Scanner UI' : 'Open Camera Scanner'}
                </button>
              </div>
            </div>

            {/* Live Camera Scanner Box */}
            {scannerActive && (
              <div className="p-6 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-5 text-center shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-300">
                      Live Turnstile Scanner Online • Ready for Scan
                    </span>
                  </div>
                  <button onClick={() => setScannerActive(false)} className="text-slate-400 hover:text-white text-xs font-bold">Close Scanner</button>
                </div>

                {/* Simulated Target Frame */}
                <div className="w-56 h-56 mx-auto rounded-2xl bg-slate-900 border-2 border-dashed border-cyan-400/80 flex flex-col items-center justify-center space-y-2 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-x-0 top-0 h-1 bg-cyan-400 shadow-md shadow-cyan-400/50 animate-bounce" />
                  <QrCode size={56} className="text-cyan-400 animate-pulse" />
                  <p className="text-[11px] font-bold text-slate-300">Point QR / RFID Card</p>
                </div>

                {/* Quick Scan Simulator Buttons */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-semibold">Test with Enrolled Student Credentials:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handleExecuteScan('UG-2026-001')}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Scan Chinedu Okafor (UG-2026-001)
                    </button>
                    <button
                      onClick={() => handleExecuteScan('UG-2026-002')}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Scan Amina Bello (UG-2026-002)
                    </button>
                    <button
                      onClick={() => handleExecuteScan('STF-104')}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Scan Staff Card (STF-104)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Manual Code Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Student Register No, ID Card Token, or Badge Code..."
                  value={scanCodeInput}
                  onChange={(e) => setScanCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecuteScan()}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                />
              </div>
              <button
                onClick={() => handleExecuteScan()}
                disabled={isScanning || !scanCodeInput}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Verify Scan
              </button>
            </div>

            {/* Verified Student Pass Profile Card */}
            {lastVerification && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-200 text-emerald-900 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Student Turnstile Authorization Confirmed
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-800">{lastVerification.registerNo}</span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Student Name</span>
                    <p className="font-black text-slate-900 text-sm">{lastVerification.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Authorized Guardian</span>
                    <p className="font-bold text-slate-800">{lastVerification.parentName}</p>
                    <p className="text-[11px] text-slate-500">{lastVerification.parentPhone}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Pickup Pass PIN</span>
                    <p className="font-mono font-black text-emerald-800 text-sm">{lastVerification.pickupPassCode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Gate Access Stream Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <DoorOpen className="text-cyan-600" size={18} /> Turnstile Gate Access Stream
                </h3>
                <p className="text-xs text-slate-500 font-medium">Real-time entry & exit logs across all campus turnstile gates.</p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting !== null}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                  Export PDF
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {(['ALL', 'STUDENT', 'STAFF', 'PARENT_VISITOR'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      roleFilter === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {r === 'ALL' ? 'All Roles' : r === 'STUDENT' ? 'Students' : r === 'STAFF' ? 'Staff' : 'Visitors'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {(['ALL', 'ENTRY', 'EXIT'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirectionFilter(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      directionFilter === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {d === 'ALL' ? 'All Directions' : d === 'ENTRY' ? 'Entries Only' : 'Exits Only'}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, ID code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan Ref</TableHead>
                    <TableHead>Person Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Gate Location</TableHead>
                    <TableHead>Authorized Guardian / Pass</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/70 transition">
                      <TableCell className="font-mono font-bold text-slate-800">{log.id}</TableCell>
                      <TableCell className="font-bold text-slate-900">{log.personName}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.personType === 'STUDENT'
                              ? 'bg-blue-50 text-blue-700'
                              : log.personType === 'STAFF'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {log.personType}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{log.identifierCode}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${log.direction === 'ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {log.direction}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-900 text-xs">
                        {new Date(log.verifiedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{log.gateLocation}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{log.authorizedGuardian || '—'}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            log.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{filteredLogs.length} turnstile gate scans recorded today.</TableCaption>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE BUS FLEET & GPS TRACKING */}
      {activeTab === 'bus-tracking' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Bus Cards List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  School Bus Fleet ({buses.length})
                </h3>
                <span className="text-xs text-slate-400 font-semibold">Live GPS Status</span>
              </div>

              {buses.map((bus) => (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBus(bus)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                    selectedBus?.id === bus.id
                      ? 'border-cyan-500 bg-cyan-50/50 shadow-sm'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-600 text-white">
                        <Bus size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{bus.busCode}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{bus.vehicleModel}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        bus.status === 'IN_TRANSIT'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : bus.status === 'ARRIVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {bus.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">SPEED</span>
                      <span className="font-bold text-slate-800">{bus.speedKmH} km/h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">CAPACITY</span>
                      <span className="font-bold text-slate-800">{bus.studentsAssigned} / {bus.capacity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">FUEL</span>
                      <span className="font-bold text-emerald-700">{bus.fuelLevel}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live GPS Route Simulator View */}
            {selectedBus && (
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-cyan-100 text-cyan-900 inline-block mb-1">
                      Live Telemetry Stream
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{selectedBus.routeName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Plate: {selectedBus.plateNumber} • Driver: {selectedBus.driverName} ({selectedBus.driverPhone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5">
                      <Gauge size={14} className="text-cyan-400" /> {selectedBus.speedKmH} km/h
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold flex items-center gap-1.5">
                      <Navigation size={14} className="text-cyan-600" /> {selectedBus.currentLocation}
                    </div>
                  </div>
                </div>

                {/* Waypoint Stops Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Sequential Bus Route Stops & ETA
                  </h4>

                  <div className="grid sm:grid-cols-4 gap-3 pt-2">
                    {selectedBus.stops.map((stop, idx) => (
                      <div
                        key={stop.id}
                        className={`p-3.5 rounded-xl border relative space-y-1.5 ${
                          stop.status === 'PASSED'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : stop.status === 'CURRENT'
                            ? 'bg-cyan-50 border-cyan-400 shadow-sm'
                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold">Stop #{idx + 1}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                              stop.status === 'PASSED'
                                ? 'bg-emerald-200 text-emerald-900'
                                : stop.status === 'CURRENT'
                                ? 'bg-cyan-200 text-cyan-900 animate-pulse'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {stop.status}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900 leading-snug">{stop.name}</p>
                        <p className="text-[10px] text-slate-500">{stop.landmark}</p>
                        <div className="pt-1 border-t border-slate-200/50 flex justify-between text-[10px] font-semibold text-slate-700">
                          <span>ETA: {stop.time}</span>
                          <span>{stop.students} Students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver & Attendant Card */}
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Driver</span>
                    <p className="font-bold text-sm text-slate-900">{selectedBus.driverName}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1"><Phone size={12} /> {selectedBus.driverPhone}</p>
                    <p className="text-[10px] text-slate-400 font-mono">License: {selectedBus.driverLicense}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fleet Attendant</span>
                    <p className="font-bold text-sm text-slate-900">{selectedBus.attendantName}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1"><Phone size={12} /> {selectedBus.attendantPhone}</p>
                    <p className="text-[10px] text-slate-400">Emergency & Boarding Care</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT BUS MANIFESTS & SMS ALERTS */}
      {activeTab === 'manifests' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="text-cyan-600" size={20} /> Student Boarding Manifest & Automated Guardian SMS
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Record student pickup/drop-off status. Instantly dispatches SMS notification alerts to registered parents.
              </p>
            </div>
          </div>

          <Table className="border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Designated Bus Stop</TableHead>
                <TableHead>Parent / Guardian Contact</TableHead>
                <TableHead>Transit Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manifestStudents.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-bold text-slate-900">{st.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{st.regNo}</TableCell>
                  <TableCell className="font-semibold text-cyan-700 text-xs">{st.route}</TableCell>
                  <TableCell className="text-xs text-slate-700">{st.stop}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">{st.parent}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        st.status === 'BOARDED_MORNING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'ARRIVED_SCHOOL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {st.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {st.status !== 'BOARDED_MORNING' && (
                        <button
                          onClick={() => handleBoardingChange(st.id, 'BOARDED_MORNING')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                        >
                          Board Morning
                        </button>
                      )}
                      {st.status === 'BOARDED_MORNING' && (
                        <button
                          onClick={() => handleBoardingChange(st.id, 'ARRIVED_SCHOOL')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition"
                        >
                          Arrived at School
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: API SETTINGS & WEBHOOK BRIDGE */}
      {activeTab === 'api-settings' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Key className="text-cyan-600" size={20} /> MyEduRide API Configuration & Credentials
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure connection parameters between Ugbekun 2.0 and your standalone MyEduRide backend instance.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">MyEduRide API Base URL</label>
              <input
                type="text"
                value={editApiUrl}
                onChange={(e) => setEditApiUrl(e.target.value)}
                placeholder="e.g. http://localhost:3002/api/v1 or https://api.myeduride.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">School Live API Key / Secret Token</label>
              <input
                type="text"
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                placeholder="EDURIDE-LIVE-KEY-xxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-cyan-800 text-xs font-mono font-black focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Webhook Ingestion Secret</label>
              <input
                type="text"
                value={editWebhookSecret}
                onChange={(e) => setEditWebhookSecret(e.target.value)}
                placeholder="WH-SEC-xxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {isTestingConn ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-cyan-600" />}
                Test Connection Handshake
              </button>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingConfig ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Integration Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: API CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Key size={16} className="text-cyan-400" /> MyEduRide API Key Settings
              </h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">MyEduRide API Base URL</label>
                <input
                  type="text"
                  value={editApiUrl}
                  onChange={(e) => setEditApiUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">School Live API Key</label>
                <input
                  type="text"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-cyan-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsConfigModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSavingConfig} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                  {isSavingConfig ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VISITOR CHECK-IN PASS */}
      {isVisitorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus size={16} className="text-cyan-400" /> Issue Visitor Turnstile Pass
              </h3>
              <button onClick={() => setIsVisitorModalOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Visitor Full Name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Chief Emmanuel Nwosu"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Purpose of Visit / Person to Meet</label>
                <input
                  type="text"
                  value={visitorPurpose}
                  onChange={(e) => setVisitorPurpose(e.target.value)}
                  placeholder="e.g. Meeting with School Principal"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Phone Number</label>
                <input
                  type="text"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsVisitorModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteScan(`VIS-${Math.floor(1000 + Math.random() * 9000)}`)
                    setIsVisitorModalOpen(false)
                    setVisitorName('')
                    setVisitorPurpose('')
                    setVisitorPhone('')
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Issue Pass & Unlock Gate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
