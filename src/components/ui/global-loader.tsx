import { Logo } from "@/components/ui/logo";

export function GlobalLoader() {
  return (
    <div className="relative flex h-full w-full min-h-[400px] flex-col items-center justify-center overflow-hidden bg-gray-50/50">
      
      {/* 
        The Core Loading System 
        Unique Gyroscopic / Radar Sweep Design
      */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        
        {/* Outer Ring - Slow Reverse Spin */}
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite_reverse]">
          <svg className="h-full w-full text-pink-200" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          </svg>
        </div>

        {/* Middle Ring - Fast Forward Spin with gradient sweep */}
        <div className="absolute inset-2 animate-[spin_3s_linear_infinite]">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#loader-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="138 138" // Approx half circumference
            />
          </svg>
        </div>

        {/* Inner Ring - Pulsing Dashes */}
        <div className="absolute inset-6 animate-[spin_12s_linear_infinite]">
          <svg className="h-full w-full text-pink-400/50" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="20 10 5 10"
            />
          </svg>
        </div>

        {/* Glowing Backdrop behind the Logo */}
        <div className="absolute h-16 w-16 animate-pulse rounded-full bg-pink-500/20 blur-xl"></div>

        {/* The ClassPilot Logo Core */}
        <div className="relative z-10 animate-pulse transition-transform duration-1000 ease-in-out">
          <Logo size="lg" showText={false} />
        </div>
      </div>

      {/* Typography */}
      <div className="mt-8 flex flex-col items-center">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900">
          ClassPilot
        </h3>
        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
          </span>
          Synchronizing Systems...
        </p>
      </div>

    </div>
  );
}
