'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Building2,
  Users,
  Sliders,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  Bell,
  Sparkles,
  Clock,
  Coins,
  Upload,
  Image as ImageIcon,
  Bus,
  CreditCard,
  Smartphone,
  Key,
  Database,
  History,
  SmartphoneNfc,
  Calendar,
  Check
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

type SettingsTab = 
  | 'school-info' 
  | 'branding' 
  | 'academic-session' 
  | 'school-calendar' 
  | 'roles-permissions' 
  | 'myeduride' 
  | 'payment-gateway' 
  | 'sms-email' 
  | 'api-webhooks' 
  | 'ose-ai' 
  | 'backup-restore' 
  | 'audit-logs' 
  | 'pwa-settings'

export function BranchSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('school-info')
  const [isSaving, setIsSaving] = useState(false)

  // School Info Form
  const [schoolName, setSchoolName] = useState('Ugbekun International Academy')
  const [address, setAddress] = useState('Plot 12, Education City Boulevard, Ikeja, Lagos')
  const [phone, setPhone] = useState('+234 800 UGBEKUN')
  const [email, setEmail] = useState('admin@ugbekunschools.edu.ng')

  // Academic Session
  const [session, setSession] = useState('2025/2026')
  const [term, setTerm] = useState('1st Term')

  // Payment Gateway Keys
  const [paystackKey, setPaystackKey] = useState('pk_live_9482910482018402')
  const [flutterwaveKey, setFlutterwaveKey] = useState('FLWSECK-f8941094-X')

  // SMS Gateway
  const [smsSenderId, setSmsSenderId] = useState('UGBEKUN SCH')
  const [smsApiKey, setSmsApiKey] = useState('TL_849204918204')

  // OSe AI Settings
  const [aiTemperature, setAiTemperature] = useState('0.7')
  const [aiAutoComment, setAiAutoComment] = useState(true)

  // PWA Settings
  const [pwaAppName, setPwaAppName] = useState('Ugbekun Portal')
  const [pwaShortName, setPwaShortName] = useState('Ugbekun')

  // Audit Logs Sample
  const [auditLogs, setAuditLogs] = useState([
    { id: 'LOG-001', user: 'Admin (Ebuka)', action: 'Updated School Fee Schedule', ip: '197.210.65.12', date: '2026-08-02 14:15' },
    { id: 'LOG-002', user: 'Admin (Ebuka)', action: 'Published 1st Term Results', ip: '197.210.65.12', date: '2026-08-01 16:40' },
  ])

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      alert('System Settings saved & synchronized successfully!')
    }, 800)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="text-slate-700" size={24} /> System Configuration & Settings
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              School profiles, branding, session terms, user permissions, gateways, AI configuration, and PWA setup.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin text-amber-400" /> : <Save size={15} />} Save All Changes
          </button>
        </div>
      </div>

      {/* 13 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('school-info')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-info' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏫 School Information
        </button>
        <button onClick={() => setActiveTab('branding')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'branding' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎨 Branding
        </button>
        <button onClick={() => setActiveTab('academic-session')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'academic-session' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🗓️ Academic Session
        </button>
        <button onClick={() => setActiveTab('school-calendar')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📅 School Calendar
        </button>
        <button onClick={() => setActiveTab('roles-permissions')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'roles-permissions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔐 Roles & Permissions
        </button>
        <button onClick={() => setActiveTab('myeduride')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'myeduride' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🚌 MyEduRide Integration
        </button>
        <button onClick={() => setActiveTab('payment-gateway')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'payment-gateway' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💳 Payment Gateway
        </button>
        <button onClick={() => setActiveTab('sms-email')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'sms-email' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 SMS & Email
        </button>
        <button onClick={() => setActiveTab('api-webhooks')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'api-webhooks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔑 API & Webhooks
        </button>
        <button onClick={() => setActiveTab('ose-ai')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'ose-ai' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🤖 OSe AI Settings
        </button>
        <button onClick={() => setActiveTab('backup-restore')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'backup-restore' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💾 Backup & Restore
        </button>
        <button onClick={() => setActiveTab('audit-logs')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'audit-logs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📜 Audit Logs
        </button>
        <button onClick={() => setActiveTab('pwa-settings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'pwa-settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 PWA Settings
        </button>
      </div>

      {/* 1. SCHOOL INFORMATION */}
      {activeTab === 'school-info' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">General School Information</h3>
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" placeholder="School Name" />
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" placeholder="Campus Address" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" placeholder="Phone" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" placeholder="Email" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Info</button>
          </form>
        </div>
      )}

      {/* 2. BRANDING */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Logo, Crest & Theme Colors</h3>
          <p className="text-xs text-slate-500 font-medium">Upload school crest, principal signature PNG, and primary theme colors.</p>
          <div className="p-4 border border-dashed rounded-xl bg-slate-50 text-center text-xs font-bold text-slate-600">
            Upload School Crest Logo (PNG / SVG)
          </div>
        </div>
      )}

      {/* 3. ACADEMIC SESSION */}
      {activeTab === 'academic-session' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Current Academic Session & Term</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={session} onChange={e => setSession(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-bold"><option value="2025/2026">2025/2026 Session</option><option value="2026/2027">2026/2027 Session</option></select>
            <select value={term} onChange={e => setTerm(e.target.value)} className="p-2.5 border rounded-xl text-xs bg-slate-50 font-bold"><option value="1st Term">1st Term</option><option value="2nd Term">2nd Term</option><option value="3rd Term">3rd Term</option></select>
          </div>
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Update Session</button>
        </div>
      )}

      {/* 4. SCHOOL CALENDAR */}
      {activeTab === 'school-calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">School Calendar & Key Dates</h3>
          <p className="text-xs text-slate-500 font-medium">Term Resumption: August 10, 2026 • Mid-Term Break: October 15, 2026.</p>
        </div>
      )}

      {/* 5. USER ROLES & PERMISSIONS */}
      {activeTab === 'roles-permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Access Control Matrix (Roles & Permissions)</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Role Title</TableHead><TableHead>Scope</TableHead><TableHead>Permissions</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-bold">Super Admin</TableCell><TableCell>Global</TableCell><TableCell className="text-xs text-emerald-700 font-bold">Full Access</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Branch Admin</TableCell><TableCell>Branch</TableCell><TableCell className="text-xs text-emerald-700 font-bold">Full Branch Management</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Teacher</TableCell><TableCell>Classroom</TableCell><TableCell className="text-xs text-slate-700">Grades, Attendance, Lessons</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. MYEDURIDE INTEGRATION */}
      {activeTab === 'myeduride' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">MyEduRide API Credentials & Gate Sync</h3>
          <input type="text" defaultValue="EDURIDE-LIVE-KEY-948291" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold text-cyan-700" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Integration</button>
        </div>
      )}

      {/* 7. PAYMENT GATEWAY */}
      {activeTab === 'payment-gateway' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Online Fee Payment Gateways (Paystack & Flutterwave)</h3>
          <input type="text" value={paystackKey} onChange={e => setPaystackKey(e.target.value)} placeholder="Paystack Secret Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold" />
          <input type="text" value={flutterwaveKey} onChange={e => setFlutterwaveKey(e.target.value)} placeholder="Flutterwave Public Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Payment Keys</button>
        </div>
      )}

      {/* 8. SMS & EMAIL */}
      {activeTab === 'sms-email' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Termii / Twilio SMS Gateway & SMTP Mail Server</h3>
          <input type="text" value={smsSenderId} onChange={e => setSmsSenderId(e.target.value)} placeholder="SMS Sender ID" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <input type="text" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder="SMS API Key" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save Messaging Config</button>
        </div>
      )}

      {/* 9. API & WEBHOOKS */}
      {activeTab === 'api-webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Developer API Keys & Webhook Endpoints</h3>
          <input type="text" defaultValue="https://ugbekun.edu.ng/api/v1/webhooks/paystack" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono" />
          <button onClick={() => alert('New API Secret Generated!')} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Generate New API Key</button>
        </div>
      )}

      {/* 10. OSE AI SETTINGS */}
      {activeTab === 'ose-ai' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} /> OSe AI Model & Auto-Assist Rules
          </h3>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={aiAutoComment} onChange={e => setAiAutoComment(e.target.checked)} /> Auto-Generate Report Card Remarks with OSe Engine
          </label>
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save OSe Settings</button>
        </div>
      )}

      {/* 11. BACKUP & RESTORE */}
      {activeTab === 'backup-restore' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4 text-center">
          <Database size={32} className="text-indigo-600 mx-auto" />
          <h3 className="font-black text-base text-slate-900">Database Backup & Recovery</h3>
          <p className="text-xs text-slate-500 font-medium">Automatic daily cloud snapshot enabled at 02:00 AM.</p>
          <button onClick={() => alert('Backup Created & Saved to Cloud!')} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Create Manual Database Backup</button>
        </div>
      )}

      {/* 12. AUDIT LOGS */}
      {activeTab === 'audit-logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">System Security Audit Log Trail</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Log ID</TableHead><TableHead>User</TableHead><TableHead>Action Performed</TableHead><TableHead>IP Address</TableHead><TableHead>Date & Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {auditLogs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{l.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{l.user}</TableCell>
                  <TableCell className="text-xs text-slate-700">{l.action}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.ip}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 13. PWA SETTINGS */}
      {activeTab === 'pwa-settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <SmartphoneNfc className="text-indigo-600" size={18} /> Progressive Web App (PWA) Manifest Settings
          </h3>
          <input type="text" value={pwaAppName} onChange={e => setPwaAppName(e.target.value)} placeholder="PWA App Name" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <input type="text" value={pwaShortName} onChange={e => setPwaShortName(e.target.value)} placeholder="Home Screen Short Name" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <button onClick={handleSaveSettings} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Save PWA Manifest</button>
        </div>
      )}
    </div>
  )
}
