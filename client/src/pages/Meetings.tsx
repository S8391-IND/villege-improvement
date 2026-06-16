import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Meeting } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Plus, Trash2, ExternalLink, Video, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Meetings() {
  const { data: me } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", meetingUrl: "", scheduledAt: "" });

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: () => api.get("/meetings"),
  });

  const create = useMutation({
    mutationFn: () => api.post("/meetings", { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    onSuccess: () => {
      toast.success("Meeting scheduled!");
      qc.invalidateQueries({ queryKey: ["meetings"] });
      setForm({ title: "", description: "", meetingUrl: "", scheduledAt: "" });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.error ?? "Failed to create"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/meetings/${id}`),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["meetings"] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed to delete"),
  });

  const now = new Date();
  const upcoming = meetings?.filter(m => new Date(m.scheduledAt) >= now) ?? [];
  const past = meetings?.filter(m => new Date(m.scheduledAt) < now) ?? [];

  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Community Meetings</h1>
          <p className="text-muted-foreground mt-1">Upcoming and past village meetings.</p>
        </div>
        {me?.role === "admin" && (
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && me?.role === "admin" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Schedule a Meeting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Meeting title" className={inputCls} />
            <input value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              type="datetime-local" className={inputCls} />
          </div>
          <input value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
            placeholder="Meeting URL (Zoom / Google Meet)" className={inputCls} />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)" rows={2}
            className={`${inputCls} resize-none`} />
          <div className="flex gap-3">
            <button onClick={() => create.mutate()}
              disabled={create.isPending || !form.title || !form.meetingUrl || !form.scheduledAt}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {create.isPending ? "Scheduling…" : "Schedule"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : meetings?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No meetings scheduled</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
              {upcoming.map(m => <MeetingCard key={m.id} meeting={m} isAdmin={me?.role === "admin"} onDelete={() => remove.mutate(m.id)} upcoming />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past</h2>
              {past.map(m => <MeetingCard key={m.id} meeting={m} isAdmin={me?.role === "admin"} onDelete={() => remove.mutate(m.id)} upcoming={false} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m, isAdmin, onDelete, upcoming }: { meeting: Meeting; isAdmin: boolean; onDelete: () => void; upcoming: boolean }) {
  return (
    <div className={`bg-card border rounded-xl p-5 transition-all ${upcoming ? "border-primary/30 shadow-sm" : "border-border opacity-75"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${upcoming ? "bg-primary/10" : "bg-muted"}`}>
          <Video className={`w-6 h-6 ${upcoming ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">{m.title}</h3>
              {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {formatDateTime(m.scheduledAt)}
                </span>
                <span className="text-xs text-muted-foreground">by {m.author.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {upcoming && (
                <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition-colors">
                  <ExternalLink className="w-3 h-3" /> Join
                </a>
              )}
              {isAdmin && (
                <button onClick={() => { if (confirm("Delete meeting?")) onDelete(); }}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
