'use client'

import Link from 'next/link'
import { BookOpen, UserCheck, DollarSign, MessageSquare, Bus, Landmark } from 'lucide-react'

const featuresList = [
  {
    icon: BookOpen,
    title: 'Academic Management',
    description: 'Manage classes, subjects, exams, results, grading and platform.',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    icon: UserCheck,
    title: 'Student Information',
    description: 'Centralize student data, attendance, behaviour, medical & records.',
    iconBg: 'bg-pink-50 text-pink-600 border-pink-100',
  },
  {
    icon: DollarSign,
    title: 'Finance & Fees',
    description: 'Automate invoicing, payments, expenses and financial reports.',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    icon: MessageSquare,
    title: 'Communication',
    description: 'Engage parents & staff with SMS, emails, announcements & chat.',
    iconBg: 'bg-pink-50 text-pink-600 border-pink-100',
  },
  {
    icon: Bus,
    title: 'Transport Management',
    description: 'Track buses, drivers, routes and ensure student safety.',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    icon: Landmark,
    title: 'Library Management',
    description: 'Manage books, borrowing, returns and digital resources.',
    iconBg: 'bg-pink-50 text-pink-600 border-pink-100',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-3">
            WHAT WE DO
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Powering{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Every Aspect
            </span>{' '}
            of School Operations
          </h2>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuresList.map((feature) => {
            const Icon = feature.icon
            return (
              <div 
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.iconBg}`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Explore All Features Button */}
        <div className="text-center">
          <Link
            href="#why-us"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
          >
            Explore All Features
          </Link>
        </div>

      </div>
    </section>
  )
}
