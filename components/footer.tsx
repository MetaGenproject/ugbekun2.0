'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Linkedin, Instagram, Phone, Mail, MapPin } from 'lucide-react'
import { UgbekunLogo } from '@/components/logo'

export function Footer() {
  return (
    <footer id="contact" className="bg-[#050914] text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Bio */}
          <div className="lg:col-span-4 space-y-4">
            <UgbekunLogo size="md" />

            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Empowering schools with innovative technology to manage operations efficiently and deliver quality education.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Linkedin size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Product</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="#features" className="hover:text-white transition">Integrations</Link></li>
              <li><Link href="#features" className="hover:text-white transition">Updates</Link></li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Solutions</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#features" className="hover:text-white transition">For Primary Schools</Link></li>
              <li><Link href="#features" className="hover:text-white transition">For Secondary Schools</Link></li>
              <li><Link href="#features" className="hover:text-white transition">For Colleges</Link></li>
              <li><Link href="#features" className="hover:text-white transition">For School Groups</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Resources</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition">User Guide</Link></li>
              <li><Link href="#" className="hover:text-white transition">Video Tutorials</Link></li>
            </ul>
          </div>

          {/* Company Links & Contact */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Company</h4>
            <ul className="space-y-2 text-xs text-gray-400 mb-4">
              <li><Link href="#about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
              <li><Link href="#contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 pt-2">Contact</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-sky-400 shrink-0" />
                <span>0812 345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-sky-400 shrink-0" />
                <span>info@ugbekun.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-sky-400 shrink-0 mt-0.5" />
                <span>123 Education Drive, Lagos, Nigeria</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Ugbekun School Management System. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by Metagen Project</span>
            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
              M
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
