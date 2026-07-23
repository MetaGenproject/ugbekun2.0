'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Trophy, Flame, Loader2, Play, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'
import { safeStorage } from '@/lib/safeStorage'

interface Badge {
  id: number
  name: string
  description: string
  iconUrl: string
}

interface TriviaQuestion {
  id: number
  questionText: string
  options: string[]
  timeLimitSeconds: number
  points: number
  answered: boolean
  isCorrect: boolean | null
  selectedOption: number | null
}

interface PointsHubData {
  xp: number
  streak: {
    currentStreak: number
    highestStreak: number
  }
  badges: Badge[]
  weeklyRank: string | number
  alltimeRank: string | number
}

interface LeaderboardEntry {
  rank: number
  studentId: number
  studentName: string
  points: number
}

export default function PointsHub() {
  const [data, setData] = useState<PointsHubData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTrivia, setActiveTrivia] = useState<TriviaQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEKLY' | 'ALL_TIME'>('WEEKLY')

  // Trivia interaction states
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLimit, setTimeLimit] = useState<number>(0)
  const [timerActive, setTimerActive] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [submittingTrivia, setSubmittingTrivia] = useState(false)
  const [triviaResult, setTriviaResult] = useState<{
    isCorrect: boolean
    correctOption: number
    pointsAwarded: number
  } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const token = safeStorage.getItem('ugbekun_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Fetch Profile/Points
      const profileRes = await fetch(`${endpoints.health.replace('/health', '')}/student/gamification/profile`, { headers })
      const profileData = await profileRes.json()

      // Fetch Trivia
      const triviaRes = await fetch(`${endpoints.health.replace('/health', '')}/student/trivia/active`, { headers })
      const triviaData = await triviaRes.json()

      // Fetch Leaderboard
      const lbRes = await fetch(`${endpoints.health.replace('/health', '')}/student/gamification/leaderboard?periodType=${selectedPeriod}`, { headers })
      const lbData = await lbRes.json()

      if (profileData.success) {
        setData({
          xp: profileData.xp,
          streak: profileData.streak,
          badges: profileData.badges,
          weeklyRank: profileData.weeklyRank,
          alltimeRank: profileData.alltimeRank,
        })
      }

      if (triviaData.success) {
        setActiveTrivia(triviaData.questions || [])
      }

      if (lbData.success) {
        setLeaderboard(lbData.leaderboard || [])
      }

    } catch (err) {
      console.error('Error loading gamification data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  // Timer logic for trivia
  useEffect(() => {
    if (!timerActive || timeLimit <= 0) return

    const interval = setInterval(() => {
      setTimeLimit((prev) => {
        if (prev <= 1) {
          setTimerActive(false)
          handleSubmitTrivia(true) // Auto-submit on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, timeLimit])

  const handleStartTrivia = (question: TriviaQuestion) => {
    setSelectedOption(null)
    setTriviaResult(null)
    setTimeLimit(question.timeLimitSeconds)
    setStartTime(Date.now())
    setTimerActive(true)
  }

  const handleSubmitTrivia = async (isTimeout = false) => {
    if (!timerActive && !isTimeout) return
    setTimerActive(false)

    const question = activeTrivia.find(q => !q.answered)
    if (!question) return

    const timeTakenMs = Date.now() - startTime
    setSubmittingTrivia(true)

    try {
      const token = safeStorage.getItem('ugbekun_token')
      const res = await fetch(`${endpoints.health.replace('/health', '')}/student/trivia/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          triviaQuestionId: question.id,
          selectedOption: isTimeout ? -1 : selectedOption,
          timeTakenMs
        })
      })
      const result = await res.json()
      if (result.success) {
        setTriviaResult({
          isCorrect: result.isCorrect,
          correctOption: result.correctOption,
          pointsAwarded: result.pointsAwarded
        })
        // Reload points/XP data after submission
        await loadData()
      } else {
        alert(result.message || 'Submission failed.')
      }
    } catch (err) {
      console.error(err)
      alert('Error submitting trivia answer.')
    } finally {
      setSubmittingTrivia(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading Points & XP Hub...</p>
      </div>
    )
  }

  if (!data) return null

  // Level calculations: every 1000 XP is a level
  const currentLevel = Math.floor(data.xp / 1000) + 1
  const xpInCurrentLevel = data.xp % 1000
  const progressPercent = Math.min((xpInCurrentLevel / 1000) * 100, 100)

  const unansweredTrivia = activeTrivia.filter(q => !q.answered)[0]

  return (
    <div className="space-y-8">
      {/* Overview stats panel */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
          {/* Level Circle and XP info */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-2.5 text-violet-400 font-extrabold text-xs uppercase tracking-widest">
              <Sparkles size={16} /> Gamification Points Hub
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Level {currentLevel} Scholar</h2>
              <p className="text-slate-400 text-sm mt-1">Keep completing learning activities and trivia to rank up!</p>
            </div>

            {/* Level progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black text-slate-400">
                <span>{xpInCurrentLevel} / 1000 XP</span>
                <span>LEVEL {currentLevel + 1}</span>
              </div>
              <div className="h-4 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-violet-600 to-indigo-500 rounded-full transition-all duration-1000"
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
              <p className="text-2xl font-black text-white mt-3">#{data.weeklyRank}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-black tracking-wider uppercase">Trivia Streak</span>
                <Flame className="text-orange-500 animate-pulse" size={18} />
              </div>
              <p className="text-2xl font-black text-white mt-3">{data.streak.currentStreak} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard columns */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Trivia and Badges */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Trivia Section */}
          <div className="bg-slate-900/40 border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="text-orange-500" size={18} />
                Daily Internal Trivia Stream
              </h3>
              {timerActive && (
                <span className="px-3 py-1 bg-red-50 border border-red-100 text-red-600 rounded-full text-xs font-bold animate-pulse">
                  {timeLimit}s Left
                </span>
              )}
            </div>

            {unansweredTrivia ? (
              <div className="space-y-4">
                {!timerActive && !triviaResult ? (
                  <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-4">
                    <p className="text-sm font-semibold text-slate-600">A new daily trivia question is ready!</p>
                    <div className="text-xs text-slate-400 font-medium">Points: +{unansweredTrivia.points} XP · Time Limit: {unansweredTrivia.timeLimitSeconds}s</div>
                    <button
                      onClick={() => handleStartTrivia(unansweredTrivia)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition"
                    >
                      <Play size={14} /> Start Trivia Match
                    </button>
                  </div>
                ) : triviaResult ? (
                  <div className={`p-6 rounded-xl border text-center space-y-3 ${triviaResult.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex justify-center">
                      <CheckCircle2 className={triviaResult.isCorrect ? 'text-emerald-600' : 'text-rose-600'} size={36} />
                    </div>
                    <h4 className="text-base font-black text-slate-900">
                      {triviaResult.isCorrect ? 'Correct Response!' : 'Incorrect Answer'}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {triviaResult.isCorrect 
                        ? `Congratulations! You earned +${triviaResult.pointsAwarded} XP (including streak bonus).`
                        : `The correct option was: ${unansweredTrivia.options[triviaResult.correctOption]}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-800">{unansweredTrivia.questionText}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {unansweredTrivia.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full text-left p-4 rounded-xl border transition text-xs font-semibold ${selectedOption === idx ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSubmitTrivia(false)}
                      disabled={selectedOption === null || submittingTrivia}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {submittingTrivia ? <Loader2 className="animate-spin" size={14} /> : 'Submit Answer'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-sm font-semibold text-slate-400 italic">
                ✓ All daily trivia questions answered. Check back tomorrow!
              </div>
            )}
          </div>

          {/* Badges and achievements */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-violet-500" size={18} />
              Unlocked Badges & Credentials
            </h3>
            {data.badges.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 italic">No badges unlocked yet. Solve homework early and score high on exams to earn badges!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.badges.map((badge) => (
                  <div 
                    key={badge.id}
                    className="bg-white border border-slate-200 hover:border-violet-500/50 p-5 rounded-2xl text-center transition group hover:shadow-md cursor-pointer"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 bg-violet-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                      🏆
                    </div>
                    <h4 className="text-xs font-black text-slate-800">{badge.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-normal">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Weekly Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="text-amber-500" size={18} />
                Leaderboard
              </h3>
              
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setSelectedPeriod('WEEKLY')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black transition ${selectedPeriod === 'WEEKLY' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setSelectedPeriod('ALL_TIME')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black transition ${selectedPeriod === 'ALL_TIME' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400'}`}
                >
                  All-Time
                </button>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 italic text-center py-6">No entries registered for this period yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaderboard.map((entry) => (
                  <div key={entry.studentId} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black ${
                        entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        entry.rank === 3 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {entry.rank}
                      </span>
                      <span className="font-bold text-slate-700">{entry.studentName}</span>
                    </div>
                    <span className="font-black text-slate-900">{entry.points.toLocaleString()} XP</span>
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
