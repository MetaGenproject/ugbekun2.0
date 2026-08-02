'use client'

import { useState } from 'react'
import {
  Globe,
  Layout,
  Home,
  UserPlus,
  Newspaper,
  Image as ImageIcon,
  Calendar,
  Users,
  PhoneCall,
  BarChart3,
  Sparkles,
  Plus,
  CheckCircle2,
  Download,
  Eye,
  Edit,
  Save,
  Globe2,
  MapPin,
  Mail,
  Sliders,
  TrendingUp
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

type WebsiteTab = 
  | 'builder' 
  | 'homepage' 
  | 'admissions-page' 
  | 'news' 
  | 'gallery' 
  | 'events-widget' 
  | 'staff-directory-public' 
  | 'contact-info' 
  | 'analytics'

export function SchoolWebsiteManagement() {
  const [activeTab, setActiveTab] = useState<WebsiteTab>('builder')

  // Builder States
  const [siteTitle, setSiteTitle] = useState('Ugbekun International Academy')
  const [siteMotto, setSiteMotto] = useState('Nurturing Excellence, Character & Future Leaders')
  const [customDomain, setCustomDomain] = useState('www.ugbekunschools.edu.ng')
  const [themeColor, setThemeColor] = useState('Navy Blue & Gold')

  // Sample News
  const [newsList, setNewsList] = useState([
    { id: 'NW-01', title: 'Ugbekun Students Win National STEM Robotics Championship', category: 'Achievements', date: '2026-08-01', status: 'Published' },
    { id: 'NW-02', title: 'Resumption Guidelines & Health Standards for 1st Term', category: 'Announcements', date: '2026-07-28', status: 'Published' },
  ])

  // Sample Gallery Albums
  const [galleryAlbums, setGalleryAlbums] = useState([
    { id: 'GAL-101', name: 'Inter-House Sports Competition 2026', photoCount: 45, date: '2026-07-15' },
    { id: 'GAL-102', name: 'Science & Innovation Exhibition', photoCount: 32, date: '2026-06-20' },
  ])

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
              <Globe className="text-indigo-600" size={24} /> School Website Builder & Portal CMS
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage public website pages, admissions portal, news, photo galleries, staff directory, and visitor analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Opening live website preview at https://${customDomain}...`)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Eye size={15} /> Preview Live Website
            </button>
          </div>
        </div>
      </div>

      {/* 9 Sub-Module Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button onClick={() => setActiveTab('builder')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'builder' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🛠️ Website Builder
        </button>
        <button onClick={() => setActiveTab('homepage')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'homepage' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🏠 Homepage CMS
        </button>
        <button onClick={() => setActiveTab('admissions-page')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'admissions-page' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🎓 Admissions Page
        </button>
        <button onClick={() => setActiveTab('news')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'news' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📰 News & Blog
        </button>
        <button onClick={() => setActiveTab('gallery')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🖼️ Photo Gallery
        </button>
        <button onClick={() => setActiveTab('events-widget')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'events-widget' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          🗓️ Public Events
        </button>
        <button onClick={() => setActiveTab('staff-directory-public')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'staff-directory-public' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          👨‍🏫 Public Staff Directory
        </button>
        <button onClick={() => setActiveTab('contact-info')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'contact-info' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📞 Contact Information
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          📈 Website Analytics
        </button>
      </div>

      {/* 1. WEBSITE BUILDER */}
      {activeTab === 'builder' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Layout className="text-indigo-600" size={20} /> Visual Website Builder & Domain Settings
          </h3>
          <form onSubmit={e => { e.preventDefault(); alert('Website settings published!'); }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">School Website Name</label>
              <input type="text" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">School Motto Slogan</label>
              <input type="text" value={siteMotto} onChange={e => setSiteMotto(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Custom Domain Name (SSL Enabled)</label>
              <input type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-mono font-bold text-indigo-700" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <Save size={14} /> Publish Website Changes
            </button>
          </form>
        </div>
      )}

      {/* 2. HOMEPAGE CMS */}
      {activeTab === 'homepage' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Homepage Content & Hero Banner Manager</h3>
          <textarea rows={3} placeholder="Principal's Welcome Address..." defaultValue="Welcome to Ugbekun International Academy, where we shape future leaders through holistic education and innovation." className="w-full p-3 border rounded-xl text-xs bg-slate-50 font-medium" />
          <button onClick={() => alert('Homepage Updated!')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Save Homepage CMS</button>
        </div>
      )}

      {/* 3. ADMISSIONS PAGE */}
      {activeTab === 'admissions-page' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Public Admissions Portal Settings</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Configure online application form fields, requirement checklist, and prospectus downloads.</p>
          <button onClick={() => alert('Admissions Portal Settings Saved!')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Update Admissions Portal</button>
        </div>
      )}

      {/* 4. NEWS & BLOG */}
      {activeTab === 'news' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-base text-slate-900">School News Articles & Announcements</h3>
            <button onClick={() => alert('Publishing New Article...')} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Publish New News Post</button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Article ID</TableHead><TableHead>News Headline</TableHead><TableHead>Category</TableHead><TableHead>Published Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {newsList.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono font-bold text-indigo-700">{n.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{n.title}</TableCell>
                  <TableCell className="text-xs text-slate-600">{n.category}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{n.date}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{n.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. GALLERY */}
      {activeTab === 'gallery' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Public Photo & Video Gallery Albums</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {galleryAlbums.map(a => (
              <div key={a.id} className="p-4 border rounded-2xl bg-slate-50 space-y-2">
                <h4 className="font-bold text-xs text-slate-900">{a.name}</h4>
                <p className="text-[11px] text-slate-500">{a.photoCount} High-Res Photos Uploaded</p>
                <button onClick={() => alert(`Opening ${a.name}`)} className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg">Manage Photos</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PUBLIC EVENTS */}
      {activeTab === 'events-widget' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Website Events Calendar Widget</h3>
          <p className="text-xs text-slate-500 font-medium font-medium">Display open house days, inter-house sports, and PTA meetings on the website calendar.</p>
        </div>
      )}

      {/* 7. PUBLIC STAFF DIRECTORY */}
      {activeTab === 'staff-directory-public' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Public Faculty & Executive Leadership Page</h3>
          <p className="text-xs text-slate-500 font-medium">Showcase school principal, vice-principals, and HODs on the public website.</p>
        </div>
      )}

      {/* 8. CONTACT INFORMATION */}
      {activeTab === 'contact-info' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-black text-base text-slate-900">Campus Address & Contact Enquiry Settings</h3>
          <input type="text" defaultValue="Plot 12, Education City Boulevard, Ikeja, Lagos" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <input type="text" defaultValue="+234 800 UGBEKUN (842-3586)" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <input type="email" defaultValue="admissions@ugbekunschools.edu.ng" className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-semibold" />
          <button onClick={() => alert('Contact Information Updated!')} className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">Save Contact Info</button>
        </div>
      )}

      {/* 9. WEBSITE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} /> Web Traffic & Visitor Analytics
          </h3>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-indigo-50">
              <p className="text-[11px] font-bold text-indigo-700 uppercase">Monthly Page Views</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">42,800 Views</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Unique Visitors</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">12,450 Visitors</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Mobile Traffic Share</p>
              <p className="text-2xl font-black text-amber-950 mt-1">78.4% Mobile</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-purple-50">
              <p className="text-[11px] font-bold text-purple-700 uppercase">Online Inquiries</p>
              <p className="text-2xl font-black text-purple-950 mt-1">184 Enquiries</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
