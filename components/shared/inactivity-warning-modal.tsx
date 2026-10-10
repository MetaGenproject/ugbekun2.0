'use client'

import React from 'react'
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react'

interface InactivityWarningModalProps {
  isOpen: boolean
  secondsRemaining: number
  onExtend: () => void
  onLogout: () => void
}

export function InactivityWarningModal({
  isOpen,
  secondsRemaining,
  onExtend,
  onLogout,
}: InactivityWarningModalProps) {
  if (!isOpen) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 text-white overflow-hidden">
        {/* Glow Ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
          {/* Pulsing Alert Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-500/20" />
            <Clock className="w-8 h-8 relative z-10" />
          </div>

          <div className="space-y-2">
            <h3 id="inactivity-title" className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Are you still there?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
              You have been inactive for a while. For security, your session will automatically end in:
            </p>
          </div>

          {/* Countdown Clock Badge */}
          <div className="px-6 py-3 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-inner">
            <span className="font-mono text-3xl font-black tracking-wider text-amber-400">
              {formattedTime}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Any keyboard or mouse activity will also keep your session active.
          </p>

          {/* Actions */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onExtend}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Keep Working
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
