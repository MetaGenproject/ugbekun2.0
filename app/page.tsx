import { Navigation } from '@/components/nav'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { DashboardPreview } from '@/components/dashboard-preview'
import { Pricing } from '@/components/pricing'
import { Testimonials } from '@/components/testimonials'
import { FAQ } from '@/components/faq'
import { Contact } from '@/components/contact'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <>
      <Navigation />
      <Hero />
      <Features />
      <DashboardPreview />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </>
  )
}
