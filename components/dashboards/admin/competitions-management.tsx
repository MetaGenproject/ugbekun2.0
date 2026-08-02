'use client'

import { useState } from 'react'
import {
  Trophy,
  Award,
  Zap,
  Target,
  Crown,
  Medal,
  Users,
  Search,
  Plus,
  Flame,
  Globe,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Calendar,
  Star,
  ChevronRight,
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

type CompetitionTab = 'internal-quiz' | 'inter-school' | 'olympiads' | 'leaderboard'

export function CompetitionsManagement() {
  const [activeTab, setActiveTab] = useState<CompetitionTab>('leaderboard')
  const [searchQuery, setSearchQuery] = useState('')

  // Leaderboard Dataset
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Chinedu Joseph Okafor', class: 'Primary 4 Gold', xp: 4850, badges: '🏆 Math Whiz, ⚡ 10-Day Streak', score: '98.5%' },
    { rank: 2, name: 'Amina Abubakar Bello', class: 'Primary 4 Gold', xp: 4620, badges: '🥇 Spelling Champion', score: '96.8%' },
    { rank: 3, name: 'David Oluwaseun Adeleke', class: 'Primary 5 Diamond', xp: 4300, badges: '🥈 Science Star', score: '94.2%' },
    { rank: 4, name: 'Emeka Victor Nnamdi', class: 'SSS 1 Science A', xp: 4150, badges: '🥉 Physics Ace', score: '92.0%' },
    { rank: 5, name: 'Zainab Ibrahim Sani', class: 'Primary 3 Silver', xp: 3980, badges: '⭐ Quiz Master', score: '90.5%' },
  ])

  // Internal Quizzes
  const [internalQuizzes, setInternalQuizzes] = useState([
    { id: 'QZ-101', title: 'Inter-House STEM Quiz Bowl 2026', category: 'Science & Math', target: 'All Primary Classes', status: 'Upcoming (Aug 15)', leadHouse: 'Gold House (340 pts)' },
    { id: 'QZ-102', title: 'Annual Spelling Bee Championship', category: 'English Language', target: 'Primary 3 - 5', status: 'Active Registration', leadHouse: 'Ruby House (290 pts)' },
    { id: 'QZ-103', title: 'Inter-Class Debate Competition', category: 'Arts & Civics', target: 'Junior Secondary', status: 'Completed', leadHouse: 'Emerald House (1st Place)' },
  ])

  // Inter-School Competitions
  const [interSchoolComps, setInterSchoolComps] = useState([
    { id: 'EXT-201', title: 'Statewide Schools Science Fair 2026', host: 'Lagos State Ministry of Education', delegates: 5, date: '2026-09-10', status: 'Registered' },
    { id: 'EXT-202', title: 'National Spelling Bee League', host: 'National Literary Council', delegates: 3, date: '2026-10-05', status: 'Shortlisting' },
  ])

  // Olympiads
  const [olympiads, setOlympiads] = useState([
    { id: 'OLY-301', name: 'Nigerian Mathematics Olympiad (NMO)', level: 'National', candidates: 8, stage: 'Round 1 Screening', date: '2026-08-28' },
    { id: 'OLY-302', name: 'Junior Science Olympiad (JSO)', level: 'National', candidates: 6, stage: 'Finals Prep', date: '2026-09-15' },
    { id: 'OLY-303', name: 'Pan-African Physics Olympiad', level: 'Continental', candidates: 3, stage: 'Selection Phase', date: '2026-11-02' },
  ])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50/60 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={24} /> Academic Competitions & Leaderboards
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Internal school house quizzes, inter-school tournaments, Olympiads preparation, and student academic XP leaderboards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Crown size={15} className="text-amber-400" /> View School Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('internal-quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'internal-quiz' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap size={15} /> Internal School Quizzes
        </button>

        <button
          onClick={() => setActiveTab('inter-school')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'inter-school' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={15} /> Inter-School Competitions
        </button>

        <button
          onClick={() => setActiveTab('olympiads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'olympiads' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target size={15} /> Olympiads Suite
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === 'leaderboard' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Crown size={15} className="text-amber-300" /> Academic Leaderboard
        </button>
      </div>

      {/* TAB 1: INTERNAL QUIZ */}
      {activeTab === 'internal-quiz' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Zap className="text-amber-500" size={20} /> Internal House Quizzes & Championships
              </h3>
              <p className="text-xs text-slate-500 font-medium">Inter-house quizzes, spelling bees, debate league, and STEM bowls.</p>
            </div>

            <button onClick={() => alert('Creating New Internal Quiz...')} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5">
              <Plus size={14} /> Create Quiz Challenge
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Ref</TableHead>
                <TableHead>Competition Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target Classes</TableHead>
                <TableHead>Leading House</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {internalQuizzes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono font-bold text-amber-700">{q.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{q.title}</TableCell>
                  <TableCell className="text-xs text-slate-600">{q.category}</TableCell>
                  <TableCell className="text-xs text-slate-600">{q.target}</TableCell>
                  <TableCell className="font-bold text-amber-900">{q.leadHouse}</TableCell>
                  <TableCell><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">{q.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: INTER-SCHOOL */}
      {activeTab === 'inter-school' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Globe className="text-amber-500" size={20} /> External Inter-School Tournaments
              </h3>
              <p className="text-xs text-slate-500 font-medium">Manage student delegates registered for external academic competitions.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref ID</TableHead>
                <TableHead>Tournament Name</TableHead>
                <TableHead>Host Body</TableHead>
                <TableHead>Delegates</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interSchoolComps.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-slate-800">{c.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{c.title}</TableCell>
                  <TableCell className="text-xs text-slate-600">{c.host}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">{c.delegates} Students</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{c.date}</TableCell>
                  <TableCell><span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">{c.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: OLYMPIADS */}
      {activeTab === 'olympiads' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Target className="text-amber-500" size={20} /> STEM & Science Olympiads
              </h3>
              <p className="text-xs text-slate-500 font-medium">National & International Olympiad examination prep and candidate tracking.</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Olympiad Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Candidate Count</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Exam Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {olympiads.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-bold text-slate-900">{o.name}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">{o.level}</span></TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">{o.candidates} Candidates</TableCell>
                  <TableCell className="text-xs text-slate-700">{o.stage}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{o.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: ACADEMIC LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Crown className="text-amber-500" size={22} /> School-Wide Academic XP Leaderboard
              </h3>
              <p className="text-xs text-slate-500 font-medium">Top performing students ranked by quiz XP points, homework completion, and exam averages.</p>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2 text-center relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-white font-black flex items-center justify-center mx-auto text-lg shadow-sm">1</div>
              <p className="font-extrabold text-sm text-slate-900">Chinedu Joseph Okafor</p>
              <p className="text-[11px] text-amber-900 font-semibold">Primary 4 Gold • 4,850 XP</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">🥇 Gold Champion</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center mx-auto text-lg">2</div>
              <p className="font-extrabold text-sm text-slate-900">Amina Abubakar Bello</p>
              <p className="text-[11px] text-slate-600 font-semibold">Primary 4 Gold • 4,620 XP</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">🥈 Silver Runner-Up</span>
            </div>

            <div className="p-5 rounded-2xl border border-amber-100 bg-orange-50/60 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black flex items-center justify-center mx-auto text-lg">3</div>
              <p className="font-extrabold text-sm text-slate-900">David Oluwaseun Adeleke</p>
              <p className="text-[11px] text-slate-600 font-semibold">Primary 5 Diamond • 4,300 XP</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">🥉 Bronze Medalist</span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class Stream</TableHead>
                <TableHead>Total XP</TableHead>
                <TableHead>Badges & Achievements</TableHead>
                <TableHead className="text-right">Term Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((lb) => (
                <TableRow key={lb.rank}>
                  <TableCell className="font-mono font-black text-amber-700">#{lb.rank}</TableCell>
                  <TableCell className="font-bold text-slate-900">{lb.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">{lb.class}</TableCell>
                  <TableCell className="font-mono font-black text-indigo-700">{lb.xp} XP</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">{lb.badges}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">{lb.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
