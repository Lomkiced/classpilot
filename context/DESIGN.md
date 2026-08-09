# ClassPilot — Design System & UI Guidelines

## 1. Brand Identity & Theme
- **Tone**: Editorial, calm, professional, yet approachable. We avoid overly dense enterprise interfaces.
- **Vibe**: The design must not look like "AI slop" or a generic bootstrap template. It must feel premium, using glassmorphism sparingly, dynamic micro-interactions, and vibrant but controlled accents.
- **Primary Accent**: Deep Pink (`bg-pink-600` / `text-pink-600`) as the primary call-to-action color, providing a warm, human touch against neutral backgrounds.

## 2. Typography
- **Primary Font**: `Inter` (Google Fonts).
- **Hierarchy**:
  - `h1`: 24px (text-2xl), font-bold, tracking-tight, text-gray-900.
  - `h2/h3`: 18px (text-lg) to 20px (text-xl), font-semibold, text-gray-900.
  - `body`: 14px (text-sm) to 16px (text-base), text-gray-600.
- **Motto**: Prioritize readability. Line heights should be generous (`leading-relaxed`).

## 3. Layout & Spacing (Tailwind v4)
- **Container**: Max-width constraints (`max-w-7xl` for dashboards, `max-w-4xl` for forms/editors) to ensure the UI doesn't stretch awkwardly on ultrawide monitors.
- **Spacing**: Use a standard 4-point grid (`gap-4`, `p-6`, `space-y-8`).
- **Cards**: All data groups should be housed in pristine white cards (`bg-white`, `rounded-xl`, `border border-gray-200`, `shadow-sm`).
- **Hover States**: Interactive cards should have a subtle transform or border color shift (`hover:border-pink-300 hover:shadow-md transition-all`).

## 4. Components
- We rely on `@base-ui/react` for complex structural components (Dropdowns, Selects, Dialogs) to ensure 100% WAI-ARIA accessibility while allowing completely custom styling.
- Avoid generic UI libraries that lock in styles. Tailwind utility classes dictate the look and feel.
- **Icons**: `lucide-react`. Keep icon usage minimal and purposeful. Do not clutter lists with redundant icons.

## 5. Animations
- **Page Transitions**: Next.js App Router natively supports instant transitions, but utilize standard Tailwind fade-ins for loaded data (`animate-in fade-in duration-500`).
- **Micro-interactions**: Buttons and interactive elements should use `active:scale-95` or subtle background shifts on hover.
