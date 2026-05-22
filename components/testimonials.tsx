'use client'

import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Dr. Chioma Okafor',
    role: 'Principal, Success Academy',
    image: '👩‍🏫',
    content: 'SchoolHub has transformed how we manage attendance and student records. The QR system saves us hours every week.',
    rating: 5
  },
  {
    name: 'Mr. Tunde Adebayo',
    role: 'School Administrator, Elite International',
    image: '👨‍💼',
    content: 'Our parents love the portal. Real-time updates on fees, grades, and attendance have improved communication significantly.',
    rating: 5
  },
  {
    name: 'Mrs. Ama Mensah',
    role: 'Finance Manager, Heritage School',
    image: '👩‍💼',
    content: 'The fees management system is incredible. Automated invoicing and payment tracking has reduced our admin work by 70%.',
    rating: 5
  },
  {
    name: 'Prof. Ibrahim Hassan',
    role: 'HOD ICT, Innovation Institute',
    image: '👨‍🏫',
    content: 'Online exams with instant grading? Game changer. Our students can get feedback immediately and teachers save time on marking.',
    rating: 5
  },
  {
    name: 'Miss Jennifer Okoro',
    role: 'Teacher, Bright Future Academy',
    image: '👩‍🏫',
    content: 'The teacher portal makes class management so easy. I can track attendance, grades, and communicate with students all in one place.',
    rating: 5
  },
  {
    name: 'Mr. Kunle Oladele',
    role: 'Director, Global Excellence School',
    image: '👨‍💼',
    content: 'Customer support is exceptional. Whenever we had questions during implementation, they were there to help. Highly recommended!',
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 animate-fade-in-up">
            Trusted by Educational Leaders
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            See what school leaders are saying about Ugbekun.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground/70 mb-6 text-sm leading-relaxed">{testimonial.content}</p>
              
              <div className="flex items-center gap-3 pt-6 border-t border-border/30">
                <div className="text-2xl flex-shrink-0">{testimonial.image}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-xs text-foreground/60">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
