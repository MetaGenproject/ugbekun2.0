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
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl">
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Academic Portal</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">CBT & Examinations</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Finance & Billing</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Parent & Student Portal</Link>
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
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-56 pt-2">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl">
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">For Primary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">For Secondary Schools</Link>
                  <Link href="#features" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">For Multi-Campus Groups</Link>
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
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl">
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Documentation</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Help Center</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Blog & News</Link>
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
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 pt-2">
                <div className="bg-[#0B132B] border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl">
                  <Link href="#about" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">About Us</Link>
                  <Link href="#" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Careers</Link>
                  <Link href="#contact" className="block px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition">Contact Us</Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link 
              href="/login" 
              className="px-5 py-2.5 text-sm font-semibold text-white bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 hover:border-white/30 transition shadow-sm"
            >
              Log in
            </Link>
            <Link 
              href="/subscribe?plan=starter" 
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-lg shadow-md shadow-red-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center lg:hidden space-x-3">
            <Link 
              href="/login" 
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 rounded-lg"
            >
              Log in
            </Link>
            <button 
              className="p-2 text-white hover:bg-white/10 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-3 bg-[#060B18]">
            <Link href="/" className="block px-3 py-2 text-sm text-white font-medium hover:bg-white/5 rounded-lg">Home</Link>
            <Link href="#features" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">Features</Link>
            <Link href="#pricing" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">Pricing</Link>
            <Link href="#about" className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">About Us</Link>
            <div className="pt-3 space-y-2 px-3">
              <Link href="/login" className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-white/10 rounded-lg">
                Log in
              </Link>
              <Link href="/subscribe?plan=starter" className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-lg">
                Book a Demo
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
