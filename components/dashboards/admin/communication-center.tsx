'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Send,
  Users,
  UserCheck,
  Megaphone,
  Bell,
  Mail,
  Smartphone,
  Pin,
  Calendar,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Paperclip,
  Check,
  Download,
  Printer,
  ChevronRight,
  Radio,
  FileText
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

type CommunicationTab = 
  | 'inbox' 
  | 'staff-chat' 
  | 'parent-chat' 
  | 'school-broadcast' 
  | 'announcements' 
  | 'sms' 
  | 'email' 
  | 'push-notifications' 
  | 'notice-board' 
  | 'events'

interface ChatMessage {
  id: string
  sender: string
  role: string
  avatarText: string
  time: string
  lastMessage: string
  unread: boolean
}

export function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState<CommunicationTab>('inbox')
  const [searchQuery, setSearchQuery] = useState('')
  const [chatInput, setChatInput] = useState('')

  // Sample Chat Threads
  const [threads, setThreads] = useState<ChatMessage[]>([
    { id: '1', sender: 'Mrs. Victoria Adams', role: 'Teacher (Primary 4)', avatarText: 'VA', time: '10:24 AM', lastMessage: 'The lesson notes for next week have been uploaded for review.', unread: true },
    { id: '2', sender: 'Mr. Okafor (Parent)', role: 'Parent of Chinedu Okafor', avatarText: 'PO', time: '09:15 AM', lastMessage: 'Thank you for updating me regarding the upcoming STEM competition.', unread: true },
    { id: '3', sender: 'Dr. Samuel Biobaku', role: 'HOD Science', avatarText: 'SB', time: 'Yesterday', lastMessage: 'Science Lab equipment requisition has been submitted to Bursary.', unread: false },
    { id: '4', sender: 'Mrs. Bello (Parent)', role: 'Parent of Amina Bello', avatarText: 'PB', time: 'Yesterday', lastMessage: 'Received the 1st Term examination timetable, thank you!', unread: false },
  ])

  const [activeChatThread, setActiveChatThread] = useState<ChatMessage>(threads[0])

  // Sample Announcements
  const [announcements, setAnnouncements] = useState([
    { id: 'ANN-01', title: 'Resumption Date & Mid-Term Break Schedule', target: 'All Parents & Staff', date: '2026-08-01', pinned: true },
    { id: 'ANN-02', title: 'Inter-House Sports Competition Registration', target: 'Students & Parents', date: '2026-07-28', pinned: false },
  ])

  // Sample Events
  const [events, setEvents] = useState([
    { id: 'EV-101', title: 'Parent-Teacher Association (PTA) Meeting', date: '2026-08-12 10:00 AM', venue: 'Main Multipurpose Assembly Hall', rsvp: '142 Confirmed' },
    { id: 'EV-102', title: 'Annual Inter-House Sports Festival', date: '2026-08-25 09:00 AM', venue: 'School Sports Complex', rsvp: '380 Confirmed' },
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    alert(`Message sent to ${activeChatThread.sender}: "${chatInput}"`)
    setChatInput('')
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} /> Communication Hub (Powered by EduChat)
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Centralized inbox, EduChat staff & parent messaging, broadcasts, SMS, email, push notifications, and events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('school-broadcast')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Megaphone size={15} /> Send School Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* 10 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('inbox')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📥 Central Inbox
        </button>
        <button onClick={() => setActiveTab('staff-chat')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          💬 Staff Chat (EduChat)
        </button>
        <button onClick={() => setActiveTab('parent-chat')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'parent-chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          👨‍👩‍👧 Parent Chat
        </button>
        <button onClick={() => setActiveTab('school-broadcast')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'school-broadcast' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📢 School Broadcast
        </button>
        <button onClick={() => setActiveTab('announcements')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📣 Announcements
        </button>
        <button onClick={() => setActiveTab('sms')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'sms' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📱 SMS Dispatch
        </button>
        <button onClick={() => setActiveTab('email')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'email' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          ✉️ Email Portal
        </button>
        <button onClick={() => setActiveTab('push-notifications')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'push-notifications' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🔔 Push Notifications
        </button>
        <button onClick={() => setActiveTab('notice-board')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'notice-board' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📌 Notice Board
        </button>
        <button onClick={() => setActiveTab('events')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🗓️ School Events
        </button>
      </div>

      {/* 1. INBOX / 2. STAFF CHAT / 3. PARENT CHAT */}
      {(activeTab === 'inbox' || activeTab === 'staff-chat' || activeTab === 'parent-chat') && (
        <div className="grid lg:grid-cols-3 gap-6 bg-white rounded-2xl border border-slate-200/80 overflow-hidden min-h-[520px] shadow-sm">
          {/* Left Column: Chat List */}
          <div className="border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              {threads.map(t => (
                <div
                  key={t.id}
                  onClick={() => setActiveChatThread(t)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    activeChatThread.id === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      activeChatThread.id === t.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {t.avatarText}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs truncate">{t.sender}</p>
                      <p className={`text-[10px] truncate ${activeChatThread.id === t.id ? 'text-indigo-100' : 'text-slate-500'}`}>{t.lastMessage}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${activeChatThread.id === t.id ? 'text-indigo-200' : 'text-slate-400'}`}>{t.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="lg:col-span-2 p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm">
                  {activeChatThread.avatarText}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{activeChatThread.sender}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{activeChatThread.role}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● EduChat Online
              </span>
            </div>

            {/* Chat Conversation Display */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 max-w-md space-y-1">
                <p className="text-xs text-slate-800 font-medium">{activeChatThread.lastMessage}</p>
                <p className="text-[10px] text-slate-400 font-mono text-right">{activeChatThread.time}</p>
              </div>

              <div className="p-3.5 bg-indigo-600 text-white rounded-2xl ml-auto max-w-md space-y-1">
                <p className="text-xs font-medium">Thank you for your message. We have recorded your update on the portal.</p>
                <p className="text-[10px] text-indigo-200 font-mono text-right">Just now</p>
              </div>
            </div>

            {/* Send Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Type your EduChat response..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              />
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. SCHOOL BROADCAST */}
      {activeTab === 'school-broadcast' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Megaphone className="text-indigo-600" size={20} /> Multi-Channel School Broadcast Engine
          </h3>
          <p className="text-xs text-slate-500 font-medium">Dispatch instant messages to all parents, staff, or specific class streams via EduChat & SMS.</p>
          <form onSubmit={e => { e.preventDefault(); alert('Broadcast Dispatched!'); }} className="space-y-3">
            <select className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold">
              <option>All Parents & Guardians</option>
              <option>All Teaching Staff</option>
              <option>Primary 4 Class Arms Only</option>
            </select>
            <textarea rows={4} placeholder="Type school broadcast message..." className="w-full p-3 border rounded-xl text-xs bg-slate-50 font-medium" required />
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <Send size={14} /> Dispatch Broadcast Now
            </button>
          </form>
        </div>
      )}

      {/* 5. ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Official School Announcements</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Ref ID</TableHead><TableHead>Announcement Title</TableHead><TableHead>Target Audience</TableHead><TableHead>Date Pinned</TableHead></TableRow></TableHeader>
            <TableBody>
              {announcements.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-bold text-indigo-700">{a.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{a.title}</TableCell>
                  <TableCell className="text-xs text-slate-600">{a.target}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{a.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 6. SMS DISPATCH */}
      {activeTab === 'sms' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-black text-base text-slate-900">Bulk SMS Portal</h3>
            <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">SMS Credit: 14,500 Units</span>
          </div>
          <input type="text" placeholder="Sender ID (e.g. UGBEKUN)" defaultValue="UGBEKUN SCH" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <textarea rows={3} placeholder="Type SMS message..." className="w-full p-3 border rounded-xl text-xs bg-slate-50 font-medium" />
          <button onClick={() => alert('Bulk SMS Sent!')} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Send Bulk SMS</button>
        </div>
      )}

      {/* 7. EMAIL PORTAL */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Official Email Newsletter Composer</h3>
          <input type="text" placeholder="Email Subject" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <textarea rows={4} placeholder="Type HTML email body content..." className="w-full p-3 border rounded-xl text-xs bg-slate-50 font-medium" />
          <button onClick={() => alert('Email Newsletter Sent!')} className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">Dispatch Email Broadcast</button>
        </div>
      )}

      {/* 8. PUSH NOTIFICATIONS */}
      {activeTab === 'push-notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Ugbekun Mobile App Push Notifications</h3>
          <input type="text" placeholder="Notification Title" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
          <textarea rows={3} placeholder="Push Notification Message..." className="w-full p-3 border rounded-xl text-xs bg-slate-50 font-medium" />
          <button onClick={() => alert('Push Notification Sent!')} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Send Push Notification</button>
        </div>
      )}

      {/* 9. NOTICE BOARD */}
      {activeTab === 'notice-board' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Digital School Notice Board</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-2xl bg-slate-50 space-y-1">
              <h4 className="font-bold text-xs text-slate-900">📌 Resumption Procedures for 2026 Session</h4>
              <p className="text-xs text-slate-600 font-medium">All students must be fully seated by 07:45 AM daily.</p>
            </div>
          </div>
        </div>
      )}

      {/* 10. EVENTS */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">School Calendar & Event Roster</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Event ID</TableHead><TableHead>Event Title</TableHead><TableHead>Date & Time</TableHead><TableHead>Venue</TableHead><TableHead>RSVP Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {events.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono font-bold text-indigo-700">{e.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{e.title}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-800">{e.date}</TableCell>
                  <TableCell className="text-xs text-slate-600">{e.venue}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{e.rsvp}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
