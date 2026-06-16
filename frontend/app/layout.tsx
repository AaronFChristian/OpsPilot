import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"

export const metadata: Metadata = {
  title: "OpsPilot — AI Ticket Triage",
  description: "AI-powered support ticket triage",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="font-bold text-slate-900 text-sm tracking-tight">OpsPilot</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { href: "/", label: "Dashboard" },
                { href: "/tickets", label: "Tickets" },
                { href: "/observability", label: "Observability" },
                { href: "/summary", label: "Executive Summary" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">claude-haiku-4-5</span>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}
