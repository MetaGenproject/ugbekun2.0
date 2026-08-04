'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export function UgbekunLogo({ className = '', size = 'md', href = '/' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-8 h-9', title: 'text-xs', subtitle: 'text-[8px]' },
    md: { icon: 'w-11 h-12', title: 'text-xl', subtitle: 'text-[11px]' },
    lg: { icon: 'w-14 h-16', title: 'text-2xl', subtitle: 'text-xs' },
  }

  const currentSize = sizeClasses[size]

  const LogoContent = (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* Bold Vibrant Standalone Gradient Benin Mask Icon */}
      <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
        <Image
          src="/ugbekun-full-gradient-mask.png"
          alt="Ugbekun Benin Mask Icon"
          width={80}
          height={90}
          className="w-full h-full object-contain filter brightness-125 contrast-125 drop-shadow-[0_2px_10px_rgba(56,189,248,0.45)] group-hover:brightness-140 transition-all"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center leading-tight">
        <span className={`${currentSize.title} font-extrabold tracking-tight text-white group-hover:text-sky-300 transition-colors`}>
          Ugbekun
        </span>
        <span className={`${currentSize.subtitle} font-medium text-gray-300 tracking-normal`}>
          School Management System
        </span>
      </div>
    </div>
  )

  if (href && href !== '') {
    return <Link href={href}>{LogoContent}</Link>
  }

  return LogoContent
}
