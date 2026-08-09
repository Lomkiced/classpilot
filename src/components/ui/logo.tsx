import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-sm transition-transform hover:scale-105",
          sizeClasses[size],
          // Match width to height for a perfect square
          size === "sm" ? "w-6 rounded-lg" : 
          size === "md" ? "w-8 rounded-xl" : 
          size === "lg" ? "w-12 rounded-2xl shadow-lg" : 
          "w-16 rounded-2xl shadow-xl"
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "text-white",
            size === "sm" ? "h-3.5 w-3.5" : 
            size === "md" ? "h-4 w-4" : 
            size === "lg" ? "h-6 w-6" : 
            "h-8 w-8"
          )}
        >
          {/* Abstract Paper Plane / Pilot Wing Motif */}
          <path
            d="M16 4L3 14L16 24L29 14L16 4Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M3 24L16 34L29 24"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 14V24"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fillOpacity="0.5"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-gray-900",
            textClasses[size]
          )}
        >
          ClassPilot
        </span>
      )}
    </div>
  );
}
