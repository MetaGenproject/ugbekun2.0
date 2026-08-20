'use client'

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Server,
  Copy,
  Lock,
  X
} from 'lucide-react'
import {
  SystemStatusPayload,
  SystemStatusType,
  SYSTEM_STATUS_PRESETS,
  StatusPresetConfig
} from '@/lib/systemStatus'

function StatusIcon({ iconType, className = '' }: { iconType: StatusPresetConfig['iconType']; className?: string }) {
  switch (iconType) {
    case 'spinner':
      return <Loader2 className={`animate-spin text-blue-600 ${className}`} size={20} />
    case 'check':
      return <CheckCircle2 className={`text-emerald-600 ${className}`} size={20} />
    case 'sparkles':
      return <Sparkles className={`text-emerald-600 ${className}`} size={20} />
    case 'alert':
      return <AlertCircle className={`text-rose-600 ${className}`} size={20} />
    case 'help':
      return <HelpCircle className={`text-amber-600 ${className}`} size={20} />
    case 'server':
      return <Server className={`text-red-700 ${className}`} size={20} />
    case 'copy':
      return <Copy className={`text-orange-600 ${className}`} size={20} />
    case 'lock':
      return <Lock className={`text-purple-600 ${className}`} size={20} />
    default:
      return <AlertCircle size={20} />
  }
}

/**
 * Floating Global Toast Notification Container
 */
export function SystemStatusToastContainer() {
  const [toasts, setToasts] = useState<SystemStatusPayload[]>([])

  useEffect(() => {
    const handleStatusEvent = (e: Event) => {
      const detail = (e as CustomEvent<SystemStatusPayload>).detail
      if (!detail) return

      setToasts((prev) => {
        // If updating an active processing toast or duplicate ID, replace it
        const existsIndex = prev.findIndex((t) => t.id === detail.id)
        if (existsIndex >= 0) {
          const updated = [...prev]
          updated[existsIndex] = detail
          return updated
        }
        return [detail, ...prev].slice(0, 5) // max 5 active toasts
      })

      // Auto dismiss if durationMs > 0
      if (detail.durationMs && detail.durationMs > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== detail.id))
        }, detail.durationMs)
      }
    }

    window.addEventListener('ugbekun_system_status', handleStatusEvent)
    return () => window.removeEventListener('ugbekun_system_status', handleStatusEvent)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map((toast) => {
        const preset = SYSTEM_STATUS_PRESETS[toast.type] || SYSTEM_STATUS_PRESETS.UNABLE
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border ${preset.borderColor} ${preset.bgColor} p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in flex items-start gap-3 relative`}
          >
            <div className="shrink-0 mt-0.5">
              <StatusIcon iconType={preset.iconType} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${preset.badgeBg} ${preset.badgeText}`}>
                  {toast.type.replace('_', ' ')}
                </span>
              </div>
              <h4 className={`text-xs font-black ${preset.textColor} mt-1 leading-snug`}>
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => toast.id && removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Inline Banner Component for Form/Modal States
 */
export function SystemStatusBanner({
  type,
  title,
  message,
  className = '',
}: {
  type: SystemStatusType
  title?: string
  message?: string
  className?: string
}) {
  const preset = SYSTEM_STATUS_PRESETS[type] || SYSTEM_STATUS_PRESETS.UNABLE

  return (
    <div className={`rounded-2xl border ${preset.borderColor} ${preset.bgColor} p-4 shadow-sm flex items-start gap-3 ${className}`}>
      <div className="shrink-0 mt-0.5">
        <StatusIcon iconType={preset.iconType} />
      </div>
      <div className="flex-1 min-w-0 text-xs">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${preset.badgeBg} ${preset.badgeText}`}>
          {type.replace('_', ' ')}
        </span>
        <h4 className={`font-black ${preset.textColor} mt-1`}>{title || preset.title}</h4>
        {message && <p className="text-slate-600 mt-0.5 font-medium">{message}</p>}
      </div>
    </div>
  )
}
