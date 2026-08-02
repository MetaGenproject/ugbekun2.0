'use client'

import { useState } from 'react'
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
  Download,
  AlertTriangle,
  Send,
  Users
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

type MyEduRideTab = 'gate-manager' | 'bus-tracking' | 'drivers-routes'

interface GateLog {
  id: string
  personName: string
  role: 'Student' | 'Staff' | 'Parent Visitor'
  idNumber: string
  time: string
  gateLocation: string
  status: 'Verified Entry' | 'Exit Recorded' | 'Flagged Inspection'
  pickupParent?: string
}

export function MyEduRideIntegration() {
  const [activeTab, setActiveTab] = useState<MyEduRideTab>('gate-manager')
  const [searchQuery, setSearchQuery] = useState('')
  const [scannerActive, setScannerActive] = useState(false)

  // Gate Logs
  const [gateLogs, setGateLogs] = useState<GateLog[]>([
    { id: 'SCAN-901', personName: 'Chinedu Joseph Okafor', role: 'Student', idNumber: 'UG-2026-001', time: '07:42 AM', gateLocation: 'Main Front Gate 1', status: 'Verified Entry', pickupParent: 'Mr. Okafor (Father)' },
    { id: 'SCAN-902', personName: 'Mrs. Victoria Adams', role: 'Staff', idNumber: 'STF-104', time: '07:30 AM', gateLocation: 'Staff Gate 2', status: 'Verified Entry' },
    { id: 'SCAN-903', personName: 'Amina Abubakar Bello', role: 'Student', idNumber: 'UG-2026-002', time: '07:50 AM', gateLocation: 'Main Front Gate 1', status: 'Verified Entry', pickupParent: 'Mrs. Bello (Mother)' },
    { id: 'SCAN-904', personName: 'David Oluwaseun Adeleke', role: 'Student', idNumber: 'UG-2026-003', time: '08:15 AM', gateLocation: 'Main Front Gate 1', status: 'Flagged Inspection' },
    { id: 'SCAN-905', personName: 'Engr. Felix Ojo', role: 'Staff', idNumber: 'STF-108', time: '07:35 AM', gateLocation: 'Staff Gate 2', status: 'Verified Entry' },
  ])

  // School Buses
  const [buses, setBuses] = useState([
    { id: 'BUS-01', routeName: 'Ikeja - Maryland - School Route', vehicle: 'Toyota Coaster (32-Seater)', driver: 'Mr. Monday Utomi', capacity: '28 / 32 Students', status: 'In Transit (En Route)', gpsLocation: 'Maryland Junction' },
    { id: 'BUS-02', routeName: 'Lekki - Victoria Island Express', vehicle: 'Toyota HiAce (18-Seater)', driver: 'Mr. Usman Garba', capacity: '16 / 18 Students', status: 'Arrived at School', gpsLocation: 'Campus Bus Bay' },
  ])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bus className="text-cyan-600" size={24} /> MyEduRide Transport & Gate Manager
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Real-time school turnstile QR/NFC gate scanner logs, parent pickup authorization, and GPS bus tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <QrCode size={15} className="text-cyan-400" /> {scannerActive ? 'Close Gate Scanner' : 'Launch QR Gate Scanner'}
            </button>
          </div>
        </div>
      </div>

      {/* Live QR Code Gate Scanner Simulator (If Active) */}
      {scannerActive && (
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-xl text-center">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-black text-xs uppercase tracking-wider text-white">Live Turnstile Camera Scanner Active</h3>
            </div>
            <button onClick={() => setScannerActive(false)} className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg">Close</button>
          </div>

          <div className="w-48 h-48 mx-auto rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-500 flex flex-col items-center justify-center space-y-2">
            <QrCode size={48} className="text-cyan-400 animate-pulse" />
            <p className="text-[11px] font-bold text-slate-300">Scan Student QR or RFID Card</p>
          </div>

          <button
            onClick={() => {
              alert('Student ID UG-2026-001 Verified! Gate Turnstile Unlocked.')
              setScannerActive(false)
            }}
            className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            Simulate Scan (Chinedu Okafor)
          </button>
        </div>
      )}

      {/* Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('gate-manager')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'gate-manager' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen size={15} /> Gate Manager
        </button>

        <button
          onClick={() => setActiveTab('bus-tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'bus-tracking' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bus size={15} /> School Bus Tracking
        </button>

        <button
          onClick={() => setActiveTab('drivers-routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'drivers-routes' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin size={15} /> Drivers & Routes
        </button>
      </div>

      {/* TAB 1: GATE MANAGER */}
      {activeTab === 'gate-manager' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <DoorOpen className="text-cyan-600" size={20} /> Real-Time Gate Scanner & Inspection Log
              </h3>
              <p className="text-xs text-slate-500 font-medium">Turnstile scanner entries, exit timestamps, and authorized parent pickup verification.</p>
            </div>

            <button onClick={() => alert('Printing Gate Log...')} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Printer size={14} /> Print Gate Log
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scan Ref</TableHead>
                <TableHead>Person Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID Credential</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Gate Location</TableHead>
                <TableHead>Authorized Parent</TableHead>
                <TableHead className="text-right">Gate Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateLogs.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{g.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{g.personName}</TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.role === 'Student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{g.role}</span></TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{g.idNumber}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{g.time}</TableCell>
                  <TableCell className="text-xs text-slate-600">{g.gateLocation}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{g.pickupParent || '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      g.status === 'Verified Entry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {g.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: BUS TRACKING */}
      {activeTab === 'bus-tracking' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Bus className="text-cyan-600" size={20} /> Live GPS School Bus Fleet Tracking
          </h3>
          <Table>
            <TableHeader><TableRow><TableHead>Bus Ref</TableHead><TableHead>Route Name</TableHead><TableHead>Vehicle Model</TableHead><TableHead>Driver</TableHead><TableHead>Capacity</TableHead><TableHead>Current GPS Location</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {buses.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{b.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{b.routeName}</TableCell>
                  <TableCell className="text-xs text-slate-600">{b.vehicle}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{b.driver}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">{b.capacity}</TableCell>
                  <TableCell className="font-bold text-cyan-700 text-xs">{b.gpsLocation}</TableCell>
                  <TableCell><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">{b.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: DRIVERS & ROUTES */}
      {activeTab === 'drivers-routes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Drivers & Bus Stop Routes Management</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Route 1: Ikeja → Maryland → Ojota → School (14 Stops) • Route 2: Lekki → VI → Ikoyi → School (10 Stops).</p>
        </div>
      )}
    </div>
  )
}
