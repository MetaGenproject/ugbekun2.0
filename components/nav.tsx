'use client'

import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed w-full top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Image 
              src="/ugbekun-logo.png" 
              alt="Ugbekun" 
              width={120} 
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-foreground/70 hover:text-foreground transition">Features</Link>
            <Link href="#pricing" className="text-sm text-foreground/70 hover:text-foreground transition">Pricing</Link>
            <Link href="#testimonials" className="text-sm text-foreground/70 hover:text-foreground transition">Testimonials</Link>
            <Link href="#faq" className="text-sm text-foreground/70 hover:text-foreground transition">FAQ</Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-6 py-2 text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition text-sm font-medium">
                Login
              </Link>
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                Get Started
              </button>
            </div>
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3">
            <Link href="#features" className="block text-sm text-foreground/70 hover:text-foreground transition">Features</Link>
            <Link href="#pricing" className="block text-sm text-foreground/70 hover:text-foreground transition">Pricing</Link>
            <Link href="#testimonials" className="block text-sm text-foreground/70 hover:text-foreground transition">Testimonials</Link>
            <Link href="#faq" className="block text-sm text-foreground/70 hover:text-foreground transition">FAQ</Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" className="w-full px-4 py-2 text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition text-sm font-medium text-center">
                Login
              </Link>
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
