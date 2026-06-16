'use client'
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL

const priorityStyle: Record<string, string> = {
  P1: "bg-red-100 text-red-700 border border-red-200",
  P2: "bg-orange-100 text-orange-700 border border-orange-200",
  P3: "bg-blue-100 text-blue-700 border border-blue-200",
  P4: "bg-slate-100 text-slate-500 border border-slate-200",
}

const statusStyle: Record<string, string> = {
  escalated: "bg-red-50 text-red-600 border border-red-200",
  in_review: "bg-blue-50 text-blue-600 border border-blue-200",
  open: "bg-slate-50 text-slate-500 border border-slate-200",
  resolved: "bg-emerald-50 text-emerald-600 border border-emerald-200",
}

const Badge = ({ label, style }: { label: string; style: string }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>
)

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch(`${API}/tickets`).then(r => r.json()).then(setTickets)
  }, [])

  const process = async (id: string) => {
    setProcessing(id)
    const r = await fetch(`${API}/tickets/${id}/process`, { method: "POST" })
    const updated = await r.json()
    setTickets(prev => prev.map(t => t.id === id ? updated : t))
    setSelected(updated)
    setDraft(updated.draft_response || "")
    setProcessing(null)
  }

  const resolve = async (id: string) => {
    const r = await fetch(`${API}/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    })
    const updated = await r.json()
    setTickets(prev => prev.map(t => t.id === id ? updated : t))
    setSelected(updated)
  }

  const filterTabs = [
    { key: "all", label: "All", count: tickets.length },
    { key: "escalated", label: "Escalated", count: tickets.filter(t => t.status === "escalated").length },
    { key: "in_review", label: "In review", count: tickets.filter(t => t.status === "in_review").length },
    { key: "resolved", label: "Resolved", count: tickets.filter(t => t.status === "resolved").length },
  ]

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-88px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ticket Queue</h1>
          <p className="text-sm text-slate-400 mt-0.5">AI-triaged support tickets with human-in-the-loop review</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filter === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: ticket list */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              No tickets in this category
            </div>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => { setSelected(t); setDraft(t.draft_response || "") }}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                selected?.id === t.id
                  ? "border-blue-400 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{t.title}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {t.priority && <Badge label={t.priority} style={priorityStyle[t.priority] || ""} />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{t.submitter_email}</p>
                <Badge label={t.status?.replace("_", " ") || "open"} style={statusStyle[t.status] || statusStyle.open} />
              </div>
              {t.tags?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              {/* Ticket header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900 leading-snug">{selected.title}</h2>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {selected.priority && <Badge label={selected.priority} style={priorityStyle[selected.priority] || ""} />}
                    <Badge label={selected.status?.replace("_", " ") || "open"} style={statusStyle[selected.status] || statusStyle.open} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400">{selected.submitter_email}</span>
                  {selected.category && (
                    <span className="text-xs text-slate-400">· {selected.category}</span>
                  )}
                  {selected.confidence && (
                    <span className="text-xs text-slate-400">· {(selected.confidence * 100).toFixed(0)}% confidence</span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-5 flex-1">
                {/* Original message */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Original message</p>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                  </div>
                </div>

                {/* AI draft */}
                {selected.draft_response ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI draft response</p>
                      <span className="text-xs text-blue-500 font-medium">· edit before sending</span>
                    </div>
                    <textarea
                      className="w-full text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed transition-all"
                      rows={8}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                    />

                    {/* Cost info */}
                    {selected.token_cost_usd && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-400">Cost: <span className="font-mono">${selected.token_cost_usd.toFixed(5)}</span></span>
                        <span className="text-xs text-slate-400">Latency: {selected.latency_ms}ms</span>
                        <span className="text-xs text-slate-400">Model: claude-haiku-4-5</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => resolve(selected.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <span>✓</span> Approve & resolve
                      </button>
                      <button
                        onClick={() => resolve(selected.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Escalate to human
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => process(selected.id)}
                    disabled={!!processing}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === selected.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing with AI...
                      </span>
                    ) : (
                      "⚡ Process with AI"
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-medium text-slate-600">Select a ticket</p>
              <p className="text-xs text-slate-400 mt-1">Click any ticket on the left to view details and AI draft</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
