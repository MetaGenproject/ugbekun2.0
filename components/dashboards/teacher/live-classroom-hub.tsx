'use client'

import { useState, useEffect, useRef } from 'react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { Video, Calendar, Plus, X, Users, AlertCircle, Loader2, Play } from 'lucide-react'

interface TeacherProfile {
  id: number
  name: string
  subjectAssignments: Array<{
    classId: number
    className: string
    sectionId: number
    sectionName: string
    subjectId: number
    subjectName: string
  }>
}

interface LiveRoom {
  id: number
  title: string
  roomName: string
  type: 'STAFF_ALIGNMENT' | 'STUDENT_CLASSROOM'
  hostId: number
  classId: number | null
  sectionId: number | null
  scheduledAt: string
  durationMins: number
  isLive: boolean
}

interface LiveClassroomHubProps {
  profile: TeacherProfile
}

export function LiveClassroomHub({ profile }: LiveClassroomHubProps) {
  const [rooms, setRooms] = useState<LiveRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scheduling Form
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'STAFF_ALIGNMENT' | 'STUDENT_CLASSROOM'>('STUDENT_CLASSROOM')
  const [selectedAllocIdx, setSelectedAllocIdx] = useState('0')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMins, setDurationMins] = useState('45')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Active Meeting Frame
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null)
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  const fetchRooms = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/live-rooms`
      const res = await apiSlice.get<{ success: boolean; rooms: LiveRoom[] }>(url)
      if (res.success) {
        setRooms(res.rooms)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live classrooms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !scheduledAt) {
      alert('Please fill all fields.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const alloc = profile.subjectAssignments[parseInt(selectedAllocIdx)]
    const body: any = {
      title,
      roomName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
      type,
      scheduledAt,
      durationMins: parseInt(durationMins)
    }

    if (type === 'STUDENT_CLASSROOM' && alloc) {
      body.classId = alloc.classId
      body.sectionId = alloc.sectionId
    }

    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/live-rooms`
      const res = await apiSlice.post<{ success: boolean }>(url, body)
      if (res.success) {
        setShowScheduleModal(false)
        setTitle('')
        setScheduledAt('')
        fetchRooms()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinRoom = async (room: LiveRoom) => {
    setError(null)
    try {
      const url = `${endpoints.teacher.gradebookSheet.split('/gradebook')[0]}/live-rooms/${room.roomName}/token`
      const res = await apiSlice.get<{ success: boolean; token: string; roomName: string }>(url)
      if (res.success) {
        setActiveRoomName(res.roomName)
        setActiveToken(res.token)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join meeting.')
    }
  }

  // Load Jitsi meet external API
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
      <div className="relative rounded-2xl bg-gradient-to-r from-cyan-800 via-sky-700 to-blue-800 p-6 md:p-8 shadow-md overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-white/25 rounded-full border border-white/30 shadow-sm inline-block">
              Virtual Classroom Space
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Communication Hub</h1>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Launch live digital sessions for student classrooms or align internally with school staff members.
            </p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-sky-800 hover:bg-sky-50 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus size={15} /> Schedule Session
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Render Jitsi Meeting Screen */}
      {activeRoomName && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <h3 className="text-sm font-black">Live Video Stream: {activeRoomName}</h3>
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

      {/* Rooms List */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Calendar size={16} className="text-slate-600" /> Room Directories
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <Loader2 size={24} className="animate-spin text-sky-600" />
            <p className="text-xs text-slate-400 font-semibold">Loading directories...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <Video className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-xs text-slate-400 font-semibold">No virtual rooms scheduled yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase border ${
                      room.type === 'STAFF_ALIGNMENT'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {room.type === 'STAFF_ALIGNMENT' ? 'Staff Room' : 'Classroom'}
                    </span>

                    {room.isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Live
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
                  onClick={() => handleJoinRoom(room)}
                  className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play size={12} fill="white" /> Join Meeting Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-sky-700">
              <Calendar size={20} />
              <h3 className="text-base font-black">Schedule Live Stream</h3>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Math Q&A"
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Session Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="STUDENT_CLASSROOM">Student Classroom Session</option>
                  <option value="STAFF_ALIGNMENT">Staff Alignment Meeting</option>
                </select>
              </div>

              {type === 'STUDENT_CLASSROOM' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Assign Student Group *</label>
                  <select
                    value={selectedAllocIdx}
                    onChange={(e) => setSelectedAllocIdx(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    {profile.subjectAssignments.map((alloc, idx) => (
                      <option key={idx} value={idx}>
                        {alloc.className} • {alloc.subjectName} ({alloc.sectionName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Calendar size={13} />
                      Schedule
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
