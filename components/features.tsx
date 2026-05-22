import { BarChart3, Users, CreditCard, BookOpen, Lock, MessageSquare, Smartphone, Zap } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'QR Attendance',
    description: 'Quick and accurate attendance tracking with QR codes. Eliminate manual processes and human errors.'
  },
  {
    icon: Users,
    title: 'Online Classes',
    description: 'Live video classes with interactive tools. Screen sharing, chat, and attendance tracking built-in.'
  },
  {
    icon: CreditCard,
    title: 'Fees Management',
    description: 'Automated fee collection, invoicing, and payment tracking. Multiple payment gateway support.'
  },
  {
    icon: BookOpen,
    title: 'Online Exams',
    description: 'Create and conduct secure online exams. Real-time results with detailed analytics and insights.'
  },
  {
    icon: Users,
    title: 'Parent Portal',
    description: 'Keep parents engaged with real-time updates on attendance, grades, fees, and announcements.'
  },
  {
    icon: Smartphone,
    title: 'Student Portal',
    description: 'Students can access classes, submit assignments, check grades, and communicate with teachers.'
  },
  {
    icon: Users,
    title: 'Teacher Portal',
    description: 'Complete classroom management with class routines, grade books, and student performance tracking.'
  },
  {
    icon: Zap,
    title: 'Bulk SMS/Email',
    description: 'Send announcements to students and parents instantly. Automatic notifications for important events.'
  },
  {
    icon: Lock,
    title: 'ID Card Generator',
    description: 'Create professional school ID cards with photos, QR codes, and custom design options.'
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Complete School Management Suite
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            All the tools you need to streamline operations and enhance learning outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div 
                key={idx}
                className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/8 group-hover:bg-primary/12 flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
