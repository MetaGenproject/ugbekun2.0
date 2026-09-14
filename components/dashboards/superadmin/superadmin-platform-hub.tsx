'use client'

import { useEffect, useState } from 'react'
import {
  Bus,
  CreditCard,
  Mail,
  Key,
  Sparkles,
  Database,
  History,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

type HubTab = 'myeduride' | 'payment' | 'sms-email' | 'api-webhooks' | 'ose-ai' | 'backup' | 'audit'

interface PlatformSettings {
  myedurideEnabled: boolean
  myedurideApiUrl: string
  myedurideApiKeyMasked: string
  myedurideWebhookSecretMasked: string
  paymentsEnabled: boolean
  paystackPublicKey: string
  paystackSecretKeyMasked: string
  flutterwavePublicKey: string
  flutterwaveSecretKeyMasked: string
  smsEnabled: boolean
  smsProvider: string
  smsSenderId: string
  smsApiKeyMasked: string
  smsWebhookUrl: string
  emailEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassMasked: string
  smtpFrom: string
  oseEnabled: boolean
  oseApiKeyMasked: string
  oseModel: string
  oseTemperature: string
}

interface ApiKeyItem {
  id: number
  name: string
  keyPrefix: string
  keyLastFour: string
  scopes?: string | null
  active: boolean
  createdAt: string
}

interface WebhookItem {
  id: number
  name: string
  url: string
  eventTypes: string
  secret?: string | null
  active: boolean
}

interface BackupItem {
  id: number
  label: string
  status: string
  notes?: string | null
  createdAt: string
}

interface AuditItem {
  id: number
  actor: string
  action: string
  entity?: string | null
  details?: string | null
  ipAddress?: string | null
  createdAt: string
}

const TABS: { id: HubTab; label: string }[] = [
  { id: 'myeduride', label: 'MyEduRide' },
  { id: 'payment', label: 'Payment Gateway' },
  { id: 'sms-email', label: 'SMS & Email' },
  { id: 'api-webhooks', label: 'API & Webhooks' },
  { id: 'ose-ai', label: 'OSe AI' },
  { id: 'backup', label: 'Backup & Restore' },
  { id: 'audit', label: 'Audit Logs' },
]

export function SuperadminPlatformHub({ initialTab = 'myeduride' }: { initialTab?: HubTab }) {
  const [tab, setTab] = useState<HubTab>(initialTab)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([])
  const [form, setForm] = useState<Record<string, any>>({})
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [hookName, setHookName] = useState('')
  const [hookUrl, setHookUrl] = useState('')
  const [hookEvents, setHookEvents] = useState('platform.updated')
  const [editingHook, setEditingHook] = useState<WebhookItem | null>(null)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const flash = (message: string, kind: 'ok' | 'err') => {
    if (kind === 'ok') {
      setSuccess(message)
      setError(null)
      setTimeout(() => setSuccess(null), 3500)
    } else {
      setError(message)
      setSuccess(null)
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{
        success: boolean
        settings: PlatformSettings
        apiKeys: ApiKeyItem[]
        webhooks: WebhookItem[]
        backups: BackupItem[]
        auditLogs: AuditItem[]
      }>(endpoints.superadmin.platform)
      setSettings(res.settings)
      setApiKeys(res.apiKeys || [])
      setWebhooks(res.webhooks || [])
      setBackups(res.backups || [])
      setAuditLogs(res.auditLogs || [])
      setForm({
        ...res.settings,
        myedurideApiKey: '',
        myedurideWebhookSecret: '',
        paystackSecretKey: '',
        flutterwaveSecretKey: '',
        smsApiKey: '',
        smtpPass: '',
        oseApiKey: '',
      })
    } catch (err: any) {
      flash(err.message || 'Failed to load global platform settings.', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveSettings = async (payload: Record<string, unknown>, ok = 'Global settings saved.') => {
    setSaving(true)
    try {
      await apiSlice.put(endpoints.superadmin.platform, payload)
      flash(ok, 'ok')
      await load()
    } catch (err: any) {
      flash(err.message || 'Failed to save settings.', 'err')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: string, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={opts?.type || 'text'}
        value={form[key] ?? ''}
        placeholder={opts?.placeholder}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
      />
    </div>
  )

  const toggle = (key: string, label: string) => (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
      <input
        type="checkbox"
        checked={Boolean(form[key])}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
      />
      {label}
    </label>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Global Integrations</h2>
          <p className="text-xs text-slate-500 font-medium">These settings apply to every school on the platform.</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Reload
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 ${tab === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="animate-spin mx-auto text-slate-400" />
        </div>
      ) : (
        <>
          {tab === 'myeduride' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 max-w-2xl">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Bus size={18} /> MyEduRide Integration</h3>
              {toggle('myedurideEnabled', 'Enable MyEduRide globally')}
              {field('myedurideApiUrl', 'API URL')}
              {field('myedurideApiKey', 'API Key', { placeholder: settings?.myedurideApiKeyMasked || 'Paste a new key to replace' })}
              {field('myedurideWebhookSecret', 'Webhook secret', { placeholder: settings?.myedurideWebhookSecretMasked || 'Paste a new secret to replace' })}
              <button type="button" disabled={saving} onClick={() => saveSettings({
                myedurideEnabled: form.myedurideEnabled,
                myedurideApiUrl: form.myedurideApiUrl,
                myedurideApiKey: form.myedurideApiKey,
                myedurideWebhookSecret: form.myedurideWebhookSecret,
              }, 'MyEduRide settings saved.')} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">
                {saving ? 'Saving...' : 'Save MyEduRide'}
              </button>
            </div>
          )}

          {tab === 'payment' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 max-w-2xl">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><CreditCard size={18} /> Payment Gateways</h3>
              {toggle('paymentsEnabled', 'Enable online payments globally')}
              {field('paystackPublicKey', 'Paystack public key')}
              {field('paystackSecretKey', 'Paystack secret key', { placeholder: settings?.paystackSecretKeyMasked || 'Paste a new key to replace' })}
              {field('flutterwavePublicKey', 'Flutterwave public key')}
              {field('flutterwaveSecretKey', 'Flutterwave secret key', { placeholder: settings?.flutterwaveSecretKeyMasked || 'Paste a new key to replace' })}
              <button type="button" disabled={saving} onClick={() => saveSettings({
                paymentsEnabled: form.paymentsEnabled,
                paystackPublicKey: form.paystackPublicKey,
                paystackSecretKey: form.paystackSecretKey,
                flutterwavePublicKey: form.flutterwavePublicKey,
                flutterwaveSecretKey: form.flutterwaveSecretKey,
              }, 'Payment gateway settings saved.')} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">
                {saving ? 'Saving...' : 'Save payment keys'}
              </button>
            </div>
          )}

          {tab === 'sms-email' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 max-w-2xl">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Mail size={18} /> SMS & Email</h3>
              {toggle('smsEnabled', 'Enable SMS globally')}
              {field('smsProvider', 'SMS provider')}
              {field('smsSenderId', 'SMS sender ID')}
              {field('smsWebhookUrl', 'SMS webhook URL')}
              {field('smsApiKey', 'SMS API / webhook token', { placeholder: settings?.smsApiKeyMasked || 'Paste a new token to replace' })}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                {toggle('emailEnabled', 'Enable SMTP email globally')}
                {field('smtpHost', 'SMTP host')}
                {field('smtpPort', 'SMTP port')}
                {field('smtpUser', 'SMTP user')}
                {field('smtpPass', 'SMTP password', { type: 'password', placeholder: settings?.smtpPassMasked || 'Paste a new password to replace' })}
                {field('smtpFrom', 'From address')}
              </div>
              <button type="button" disabled={saving} onClick={() => saveSettings({
                smsEnabled: form.smsEnabled,
                smsProvider: form.smsProvider,
                smsSenderId: form.smsSenderId,
                smsWebhookUrl: form.smsWebhookUrl,
                smsApiKey: form.smsApiKey,
                emailEnabled: form.emailEnabled,
                smtpHost: form.smtpHost,
                smtpPort: form.smtpPort,
                smtpUser: form.smtpUser,
                smtpPass: form.smtpPass,
                smtpFrom: form.smtpFrom,
              }, 'SMS and email settings saved.')} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">
                {saving ? 'Saving...' : 'Save messaging config'}
              </button>
            </div>
          )}

          {tab === 'api-webhooks' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <h3 className="font-black text-slate-900 flex items-center gap-2"><Key size={18} /> Platform API Keys</h3>
                <div className="flex gap-2">
                  <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name e.g. Finance webhook" className="flex-1 px-3 py-2.5 border rounded-xl text-xs" />
                  <button type="button" className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1" onClick={async () => {
                    if (!newKeyName.trim()) return
                    try {
                      const res = await apiSlice.post<{ success: boolean; apiKey: string; message: string }>(endpoints.superadmin.platformApiKeys, { name: newKeyName.trim() })
                      setRevealedKey(res.apiKey)
                      setNewKeyName('')
                      flash(res.message, 'ok')
                      await load()
                    } catch (err: any) {
                      flash(err.message, 'err')
                    }
                  }}><Plus size={14} /> Create</button>
                </div>
                {revealedKey && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono break-all">{revealedKey}</div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-500 border-b"><th className="text-left py-2">Name</th><th>Key</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="border-b border-slate-50">
                          <td className="py-2 font-bold">{key.name}</td>
                          <td className="font-mono">{key.keyPrefix}…{key.keyLastFour}</td>
                          <td>{key.active ? 'Active' : 'Disabled'}</td>
                          <td className="text-right">
                            <button className="p-1.5" onClick={async () => { await apiSlice.put(endpoints.superadmin.platformApiKey(key.id), { active: !key.active }); await load() }}><Pencil size={13} /></button>
                            <button className="p-1.5 text-rose-600" onClick={async () => { await apiSlice.delete(endpoints.superadmin.platformApiKey(key.id)); await load() }}><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <h3 className="font-black text-slate-900">Webhooks</h3>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input value={hookName} onChange={(e) => setHookName(e.target.value)} placeholder="Name" className="px-3 py-2.5 border rounded-xl text-xs" />
                  <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://..." className="px-3 py-2.5 border rounded-xl text-xs" />
                  <input value={hookEvents} onChange={(e) => setHookEvents(e.target.value)} placeholder="platform.updated" className="px-3 py-2.5 border rounded-xl text-xs" />
                </div>
                <button type="button" className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl" onClick={async () => {
                  try {
                    if (editingHook) {
                      await apiSlice.put(endpoints.superadmin.platformWebhook(editingHook.id), { name: hookName, url: hookUrl, eventTypes: hookEvents })
                      setEditingHook(null)
                    } else {
                      await apiSlice.post(endpoints.superadmin.platformWebhooks, { name: hookName, url: hookUrl, eventTypes: hookEvents })
                    }
                    setHookName(''); setHookUrl(''); setHookEvents('platform.updated')
                    flash('Webhook saved.', 'ok')
                    await load()
                  } catch (err: any) {
                    flash(err.message, 'err')
                  }
                }}>{editingHook ? 'Update webhook' : 'Create webhook'}</button>
                {webhooks.map((hook) => (
                  <div key={hook.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-3 py-2 text-xs">
                    <div>
                      <p className="font-bold">{hook.name}</p>
                      <p className="text-slate-500 font-mono">{hook.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingHook(hook); setHookName(hook.name); setHookUrl(hook.url); setHookEvents(hook.eventTypes) }}><Pencil size={13} /></button>
                      <button className="text-blue-700 font-bold" onClick={async () => { await apiSlice.post(endpoints.superadmin.testPlatformWebhook(hook.id), {}); flash('Test webhook dispatched.', 'ok') }}>Test</button>
                      <button className="text-rose-600" onClick={async () => { await apiSlice.delete(endpoints.superadmin.platformWebhook(hook.id)); await load() }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ose-ai' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 max-w-2xl">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} /> OSe AI</h3>
              {toggle('oseEnabled', 'Enable OSe AI globally')}
              {field('oseApiKey', 'DeepSeek / OSe API key', { placeholder: settings?.oseApiKeyMasked || 'Paste a new key to replace' })}
              {field('oseModel', 'Model')}
              {field('oseTemperature', 'Temperature')}
              <button type="button" disabled={saving} onClick={() => saveSettings({
                oseEnabled: form.oseEnabled,
                oseApiKey: form.oseApiKey,
                oseModel: form.oseModel,
                oseTemperature: form.oseTemperature,
              }, 'OSe AI settings saved.')} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">
                {saving ? 'Saving...' : 'Save OSe AI'}
              </button>
            </div>
          )}

          {tab === 'backup' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Database size={18} /> Backup & Restore</h3>
              <button type="button" className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl" onClick={async () => {
                await apiSlice.post(endpoints.superadmin.platformBackups, {})
                flash('Backup created.', 'ok')
                await load()
              }}>Create backup</button>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-500 border-b"><th className="text-left py-2">Label</th><th>Status</th><th>Created</th><th></th></tr></thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.id} className="border-b border-slate-50">
                        <td className="py-2 font-bold">{backup.label}</td>
                        <td>{backup.status}</td>
                        <td>{new Date(backup.createdAt).toLocaleString()}</td>
                        <td className="text-right space-x-2">
                          <button className="font-bold text-blue-700" onClick={async () => { await apiSlice.post(endpoints.superadmin.restorePlatformBackup(backup.id), {}); flash('Backup restored.', 'ok'); await load() }}>Restore</button>
                          <button className="text-rose-600" onClick={async () => { await apiSlice.delete(endpoints.superadmin.platformBackup(backup.id)); await load() }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2"><History size={18} /> Audit Logs</h3>
                <button type="button" className="text-xs font-bold text-rose-600" onClick={async () => { await apiSlice.delete(endpoints.superadmin.platformAuditLogs); await load() }}>Clear all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-500 border-b"><th className="text-left py-2">Time</th><th>Actor</th><th>Action</th><th>Details</th><th></th></tr></thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50">
                        <td className="py-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="font-bold">{log.actor}</td>
                        <td>{log.action} {log.entity}</td>
                        <td className="text-slate-500">{log.details}</td>
                        <td><button className="text-rose-600" onClick={async () => { await apiSlice.delete(endpoints.superadmin.platformAuditLog(log.id)); await load() }}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
