import { Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <Image 
              src="/ugbekun-logo.png" 
              alt="Ugbekun" 
              width={120} 
              height={40}
              className="h-10 w-auto mb-4"
            />
            <p className="text-foreground/60 text-sm leading-relaxed">
              Modernizing school management with innovative technology solutions for educational institutions across Nigeria.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="#features" className="hover:text-primary transition">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition">Pricing</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Security</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Roadmap</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Updates</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="#" className="hover:text-primary transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Contact</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Press</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="#" className="hover:text-primary transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-border/50 space-y-6">
          {/* Newsletter */}
          <div className="max-w-md">
            <h4 className="font-semibold text-foreground mb-3">Subscribe to our newsletter</h4>
            <p className="text-sm text-foreground/60 mb-4">Get the latest updates and tips for school management.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary text-sm"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm">
                Subscribe
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="text-sm text-foreground/60">
              <p>&copy; 2024 Ugbekun. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-foreground/60 hover:text-primary transition">
                <Mail size={18} />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-primary transition">
                <Phone size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
