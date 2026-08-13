import { Logo } from "@/components/ui/logo";

interface GlobalLoaderProps {
  variant?: "fullscreen" | "container";
}

export function GlobalLoader({ variant = "container" }: GlobalLoaderProps) {
  const containerClasses =
    variant === "fullscreen"
      ? "flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-50"
      : "relative flex h-full w-full min-h-[calc(100vh-200px)] flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm";

  return (
    <div className={containerClasses}>
      
      {/* 
        Premium Loading State
        Uses smooth glowing pulses and continuous rings instead of segmented dashes.
      */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        
        {/* Soft Glowing Ambient Backdrop */}
        <div className="absolute h-32 w-32 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-pink-500/10 blur-2xl"></div>
        <div className="absolute h-24 w-24 animate-[pulse_2s_ease-in-out_infinite_reverse] rounded-full bg-pink-400/20 blur-xl"></div>

        {/* Outer Ring - Continuous smooth gradient spin */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="premium-gradient-1" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#premium-gradient-1)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Inner Ring - Counter-spin with a tighter radius */}
        <div className="absolute inset-4 animate-[spin_3s_linear_infinite_reverse]">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="premium-gradient-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" stopOpacity="0" />
                <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#premium-gradient-2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* The ClassPilot Logo Core */}
        <div className="relative z-10 animate-[bounce_2s_ease-in-out_infinite] transition-transform duration-700">
          <div className="rounded-2xl bg-white p-3 shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)] ring-1 ring-black/5">
            <Logo size="lg" showText={false} />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="mt-6 flex flex-col items-center">
        <h3 className="text-sm font-semibold tracking-widest text-gray-900">
          CLASSPILOT
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="h-1.5 w-1.5 animate-[bounce_1.4s_infinite_ease-in-out_0.2s] rounded-full bg-pink-500"></div>
            <div className="h-1.5 w-1.5 animate-[bounce_1.4s_infinite_ease-in-out_0.4s] rounded-full bg-pink-400"></div>
            <div className="h-1.5 w-1.5 animate-[bounce_1.4s_infinite_ease-in-out_0.6s] rounded-full bg-pink-300"></div>
          </div>
          <span className="text-xs font-medium text-gray-500">Loading your workspace</span>
        </div>
      </div>

    </div>
  );
}
