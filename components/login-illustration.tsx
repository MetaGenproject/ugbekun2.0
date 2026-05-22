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
        {/* Illustration SVG */}
        <div className="mb-12 max-w-sm">
          <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-2xl">
            {/* School Building */}
            <defs>
              <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="doorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Building Main */}
            <rect x="100" y="180" width="200" height="180" fill="url(#buildingGradient)" rx="8" />

            {/* Roof */}
            <polygon points="100,180 200,80 300,180" fill="url(#roofGradient)" />

            {/* Flag pole */}
            <line x1="200" y1="80" x2="200" y2="50" stroke="#1e40af" strokeWidth="4" />

            {/* Flag */}
            <rect x="200" y="45" width="60" height="35" fill="#10b981" rx="4" />

            {/* Windows - Top Row */}
            <rect x="120" y="200" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="165" y="200" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="210" y="200" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="255" y="200" width="35" height="35" fill="#60a5fa" rx="2" />

            {/* Windows - Middle Row */}
            <rect x="120" y="250" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="165" y="250" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="210" y="250" width="35" height="35" fill="#60a5fa" rx="2" />
            <rect x="255" y="250" width="35" height="35" fill="#60a5fa" rx="2" />

            {/* Door */}
            <rect x="185" y="310" width="30" height="50" fill="url(#doorGradient)" rx="2" />
            <circle cx="212" cy="335" r="2" fill="#1e40af" />

            {/* Door handle */}
            <circle cx="212" cy="335" r="3" fill="#fbbf24" />

            {/* Students - Left */}
            <g>
              {/* Head */}
              <circle cx="80" cy="280" r="12" fill="#fcd34d" />
              {/* Body */}
              <rect x="75" y="295" width="10" height="25" fill="#3b82f6" rx="2" />
              {/* Legs */}
              <line x1="78" y1="320" x2="78" y2="330" stroke="#1f2937" strokeWidth="2" />
              <line x1="82" y1="320" x2="82" y2="330" stroke="#1f2937" strokeWidth="2" />
            </g>

            {/* Students - Right */}
            <g>
              {/* Head */}
              <circle cx="330" cy="290" r="12" fill="#fcd34d" />
              {/* Body */}
              <rect x="325" y="305" width="10" height="25" fill="#ec4899" rx="2" />
              {/* Legs */}
              <line x1="328" y1="330" x2="328" y2="340" stroke="#1f2937" strokeWidth="2" />
              <line x1="332" y1="330" x2="332" y2="340" stroke="#1f2937" strokeWidth="2" />
            </g>

            {/* Books/Stack */}
            <g>
              <rect x="50" y="330" width="20" height="15" fill="#ef4444" opacity="0.8" rx="1" />
              <rect x="52" y="315" width="20" height="15" fill="#f97316" opacity="0.8" rx="1" />
              <rect x="54" y="300" width="20" height="15" fill="#eab308" opacity="0.8" rx="1" />
            </g>

            {/* Light rays */}
            <line x1="200" y1="0" x2="200" y2="40" stroke="#fbbf24" strokeWidth="2" opacity="0.5" strokeDasharray="5,5" />
            <line x1="160" y1="20" x2="195" y2="45" stroke="#fbbf24" strokeWidth="2" opacity="0.5" strokeDasharray="5,5" />
            <line x1="240" y1="20" x2="205" y2="45" stroke="#fbbf24" strokeWidth="2" opacity="0.5" strokeDasharray="5,5" />
          </svg>
        </div>

        {/* Text Content */}
        <div className="space-y-4 max-w-xs">
          <h2 className="text-3xl font-bold text-slate-900 drop-shadow-lg">Manage Your School</h2>
          <p className="text-slate-800 text-lg leading-relaxed drop-shadow-md">
            Streamline operations and enhance learning with our modern school management system
          </p>
          
          {/* Features List */}
          <div className="space-y-3 pt-6">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">Real-time attendance tracking</span>
            </div>
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">Online class management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">Fee & payment tracking</span>
            </div>
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">Parent & student portals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
