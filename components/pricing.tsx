'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLAN_SLUG_BY_NAME } from '@/lib/plans'

const plans = [
  {
    name: 'Starter',
    price: '₦50,000',
    period: '/month',
    description: 'Perfect for small schools',
    features: [
      'Up to 500 students',
      'QR attendance',
      'Basic online classes',
      'Parent portal',
      'Student portal',
      'Email support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Professional',
    price: '₦150,000',
    period: '/month',
    description: 'Most popular for medium schools',
    features: [
      'Up to 2,000 students',
      'QR attendance',
      'Advanced online classes',
      'Fees management',
      'Online exams',
      'Parent portal',
      'Student portal',
      'Teacher portal',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large school networks',
    features: [
      'Unlimited students',
      'All features included',
      'Multi-branch support',
      'Custom integrations',
      'ID card generator',
      'Bulk SMS/Email',
      'School website builder',
      'Payment gateway integration',
      'Dedicated account manager'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
            Transparent Pricing
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            All plans include 30-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-500 animate-scale-in ${
                plan.popular
                  ? 'border-primary bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-xl ring-1 ring-primary/20'
                  : 'border-border/30 bg-card/50 backdrop-blur-md hover:border-primary/40 hover:shadow-lg hover:bg-card/70'
              } group`}
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              {plan.popular && (
                <div className="px-6 pt-6">
                  <span className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-xs font-semibold text-primary border border-primary/20">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-foreground/60 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-foreground/60 text-xs ml-2">{plan.period}</span>
                </div>

                {plan.cta === 'Contact Sales' ? (
                  <Link
                    href="#contact"
                    className={`block w-full py-2.5 rounded-lg font-semibold mb-8 transition duration-300 transform text-center ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:shadow-lg hover:scale-105 active:scale-95'
                        : 'border border-border/50 text-foreground hover:bg-muted/70 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    href={`/subscribe?plan=${PLAN_SLUG_BY_NAME[plan.name] || 'professional'}`}
                    className={`block w-full py-2.5 rounded-lg font-semibold mb-8 transition duration-300 transform text-center ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:shadow-lg hover:scale-105 active:scale-95'
                        : 'border border-border/50 text-foreground hover:bg-muted/70 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}

                <div className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-2">
                      <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/70 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
