'use client'

import { Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { UgbekunLogo } from '@/components/logo'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  return (
    <header className="fixed w-full top-0 z-50" style={{ backgroundColor: 'rgba(6,11,24,0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main nav row */}
        <div className="flex justify-between items-center" style={{ height: '80px' }}>
          {/* Logo */}
          <UgbekunLogo size="md" />
          
          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            <Link href="/" className="text-sm font-medium text-white hover:text-blue-400 transition">
              Home
            </Link>

            {/* Product Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('product')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition py-2"
              >
                Product
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2" style={{ zIndex: 100 }}>
                <div style={{ background: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Academic Portal</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>CBT &amp; Examinations</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Finance &amp; Billing</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Parent &amp; Student Portal</Link>
                </div>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('solutions')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition py-2"
              >
                Solutions
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2" style={{ zIndex: 100 }}>
                <div style={{ background: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>For Primary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>For Secondary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>For Multi-Campus Groups</Link>
                </div>
              </div>
            </div>

            <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition">
              Pricing
            </Link>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('resources')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition py-2"
              >
                Resources
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2" style={{ zIndex: 100 }}>
                <div style={{ background: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Documentation</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Help Center</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Blog &amp; News</Link>
                </div>
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => toggleDropdown('company')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition py-2"
              >
                Company
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2" style={{ zIndex: 100 }}>
                <div style={{ background: '#0B132B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                  <Link href="#about" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>About Us</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Careers</Link>
                  <Link href="#contact" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white rounded-lg transition" style={{ display: 'block' }}>Contact Us</Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link 
              href="/login" 
              prefetch={false}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}
            >
              Log in
            </Link>
            <Link 
              href="/subscribe?plan=starter" 
              prefetch={false}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'linear-gradient(to right, #ef4444, #e11d48)', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile: Sign In + Hamburger */}
          <div className="flex items-center lg:hidden" style={{ gap: '10px' }}>
            <Link 
              href="/login" 
              prefetch={false}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }}
            >
              Sign In
            </Link>
            <button 
              type="button"
              style={{ padding: '8px', color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', touchAction: 'manipulation' }}
              onClick={() => setIsOpen((prev) => !prev)}
              onTouchEnd={(e) => {
                e.preventDefault()
                setIsOpen((prev) => !prev)
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown — outside the h-20 row so it isn't clipped */}
        {isOpen && (
          <div
            style={{ position: 'relative', zIndex: 100, borderTop: '1px solid rgba(255,255,255,0.08)', background: '#060B18', paddingTop: '16px', paddingBottom: '16px' }}
            className="lg:hidden"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/" prefetch={false} onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 12px', fontSize: '14px', color: '#fff', fontWeight: 500, borderRadius: '8px', textDecoration: 'none' }}>Home</Link>
              <Link href="#features" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 12px', fontSize: '14px', color: '#d1d5db', borderRadius: '8px', textDecoration: 'none' }}>Features</Link>
              <Link href="#pricing" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 12px', fontSize: '14px', color: '#d1d5db', borderRadius: '8px', textDecoration: 'none' }}>Pricing</Link>
              <Link href="#about" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 12px', fontSize: '14px', color: '#d1d5db', borderRadius: '8px', textDecoration: 'none' }}>About Us</Link>
              <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'block', textAlign: 'center', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', textDecoration: 'none' }}
                >
                  Sign In
                </Link>
                <Link
                  href="/subscribe?plan=starter"
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'block', textAlign: 'center', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'linear-gradient(to right, #ef4444, #e11d48)', borderRadius: '8px', textDecoration: 'none' }}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
