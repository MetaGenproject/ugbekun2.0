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
              <Link href="/subscribe?plan=starter" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                Get Started
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Link 
              href="/login" 
              className="px-4 py-1.5 text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition text-xs font-semibold"
            >
              Sign In
            </Link>
            <button 
              className="p-2 text-foreground hover:bg-muted/30 active:bg-muted/50 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3 animate-in fade-in slide-in-from-top-5 duration-200">
            <Link href="#features" className="block text-sm text-foreground/70 hover:text-foreground transition">Features</Link>
            <Link href="#pricing" className="block text-sm text-foreground/70 hover:text-foreground transition">Pricing</Link>
            <Link href="#testimonials" className="block text-sm text-foreground/70 hover:text-foreground transition">Testimonials</Link>
            <Link href="#faq" className="block text-sm text-foreground/70 hover:text-foreground transition">FAQ</Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" className="w-full px-4 py-2 text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition text-sm font-semibold text-center">
                Sign In
              </Link>
              <Link href="/subscribe?plan=starter" className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-semibold text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
