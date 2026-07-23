'use client'

import { useState, useEffect } from 'react'
import { Trophy, Sparkles, Award, Loader2, Calendar, Clock, Activity, CheckSquare } from 'lucide-react'
import { endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'

interface LeaderboardEntry {
  rank: number
  name: string
  points: number
}

interface LedgerEntry {
  id: number
  points: number
  actionType: string
  createdAt: string
  referenceId: number | null
}

interface TeacherPointsData {
  points: number
  recentLedger: LedgerEntry[]
  weeklyRank: number | string
  alltimeRank: number | string
}

export default function TeacherPointsHub() {
  const [data, setData] = useState<TeacherPointsData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEKLY' | 'ALL_TIME'>('WEEKLY')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const token = safeStorage.getItem('ugbekun_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Fetch Profile/Points
      const profileRes = await fetch(`${endpoints.health.replace('/health', '')}/teacher/gamification/profile`, { headers })
      const profileData = await profileRes.json()

      // Fetch Leaderboard
      const lbRes = await fetch(`${endpoints.health.replace('/health', '')}/teacher/gamification/leaderboard?periodType=${selectedPeriod}`, { headers })
      const lbData = await lbRes.json()

      if (profileData.success) {
        setData({
          points: profileData.points,
          recentLedger: profileData.recentLedger || [],
          weeklyRank: profileData.weeklyRank,
          alltimeRank: profileData.alltimeRank,
        })
      }

      if (lbData.success) {
        setLeaderboard(lbData.leaderboard || [])
      }

    } catch (err) {
      console.error('Error loading teacher gamification data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-[#0063a6]" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading Educator Points & Leaderboard...</p>
      </div>
    )
  }

  if (!data) return null

  // Educator Level calculations: every 2000 points is a level
  const currentLevel = Math.floor(data.points / 2000) + 1
  const pointsInCurrentLevel = data.points % 2000
  const progressPercent = Math.min((pointsInCurrentLevel / 2000) * 100, 100)

  const getActionDetails = (actionType: string) => {
    switch (actionType) {
      case 'ATTENDANCE_PUNCTUAL':
        return {
          title: 'Punctual Room Attendance',
          desc: 'Logged 100% room attendance before 9:00 AM daily.',
          icon: CheckSquare,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
        }
      case 'LESSON_PLAN_EARLY':
        return {
          title: 'Early Lesson Plan Submission',
          desc: 'Uploaded complete lesson plans ahead of term starts.',
          icon: Calendar,
          color: 'text-violet-600 bg-violet-50 border-violet-100'
        }
      case 'GRADING_TIMELY':
        return {
          title: 'Fast Assignment Grading',
          desc: 'Published graded assignments within 48 hours of deadlines.',
          icon: Clock,
          color: 'text-blue-600 bg-blue-50 border-blue-100'
        }
      case 'COMMENTARY_SUBMITTED':
        return {
          title: 'Commentary Approved',
          desc: 'Submitted qualitative narrative commentary successfully.',
          icon: Award,
          color: 'text-amber-600 bg-amber-50 border-amber-100'
        }
      default:
        return {
          title: 'System Points Awarded',
          desc: 'Institutional gamification contribution bonus.',
          icon: Sparkles,
          color: 'text-blue-600 bg-blue-50 border-blue-100'
        }
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview stats panel */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
          {/* Level Circle and XP info */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-2.5 text-blue-400 font-extrabold text-xs uppercase tracking-widest">
              <Sparkles size={16} /> Educator Gamification Hub
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Level {currentLevel} Educator</h2>
              <p className="text-slate-400 text-sm mt-1">Earn points by completing lesson plans, punctuality, and grading timeliness.</p>
            </div>

            {/* Level progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black text-slate-400">
                <span>{pointsInCurrentLevel} / 2000 Points</span>
                <span>LEVEL {currentLevel + 1}</span>
              </div>
              <div className="h-4 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick stats cards */}
          <div className="md:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-black tracking-wider uppercase">Weekly Rank</span>
                <Trophy className="text-amber-400" size={18} />
              </div>
              <p className="text-2xl font-black text-white mt-3">
                {data.weeklyRank === '-' ? '-' : `#${data.weeklyRank}`}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-black tracking-wider uppercase">Total Points</span>
                <Award className="text-blue-400" size={18} />
              </div>
              <p className="text-2xl font-black text-white mt-3">{data.points} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard columns */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Point Log / Ledger */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Activity className="text-blue-600" size={20} />
              <h3 className="text-base font-extrabold text-slate-900">Your Action & Points Ledger</h3>
            </div>

            {data.recentLedger.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-sm italic font-medium">No points actions recorded yet this term.</p>
                <p className="text-slate-400 text-xs mt-1">Points will update dynamically as lesson plan reviews, attendance registers, and assignments are saved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentLedger.map((ledger) => {
                  const details = getActionDetails(ledger.actionType)
                  const ActionIcon = details.icon
                  return (
                    <div 
                      key={ledger.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2.5 rounded-lg border ${details.color}`}>
                          <ActionIcon size={18} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{details.title}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{details.desc}</p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                            {new Date(ledger.createdAt).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full shrink-0">
                        +{ledger.points} XP
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="text-amber-500" size={18} />
                Educator Leaderboard
              </h3>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="ALL_TIME">All-Time</option>
              </select>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic font-medium">
                No leaderboard cache computed. Check back later!
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.rank}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        entry.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {entry.rank}
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-500">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
