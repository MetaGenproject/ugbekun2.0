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
    sm: { icon: 'w-7 h-8', title: 'text-xs', subtitle: 'text-[7.5px]' },
    md: { icon: 'w-10 h-11', title: 'text-xl', subtitle: 'text-[11px]' },
    lg: { icon: 'w-13 h-14', title: 'text-2xl', subtitle: 'text-xs' },
  }

  const currentSize = sizeClasses[size]

  const LogoContent = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Standalone Gradient Benin Mask Icon (with graduation cap) sitting directly on page */}
      <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
        <Image
          src="/ugbekun-full-gradient-mask.png"
          alt="Ugbekun Benin Mask Icon"
          width={64}
          height={69}
          className="w-full h-full object-contain filter drop-shadow-sm group-hover:brightness-110 transition-all"
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
