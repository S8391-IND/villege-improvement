import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, type Announcement } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { Megaphone, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Announcements() {
  const { data: me } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<{ announcements: Announcement[]; total: number }>("/announcements?limit=50"),
  });

  const create = useMutation({
    mutationFn: () => api.post("/announcements", { title, content }),
    onSuccess: () => {
      toast.success("Announcement posted!");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setTitle(""); setContent(""); setShowForm(false);
    },
    onError: (e: any) => toast.error(e.error ?? "Failed to post"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/announcements/${id}`),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Community updates and notices.</p>
        </div>
        {me?.role === "admin" && (
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && me?.role === "admin" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-foreground">New Announcement</h2>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your announcement..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {create.isPending ? "Posting…" : "Post Announcement"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : data?.announcements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.announcements.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl hover:border-primary/30 transition-all group">
              <Link href={`/announcements/${a.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {initials(a.author.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {a.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {a.author.name} · {formatRelative(a.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </Link>
              {me?.role === "admin" && (
                <div className="px-5 pb-4 pt-0 flex justify-end">
                  <button
                    onClick={() => { if (confirm("Delete this announcement?")) remove.mutate(a.id); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
