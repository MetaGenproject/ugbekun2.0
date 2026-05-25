'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const rotatingWords = ['Schools', 'Teachers', 'Parents', 'Students']

export function Hero() {
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rotatingWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Trust Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 hover:border-primary/20 transition">
            <span className="text-sm font-medium text-primary">Trusted by 500+ schools nationwide</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            School Excellence
            <br />
            for Every{' '}
            <span className="relative inline-block text-primary">
              {rotatingWords.map((word, idx) => (
                <span
                  key={word}
                  className={`inline-block transition-all duration-500 ease-in-out ${
                    currentWord === idx
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-95 absolute left-0'
                  }`}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Comprehensive school management platform designed for modern educational institutions. Streamline operations and enhance learning experiences.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/subscribe?plan=basic-plus"
            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight size={18} />
          </Link>
          <button className="px-8 py-3.5 border border-border bg-card text-foreground rounded-lg font-semibold hover:bg-muted/50 transition-all duration-200">
            View Demo
          </button>
        </div>

        {/* Dashboard Preview */}
        <div className="relative group">
          {/* Soft gradient background */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />

          <div className="relative rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* KPI 1 */}
              <div className="rounded-xl bg-muted/30 p-4 border border-border/30">
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2">Total Students</p>
                <p className="text-3xl font-bold text-foreground mb-1">2,450</p>
                <p className="text-xs text-primary font-medium">↑ 12% this month</p>
              </div>

              {/* KPI 2 */}
              <div className="rounded-xl bg-muted/30 p-4 border border-border/30">
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2">Attendance Rate</p>
                <p className="text-3xl font-bold text-foreground mb-1">94.2%</p>
                <p className="text-xs text-primary font-medium">↑ 2.3% improvement</p>
              </div>

              {/* KPI 3 */}
              <div className="rounded-xl bg-muted/30 p-4 border border-border/30">
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2">Active Classes</p>
                <p className="text-3xl font-bold text-foreground mb-1">48</p>
                <p className="text-xs text-primary font-medium">All running smoothly</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="border-t border-border/30 pt-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground/70">Fees Collected</span>
                  <span className="text-sm font-bold text-foreground">87%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '87%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground/70">Parent Engagement</span>
                  <span className="text-sm font-bold text-foreground">76%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: '76%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
