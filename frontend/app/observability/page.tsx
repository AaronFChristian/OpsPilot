'use client'
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL

const MetricCard = ({ label, value, sub, accent = false }: { label: string; value: any; sub?: string; accent?: boolean }) => (
  <div className={`rounded-xl border p-5 shadow-sm ${accent ? "bg-blue-600 border-blue-500" : "bg-white border-slate-200"}`}>
    <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-blue-200" : "text-slate-400"}`}>{label}</p>
    <p className={`text-3xl font-bold mt-2 ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
    {sub && <p className={`text-xs mt-1 ${accent ? "text-blue-200" : "text-slate-400"}`}>{sub}</p>}
  </div>
)

export default function ObservabilityPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API}/ai/logs`).then(r => r.json()).then(setLogs)
  }, [])

  const totalCost = logs.reduce((s, l) => s + (l.cost_usd || 0), 0)
  const avgLatency = logs.length
    ? Math.round(logs.reduce((s, l) => s + (l.latency_ms || 0), 0) / logs.length)
    : 0
  const costPerTicket = logs.length ? totalCost / (logs.length / 2) : 0
  const classifyLogs = logs.filter(l => l.operation === "classify")
  const avgClassifyLatency = classifyLogs.length
    ? Math.round(classifyLogs.reduce((s, l) => s + l.latency_ms, 0) / classifyLogs.length)
    : 0

  const latencyColor = (ms: number) => {
    if (ms < 1500) return "text-emerald-600"
    if (ms < 3000) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Observability</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time cost and latency tracking for every AI request</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total AI spend" value={`$${totalCost.toFixed(4)}`} sub={`${logs.length} total requests`} accent />
        <MetricCard label="Cost per ticket" value={`$${costPerTicket.toFixed(5)}`} sub="classify + draft" />
        <MetricCard label="Avg latency" value={`${avgLatency}ms`} sub="all operations" />
        <MetricCard label="Classify latency" value={`${avgClassifyLatency}ms`} sub="average per ticket" />
      </div>

      {/* Operation breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {["classify", "draft"].map(op => {
          const opLogs = logs.filter(l => l.operation === op)
          const opCost = opLogs.reduce((s, l) => s + (l.cost_usd || 0), 0)
          const opLatency = opLogs.length
            ? Math.round(opLogs.reduce((s, l) => s + l.latency_ms, 0) / opLogs.length)
            : 0
          return (
            <div key={op} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  op === "classify" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}>{op}</span>
                <span className="text-xs text-slate-400">{opLogs.length} requests</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total cost</p>
                  <p className="text-lg font-bold text-emerald-600">${opCost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Avg latency</p>
                  <p className={`text-lg font-bold ${latencyColor(opLatency)}`}>{opLatency}ms</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Request log table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">AI request log</p>
          <p className="text-xs text-slate-400">Most recent first</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="px-5 py-3">Operation</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">In tokens</th>
                <th className="px-5 py-3">Out tokens</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Latency</th>
                <th className="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      log.operation === "classify"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {log.operation}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">haiku-4-5</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{log.input_tokens}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{log.output_tokens}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-600 font-mono">
                    ${log.cost_usd?.toFixed(5)}
                  </td>
                  <td className={`px-5 py-3 text-sm font-semibold ${latencyColor(log.latency_ms)}`}>
                    {log.latency_ms}ms
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
