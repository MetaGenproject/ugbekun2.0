import Image from 'next/image'

export function LoginIllustration() {
  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 py-12 text-center">
        {/* Centered Ugbekun Logo */}
        <div className="mb-12 p-8 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl max-w-sm flex items-center justify-center">
          <Image
            src="/ugbekun-logo.png"
            alt="Ugbekun"
            width={240}
            height={80}
            className="w-56 h-auto drop-shadow-md"
            priority
          />
        </div>

        {/* Text Content */}
        <div className="space-y-4 max-w-sm">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Your School</h2>
          <p className="text-slate-700 text-base leading-relaxed font-medium">
            Streamline operations and enhance learning with our modern school management system
          </p>
          
          {/* Features List */}
          <div className="space-y-3 pt-6 max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-sm font-semibold">Real-time attendance tracking</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-sm font-semibold">Online class management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-sm font-semibold">Fee & payment tracking</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-sm font-semibold">Parent & student portals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
