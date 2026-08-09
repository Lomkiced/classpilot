"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      
      {/* Left Panel: Brand / Showcase */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gray-950 px-12 py-16 text-white">
        
        {/* Abstract Background Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-pink-600/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        {/* Header */}
        <div className="relative z-10">
          <Logo size="lg" className="[&_span]:text-white" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-sm font-medium text-pink-300 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>ClassPilot 2.0 is live</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            Navigate your classroom with precision.
          </h1>
          <p className="text-lg text-gray-400">
            The advanced, AI-powered command center designed exclusively for teachers to manage grades, lesson plans, and remarks in one seamless workflow.
          </p>
        </div>

        {/* Footer / Quote */}
        <div className="relative z-10 text-sm text-gray-500 font-medium">
          &copy; {new Date().getFullYear()} Pakdeepan CMS. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Logo size="sm" />
        </div>

        <div className="w-full max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <form action={formAction} className="space-y-6">
            
            {/* Global Error Banner */}
            {state.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-in zoom-in-95 duration-200">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@school.edu"
                  autoComplete="email"
                  required
                  className="h-12 border-gray-200 bg-white shadow-sm transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 px-4"
                />
                {state.fieldErrors?.email && (
                  <p className="text-xs font-medium text-red-600">{state.fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    Password
                  </Label>
                  {/* Future feature link */}
                  <a href="#" className="text-sm font-medium text-pink-600 hover:text-pink-500">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-12 border-gray-200 bg-white shadow-sm transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 px-4"
                />
                {state.fieldErrors?.password && (
                  <p className="text-xs font-medium text-red-600">{state.fieldErrors.password[0]}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="group h-12 w-full rounded-xl bg-gray-900 text-white font-semibold shadow-md transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-70"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
            
          </form>

        </div>
      </div>

    </div>
  );
}
