'use client'

import { Mail, Phone, MapPin } from 'lucide-react'
import { useState } from 'react'

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setFormData({ name: '', email: '', phone: '', school: '', message: '' })
  }

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Get Started Today
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Join thousands of schools modernizing their management. Contact us to schedule a demo or start your free trial.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary text-sm"
                  placeholder="John Okafor"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary text-sm"
                  placeholder="john@school.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary text-sm"
                  placeholder="+234 901 234 5678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">School Name</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary text-sm"
                  placeholder="Your School Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary resize-none text-sm"
                  placeholder="Tell us about your school..."
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:shadow-md transition font-semibold text-sm"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Email</h4>
                    <p className="text-foreground/70 text-sm">support@ugbekun.ng</p>
                    <p className="text-foreground/70 text-sm">sales@ugbekun.ng</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Phone</h4>
                    <p className="text-foreground/70 text-sm">+234 901 234 5678</p>
                    <p className="text-foreground/70 text-xs">Mon-Fri, 9 AM - 6 PM WAT</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Office</h4>
                    <p className="text-foreground/70 text-sm">123 Innovation Way</p>
                    <p className="text-foreground/70 text-sm">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
              <h4 className="font-semibold text-foreground mb-2 text-sm">Quick Response</h4>
              <p className="text-foreground/70 text-sm leading-relaxed">
                We typically respond within 2 hours during business hours. For urgent matters, call our support line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
