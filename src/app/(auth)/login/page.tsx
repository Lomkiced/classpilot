"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 selection:bg-pink-100 selection:text-pink-900">
      
      {/* Animated Background Mesh */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-[150%] w-[150%] animate-[spin_40s_linear_infinite] opacity-30">
          <div className="absolute top-1/4 left-1/4 h-[40rem] w-[40rem] rounded-full bg-pink-300/40 blur-[100px] mix-blend-multiply" />
          <div className="absolute top-1/3 right-1/4 h-[35rem] w-[35rem] rounded-full bg-purple-300/40 blur-[100px] mix-blend-multiply animate-[ping_10s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute bottom-1/4 left-1/3 h-[45rem] w-[45rem] rounded-full bg-rose-200/40 blur-[100px] mix-blend-multiply" />
        </div>
        
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Main Glass Card */}
      <div className="z-10 w-full max-w-md px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white/70 shadow-2xl shadow-pink-900/5 ring-1 ring-gray-900/5 backdrop-blur-2xl">
          <div className="p-8 sm:p-10 space-y-8">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                <Logo size="sm" showText={false} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in to ClassPilot</h2>
                <p className="text-sm text-gray-500 font-medium">Your advanced command center.</p>
              </div>
            </div>

            <form action={formAction} className="space-y-6">
              
              {/* Global Error Banner */}
              {state.error && (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600 animate-in zoom-in-95 duration-300 backdrop-blur-sm text-center font-medium">
                  {state.error}
                </div>
              )}

              <div className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@school.edu"
                    autoComplete="email"
                    required
                    className="h-12 rounded-xl border-gray-200/80 bg-white/50 px-4 text-base shadow-sm transition-all placeholder:text-gray-400 hover:bg-white focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
                  />
                  {state.fieldErrors?.email && (
                    <p className="text-xs font-medium text-red-500">{state.fieldErrors.email[0]}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="h-12 rounded-xl border-gray-200/80 bg-white/50 px-4 text-base shadow-sm transition-all placeholder:text-gray-400 hover:bg-white focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
                  />
                  {state.fieldErrors?.password && (
                    <p className="text-xs font-medium text-red-500">{state.fieldErrors.password[0]}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gray-900 text-white font-semibold shadow-md transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-70 disabled:hover:scale-100 active:scale-[0.98]"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                      <span>Authenticating</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                  
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </Button>
              </div>
              
            </form>
          </div>
          
          {/* Decorative Bottom Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 opacity-90" />
        </div>
      </div>
    </div>
  );
}
