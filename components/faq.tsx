'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'How long is the free trial?',
    answer: 'All new schools get a 30-day free trial with full access to all features. No credit card required to start.'
  },
  {
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Yes, you can change your plan at any time. Changes will be reflected in your next billing cycle.'
  },
  {
    question: 'Is Ugbekun secure? How is our data protected?',
    answer: 'We use enterprise-grade encryption and comply with international data protection standards. All data is backed up daily on secure servers.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, card payments, and can integrate with various payment gateways for parent fee payments.'
  },
  {
    question: 'How is data imported from our old system?',
    answer: 'Our team provides dedicated support for data migration. We can import student records, staff data, and historical information seamlessly.'
  },
  {
    question: 'Do you offer training for our staff?',
    answer: 'Yes! We provide comprehensive onboarding training for all users. We also have video tutorials and documentation available 24/7.'
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'We offer email support for all plans, with Starter plans, priority support for Professional, and dedicated account managers for Enterprise.'
  },
  {
    question: 'Can we customize Ugbekun for our school\'s needs?',
    answer: 'Absolutely. Enterprise plans include custom integrations and feature customizations. Contact our sales team to discuss your specific needs.'
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Questions?
          </h2>
          <p className="text-lg text-foreground/60">
            We&apos;ve got answers. Can&apos;t find what you&apos;re looking for? <a href="#contact" className="text-primary hover:underline font-medium">Contact us</a>.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
              >
                <h3 className="font-semibold text-foreground text-base">{faq.question}</h3>
                <ChevronDown 
                  size={18} 
                  className={`text-primary flex-shrink-0 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`}
                />
              </button>
              
              {openIndex === idx && (
                <div className="px-6 py-4 border-t border-border/30 bg-muted/20">
                  <p className="text-foreground/70 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
