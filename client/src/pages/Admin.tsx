import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils";
import { Shield, Users, Megaphone, Store, Calendar, UserCheck, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<{ users: any[]; total: number }>("/users?limit=100"),
  });

  const { data: contactRequests } = useQuery({
    queryKey: ["contact-requests"],
    queryFn: () => api.get<any[]>("/contact-requests"),
  });

  const promote = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.patch(`/users/${id}/profile`, { role } as any),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed"),
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      api.patch(`/contact-requests/${id}/respond`, { action }),
    onSuccess: () => { toast.success("Done"); qc.invalidateQueries({ queryKey: ["contact-requests"] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed"),
  });

  const pendingRequests = contactRequests?.filter(r => r.status === "pending") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" /> Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage residents and community requests.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Residents", value: usersData?.total ?? "—", icon: Users, color: "text-primary" },
          { label: "Pending Requests", value: pendingRequests.length, icon: UserCheck, color: "text-secondary" },
          { label: "Admins", value: usersData?.users.filter(u => u.role === "admin").length ?? "—", icon: Crown, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Regular Residents", value: usersData?.users.filter(u => u.role === "resident").length ?? "—", icon: Shield, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending contact requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-secondary" /> Pending Contact Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.map(r => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="font-medium">{r.requester.name}</span>
                  <span className="text-muted-foreground"> requested contact info of </span>
                  <span className="font-medium">{r.target.name}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => respond.mutate({ id: r.id, action: "approve" })}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition-colors">
                    Approve
                  </button>
                  <button onClick={() => respond.mutate({ id: r.id, action: "reject" })}
                    className="px-3 py-1.5 bg-muted hover:bg-destructive/10 hover:text-destructive text-xs font-medium rounded-lg transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Residents table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> All Residents
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resident</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">House</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersData?.users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.houseNumber}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.familyCount}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => promote.mutate({ id: u.id, role: u.role === "admin" ? "resident" : "admin" })}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors">
                      {u.role === "admin" ? "Demote" : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
