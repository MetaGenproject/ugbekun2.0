'use client'

import { TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DashboardPreview() {
  const [animatedStats, setAnimatedStats] = useState({
    students: 0,
    attendance: 0,
    fees: 0,
    teachers: 0
  })

  useEffect(() => {
    const animationDuration = 2000
    const startTime = Date.now()
    const targetValues = { students: 2450, attendance: 94, fees: 2400000, teachers: 156 }

    const animateValues = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      setAnimatedStats({
        students: Math.floor(targetValues.students * progress),
        attendance: Math.floor(targetValues.attendance * progress),
        fees: Math.floor(targetValues.fees * progress),
        teachers: Math.floor(targetValues.teachers * progress)
      })

      if (progress < 1) {
        requestAnimationFrame(animateValues)
      }
    }

    animateValues()
  }, [])
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
            Real-time Analytics & Insights
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Make data-driven decisions with comprehensive dashboards and reports.
          </p>
        </div>

        <div className="space-y-6">
          {/* Dashboard Mockup */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-lg p-8 shadow-sm hover:shadow-lg transition-all duration-300 animate-scale-in">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 group hover:border-primary/40 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Attendance Trends</h3>
                  <TrendingUp size={18} className="text-primary group-hover:animate-pulse-glow" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60 text-sm">Present</span>
                    <span className="text-2xl font-bold text-foreground">94%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary/70 rounded-full h-2.5 transition-all duration-1000" style={{ width: '94%' }} />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 group hover:border-accent/40 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Academic Performance</h3>
                  <BookOpen size={18} className="text-accent group-hover:animate-pulse-glow" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-foreground/60">A Grade:</span><span className="text-foreground font-semibold">25%</span></div>
                  <div className="flex justify-between"><span className="text-foreground/60">B Grade:</span><span className="text-foreground font-semibold">35%</span></div>
                  <div className="flex justify-between"><span className="text-foreground/60">C Grade:</span><span className="text-foreground font-semibold">25%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: Math.floor(animatedStats.students), change: '+12%' },
              { label: 'Avg Attendance', value: animatedStats.attendance, change: '+2%', suffix: '%' },
              { label: 'Fees Collected', value: (animatedStats.fees / 1000000).toFixed(1), change: '+18%', suffix: 'M' },
              { label: 'Active Teachers', value: Math.floor(animatedStats.teachers), change: '+5' }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-lg p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}>
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-3">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{stat.value.toLocaleString()}{stat.suffix || ''}</p>
                <p className="text-xs text-primary font-medium mt-2 group-hover:opacity-100 opacity-80 transition-opacity">{stat.change} this month</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
