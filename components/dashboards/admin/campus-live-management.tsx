'use client'

import { useState } from 'react'
import {
  Video,
  Play,
  Users,
  Calendar,
  Sparkles,
  Radio,
  FileVideo,
  Download,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Search,
  Globe,
  UserCheck,
  Award
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

type CampusLiveTab = 
  | 'live-classes' 
  | 'staff-meetings' 
  | 'parent-meetings' 
  | 'pta-meetings' 
  | 'student-training' 
  | 'school-events' 
  | 'webinar' 
  | 'meeting-recordings'

export function CampusLiveManagement() {
  const [activeTab, setActiveTab] = useState<CampusLiveTab>('live-classes')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLiveActive, setIsLiveActive] = useState(false)

  // Live Meetings State
  const [liveClasses, setLiveClasses] = useState<Array<{ id: string; title: string; host: string; time: string; status: string; attendees: number }>>([])
  const [staffMeetings, setStaffMeetings] = useState<Array<{ id: string; title: string; host: string; date: string; participants: number; status: string }>>([])
  const [ptaMeetings, setPtaMeetings] = useState<Array<{ id: string; title: string; host: string; date: string; participants: number; status: string }>>([])
  const [recordings, setRecordings] = useState<Array<{ id: string; title: string; duration: string; date: string; size: string; format: string }>>([])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-red-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Video className="text-rose-600" size={24} /> Campus Live Virtual Classroom & Video Suite
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Live virtual classes, staff briefings, PTA townhalls, webinars, school event streams, and cloud recordings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveActive(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer animate-pulse"
            >
              <Radio size={15} /> Start Instant Live Stream
            </button>
          </div>
        </div>
      </div>

      {/* Live Video Call Simulator Container (If active) */}
      {isLiveActive && (
        <div className="p-6 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-black text-sm text-white">LIVE: Campus Broadcast Studio</h3>
            </div>
            <button onClick={() => setIsLiveActive(false)} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg">
              End Broadcast
            </button>
          </div>

          <div className="h-64 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Video size={48} className="text-slate-600" />
            <p className="font-bold text-xs text-slate-300">Live Video Stream Transmitting in Full HD</p>
            <p className="text-[11px] text-slate-500">28 Active Viewers Connected • Screen Share Active</p>
          </div>
        </div>
      )}

      {/* 8 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('live-classes')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'live-classes' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📹 Live Classes
        </button>
        <button onClick={() => setActiveTab('staff-meetings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-meetings' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          👥 Staff Meetings
        </button>
        <button onClick={() => setActiveTab('parent-meetings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'parent-meetings' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          👨‍👩‍👧 Parent Meetings
        </button>
        <button onClick={() => setActiveTab('pta-meetings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'pta-meetings' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏫 PTA Meetings
        </button>
        <button onClick={() => setActiveTab('student-training')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'student-training' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎓 Student Training
        </button>
        <button onClick={() => setActiveTab('school-events')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-events' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎉 School Events Live
        </button>
        <button onClick={() => setActiveTab('webinar')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'webinar' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🌐 Webinars
        </button>
        <button onClick={() => setActiveTab('meeting-recordings')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'meeting-recordings' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎬 Meeting Recordings
        </button>
      </div>

      {/* 1. LIVE CLASSES */}
      {activeTab === 'live-classes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Virtual Classroom Sessions</h3>
              <p className="text-xs text-slate-500 font-medium font-medium">Schedule and launch interactive live classes for student streams.</p>
            </div>
            <button onClick={() => alert('Scheduling Live Class...')} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl">Schedule Live Class</button>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Session ID</TableHead><TableHead>Classroom Title</TableHead><TableHead>Instructor</TableHead><TableHead>Time Slot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {liveClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No live virtual classrooms running or scheduled at this time.
                  </TableCell>
                </TableRow>
              ) : (
                liveClasses.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-rose-700">{c.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{c.title}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.host}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">{c.time}</TableCell>
                    <TableCell><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${c.status === 'Live Now' ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>{c.status}</span></TableCell>
                    <TableCell className="text-right"><button onClick={() => setIsLiveActive(true)} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">Join Classroom</button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 2. STAFF MEETINGS */}
      {activeTab === 'staff-meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Principal & Staff Virtual Conferences</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Meeting ID</TableHead><TableHead>Subject</TableHead><TableHead>Organizer</TableHead><TableHead>Scheduled Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {staffMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No upcoming staff conferences scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                staffMeetings.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-bold text-slate-800">{m.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{m.title}</TableCell>
                    <TableCell className="text-xs text-slate-600">{m.host}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">{m.date}</TableCell>
                    <TableCell className="text-right"><button onClick={() => alert('Joining Staff Meeting...')} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">Enter Room</button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 3. PARENT MEETINGS */}
      {activeTab === 'parent-meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Schedule 1-on-1 Parent Consultation Call</h3>
          <input type="text" placeholder="Parent Name (e.g. Mr. Okafor)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <input type="datetime-local" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <button onClick={() => alert('Parent Consultation Scheduled!')} className="px-4 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl">Schedule Consultation</button>
        </div>
      )}

      {/* 4. PTA MEETINGS */}
      {activeTab === 'pta-meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Parent-Teacher Association (PTA) Virtual Townhall</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Meeting Ref</TableHead><TableHead>Townhall Agenda</TableHead><TableHead>Date & Time</TableHead><TableHead>RSVP Attendees</TableHead></TableRow></TableHeader>
            <TableBody>
              {ptaMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium text-xs">
                    No active PTA townhall meetings scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                ptaMeetings.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-rose-700">{p.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">{p.date}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-900">{p.participants} Parents</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. STUDENT TRAINING */}
      {activeTab === 'student-training' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Student Skill Workshops & Training Seminars</h3>
          <p className="text-xs text-slate-500 font-medium">Coding & AI Robotics Workshop • Exam Technique & Study Skills Seminar.</p>
        </div>
      )}

      {/* 6. SCHOOL EVENTS */}
      {activeTab === 'school-events' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Live Stream School Ceremony & Events</h3>
          <p className="text-xs text-slate-500 font-medium">Inter-House Sports Broadcast • 2026 Graduation Ceremony Stream.</p>
        </div>
      )}

      {/* 7. WEBINAR */}
      {activeTab === 'webinar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Host Educational Webinar Stream</h3>
          <input type="text" placeholder="Webinar Title (e.g. Modern Parenting in the Digital Age)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <button onClick={() => alert('Webinar Created!')} className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Create Webinar Link</button>
        </div>
      )}

      {/* 8. MEETING RECORDINGS */}
      {activeTab === 'meeting-recordings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileVideo className="text-rose-600" size={20} /> Cloud Meeting Video Archive
              </h3>
              <p className="text-xs text-slate-500 font-medium">Playback or download past recorded live classes and townhalls.</p>
            </div>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Record ID</TableHead><TableHead>Video Title</TableHead><TableHead>Duration</TableHead><TableHead>Recorded Date</TableHead><TableHead>Format & Size</TableHead><TableHead className="text-right">Download</TableHead></TableRow></TableHeader>
            <TableBody>
              {recordings.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{r.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{r.title}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{r.duration}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{r.date}</TableCell>
                  <TableCell className="text-xs text-slate-600">{r.format} ({r.size})</TableCell>
                  <TableCell className="text-right"><button onClick={() => alert(`Downloading ${r.title} MP4...`)} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">Download MP4</button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
