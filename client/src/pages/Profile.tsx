import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { User, Home, Phone, Calendar, Save, Edit2, X } from "lucide-react";

export default function Profile() {
  const { data: user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    houseNumber: user?.houseNumber ?? "",
    familyCount: user?.familyCount ?? 1,
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  });

  const update = useMutation({
    mutationFn: () => api.patch(`/users/${user?.id}/profile`, {
      name: form.name,
      houseNumber: form.houseNumber,
      familyCount: Number(form.familyCount),
      phone: form.phone || null,
      bio: form.bio || null,
      avatarUrl: form.avatarUrl || null,
    }),
    onSuccess: () => {
      toast.success("Profile updated!");
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.error ?? "Failed to update"),
  });

  if (!user) return null;

  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your community profile.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-primary/30 to-secondary/20" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold border-4 border-card shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : initials(user.name)}
            </div>
            {!editing ? (
              <button onClick={() => { setForm({ name: user.name, houseNumber: user.houseNumber, familyCount: user.familyCount, phone: user.phone ?? "", bio: user.bio ?? "", avatarUrl: user.avatarUrl ?? "" }); setEditing(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <button onClick={() => setEditing(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">House number</label>
                  <input value={form.houseNumber} onChange={e => setForm(f => ({ ...f, houseNumber: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Family members</label>
                  <input value={form.familyCount} onChange={e => setForm(f => ({ ...f, familyCount: Number(e.target.value) }))} type="number" min={1} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3} placeholder="Tell the community a little about yourself…" className={`${inputCls} resize-none`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Avatar URL (optional)</label>
                <input value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://…" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => update.mutate()} disabled={update.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                  <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save changes"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-5 py-2.5 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-foreground">{user.name}</h2>
              {user.role === "admin" && (
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">Administrator</span>
              )}
              {user.bio && <p className="text-muted-foreground text-sm mt-2">{user.bio}</p>}

              <div className="mt-4 space-y-2.5 text-sm text-muted-foreground pt-4 border-t border-border">
                <p className="flex items-center gap-2.5"><User className="w-4 h-4 text-primary/70" />{user.email}</p>
                <p className="flex items-center gap-2.5"><Home className="w-4 h-4 text-primary/70" />House {user.houseNumber} · {user.familyCount} {user.familyCount === 1 ? "member" : "members"}</p>
                {user.phone && <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-primary/70" />{user.phone}</p>}
                <p className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary/70" />Member since {formatDate(user.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
