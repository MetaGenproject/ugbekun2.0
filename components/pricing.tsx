'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

const pricingPlans = [
  {
    name: 'Starter',
    subtitle: 'Perfect for small schools',
    price: '₦25,000',
    period: '/term',
    features: [
      'Up to 150 Students',
      'Basic Academic Management',
      'Attendance Tracking',
      'SMS Notifications',
      'Email Support',
    ],
    buttonText: 'Get Started',
    buttonHref: '/subscribe?plan=starter',
    buttonVariant: 'outline',
    highlight: false,
  },
  {
    name: 'Standard',
    subtitle: 'Best for growing schools',
    price: '₦60,000',
    period: '/term',
    features: [
      'Up to 500 Students',
      'All Starter Features',
      'Examinations & Report Cards',
      'Finance Management',
      'Priority Support',
    ],
    buttonText: 'Get Started',
    buttonHref: '/subscribe?plan=basic-plus',
    buttonVariant: 'blue',
    highlight: false,
  },
  {
    name: 'Premium',
    subtitle: 'For large & established schools',
    price: '₦120,000',
    period: '/term',
    features: [
      'Unlimited Students',
      'All Standard Features',
      'Transport Management',
      'Library Management',
      'Advanced Reports',
    ],
    buttonText: 'Get Started',
    buttonHref: '/subscribe?plan=premium',
    buttonVariant: 'pink',
    highlight: true,
    badgeText: 'Most Popular',
  },
  {
    name: 'Enterprise',
    subtitle: 'Custom solution for institutions',
    price: 'Custom Pricing',
    period: '',
    features: [
      'Unlimited Everything',
      'Custom Integrations',
      'Dedicated Support',
      'Training & Onboarding',
      'SLA & Security',
    ],
    buttonText: 'Contact Us',
    buttonHref: '#contact',
    buttonVariant: 'outline',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-3">
            SIMPLE, TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Choose the Perfect Plan for{' '}
            <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
              Your School
            </span>
          </h2>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 ${
                plan.highlight
                  ? 'border-2 border-rose-500 shadow-2xl scale-[1.02] z-10'
                  : 'border border-gray-200 shadow-sm hover:shadow-lg'
              }`}
            >
              {plan.badgeText && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                  {plan.badgeText}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-500 mb-6">{plan.subtitle}</p>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-xs text-gray-500 font-medium ml-1">{plan.period}</span>}
                </div>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Check size={16} className="text-blue-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={plan.buttonHref}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-center transition-all block shadow-sm ${
                    plan.buttonVariant === 'pink'
                      ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white hover:opacity-95 shadow-red-500/25'
                      : plan.buttonVariant === 'blue'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
