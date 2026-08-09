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
    <header className="fixed w-full top-0 z-50 bg-[#060B18]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main nav row */}
        <div className="flex justify-between items-center h-20">
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
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2 z-[100]">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl space-y-0.5">
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Academic Portal</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">CBT &amp; Examinations</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Finance &amp; Billing</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Parent &amp; Student Portal</Link>
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
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2 z-[100]">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl space-y-0.5">
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">For Primary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">For Secondary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">For Multi-Campus Groups</Link>
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
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2 z-[100]">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl space-y-0.5">
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Documentation</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Help Center</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Blog &amp; News</Link>
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
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2 z-[100]">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl space-y-0.5">
                  <Link href="#about" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">About Us</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Careers</Link>
                  <Link href="#contact" className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Contact Us</Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link 
              href="/login" 
              prefetch={false}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition inline-block"
            >
              Log in
            </Link>
            <Link 
              href="/subscribe?plan=starter" 
              prefetch={false}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-lg hover:from-red-600 hover:to-rose-700 transition inline-block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile: Sign In + Hamburger */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link 
              href="/login" 
              prefetch={false}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition inline-block whitespace-nowrap"
            >
              Sign In
            </Link>
            <button 
              type="button"
              className="p-2 text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation"
              onClick={() => setIsOpen((prev) => !prev)}
              onTouchEnd={(e) => {
                e.preventDefault()
                setIsOpen((prev) => !prev)}
              }
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="lg:hidden relative z-[100] border-t border-white/10 bg-[#060B18] py-4">
            <div className="flex flex-col space-y-1">
              <Link href="/" prefetch={false} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-white font-medium rounded-lg hover:bg-white/5">Home</Link>
              <Link href="#features" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-white/5">Features</Link>
              <Link href="#pricing" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-white/5">Pricing</Link>
              <Link href="#about" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-white/5">About Us</Link>
              <div className="pt-3 flex flex-col space-y-2">
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold text-white bg-white/10 border border-white/15 rounded-lg hover:bg-white/20"
                >
                  Sign In
                </Link>
                <Link
                  href="/subscribe?plan=starter"
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-lg hover:from-red-600 hover:to-rose-700"
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
