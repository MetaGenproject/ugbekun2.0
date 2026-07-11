'use client'

import { useState, useEffect, useRef } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Video, Calendar, X, AlertCircle, Loader2, Play } from 'lucide-react'

interface LiveRoom {
  id: number
  title: string
  roomName: string
  type: 'STAFF_ALIGNMENT' | 'STUDENT_CLASSROOM'
  scheduledAt: string
  durationMins: number
  isLive: boolean
}

export function StudentLiveClassrooms() {
  const [rooms, setRooms] = useState<LiveRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active meeting states
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null)
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  const fetchRooms = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${endpoints.student.profile.split('/profile')[0]}/live-rooms`
      const res = await apiSlice.get<{ success: boolean; rooms: LiveRoom[] }>(url)
      if (res.success) {
        setRooms(res.rooms)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load virtual classrooms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleJoinClick = async (room: LiveRoom) => {
    setError(null)
    try {
      const url = `${endpoints.student.profile.split('/profile')[0]}/live-rooms/${room.roomName}/token`
      const res = await apiSlice.get<{ success: boolean; token: string; roomName: string }>(url)
      if (res.success) {
        setActiveRoomName(res.roomName)
        setActiveToken(res.token)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to obtain classroom authorization.')
    }
  }

  // Load Jitsi script and initialize
  useEffect(() => {
    if (activeRoomName && activeToken && typeof window !== 'undefined') {
      const domain = 'meet.jit.si'
      const loadJitsiScript = () => {
        const existingScript = document.getElementById('jitsi-script')
        if (existingScript) {
          initializeJitsi(domain)
          return
        }

        const script = document.createElement('script')
        script.id = 'jitsi-script'
        script.src = `https://${domain}/external_api.js`
        script.async = true
        script.onload = () => initializeJitsi(domain)
        document.body.appendChild(script)
      }

      const initializeJitsi = (jitsiDomain: string) => {
        if (apiRef.current) {
          apiRef.current.dispose()
        }

        // @ts-ignore
        if (window.JitsiMeetExternalAPI) {
          // @ts-ignore
          apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
            roomName: activeRoomName,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            jwt: activeToken,
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              enableWelcomePage: false
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false
            }
          })
        }
      }

      loadJitsiScript()

      return () => {
        if (apiRef.current) {
          apiRef.current.dispose()
          apiRef.current = null
        }
      }
    }
  }, [activeRoomName, activeToken])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-sky-800 via-teal-700 to-emerald-800 p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-white/25 rounded-full border border-white/30 shadow-sm inline-block">
            Live Stream Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Virtual Classrooms</h1>
          <p className="text-white/80 text-sm max-w-xl font-medium">
            Connect instantly with your subject instructors and study groups in secure, live virtual meeting rooms.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Embedded Meeting Frame */}
      {activeRoomName && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <h3 className="text-sm font-black">Virtual Call Connected: {activeRoomName}</h3>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`https://meet.jit.si/${activeRoomName}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black shadow-xs"
              >
                Open in Full Window
              </a>
              <button
                onClick={() => {
                  if (apiRef.current) apiRef.current.dispose()
                  setActiveRoomName(null)
                  setActiveToken(null)
                  fetchRooms()
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          <div
            ref={jitsiContainerRef}
            id="jitsi-container"
            className="w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80"
          />
        </div>
      )}

      {/* Directory Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Calendar size={16} className="text-slate-600" /> Class Meetings Scheduled
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <Loader2 size={24} className="animate-spin text-sky-600" />
            <p className="text-xs text-slate-400 font-semibold">Scanning schedule...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <Video className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-xs text-slate-400 font-semibold">No live classes scheduled at this time.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md uppercase border border-sky-100 bg-sky-50 text-sky-700">
                      Live Classroom
                    </span>
                    {room.isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{room.title}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Start: {new Date(room.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Duration: {room.durationMins} minutes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinClick(room)}
                  className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play size={12} fill="white" /> Join Live Classroom
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
