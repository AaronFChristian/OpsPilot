'use client'
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const API = process.env.NEXT_PUBLIC_API_URL

const MetricCard = ({
  label, value, sub, color = "text-slate-900"
}: { label: string; value: any; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value ?? "—"}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
)

const priorityColors: Record<string, string> = {
  P1: "bg-red-100 text-red-700 border-red-200",
  P2: "bg-orange-100 text-orange-700 border-orange-200",
  P3: "bg-blue-100 text-blue-700 border-blue-200",
  P4: "bg-slate-100 text-slate-600 border-slate-200",
}

export default function Dashboard() {
  const [volume, setVolume] = useState<any>(null)
  const [blockers, setBlockers] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API}/analytics/volume`).then(r => r.json()).then(setVolume)
    fetch(`${API}/analytics/blockers`).then(r => r.json()).then(setBlockers)
    fetch(`${API}/tickets`).then(r => r.json()).then(setTickets)
  }, [])

  const escalated = tickets.filter(t => t.escalate).length
  const p1Count = tickets.filter(t => t.priority === "P1").length
  const resolved = tickets.filter(t => t.status === "resolved").length
  const categoryData = volume
    ? Object.entries(volume.by_category).map(([name, count]) => ({ name, count }))
    : []

  const now = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">{now} · {tickets.length} tickets in system</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">AI pipeline active</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total tickets" value={volume?.total} sub="all time" />
        <MetricCard label="Escalated" value={escalated} sub="requires human review" color="text-red-600" />
        <MetricCard label="P1 Critical" value={p1Count} sub="immediate action needed" color="text-orange-600" />
        <MetricCard label="Resolved" value={resolved} sub="closed tickets" color="text-emerald-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4">Volume by category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blockers */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4">Top recurring blockers</p>
          <div className="space-y-3">
            {blockers.slice(0, 7).map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-4">{i + 1}</span>
                <span className="text-xs text-slate-600 flex-1 truncate">{b.name}</span>
                <div className="w-16 bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(b.count / (blockers[0]?.count || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-4 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority + Status row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority breakdown */}
        {volume && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-4">Priority breakdown</p>
            <div className="grid grid-cols-4 gap-3">
              {["P1", "P2", "P3", "P4"].map(p => (
                <div key={p} className={`rounded-lg border p-4 text-center ${priorityColors[p]}`}>
                  <p className="text-2xl font-bold">{volume.by_priority[p] ?? 0}</p>
                  <p className="text-xs font-semibold mt-1">{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status breakdown */}
        {volume && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-4">Status breakdown</p>
            <div className="space-y-3">
              {Object.entries(volume.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 capitalize">{status.replace("_", " ")}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status === "escalated" ? "bg-red-500" : status === "resolved" ? "bg-emerald-500" : "bg-blue-400"}`}
                      style={{ width: `${((count as number) / (volume.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-6 text-right">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
