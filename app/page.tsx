import { Navigation } from '@/components/nav'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { WhyUs } from '@/components/why-us'
import { ImpactSection } from '@/components/impact'
import { Pricing } from '@/components/pricing'
import { TrustedBySection } from '@/components/trusted-by'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060B18]">
      <Navigation />
      <Hero />
      <Features />
      <WhyUs />
      <ImpactSection />
      <Pricing />
      <TrustedBySection />
      <Footer />
    </main>
  )
}
