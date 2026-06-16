import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { initials, formatDate } from "@/lib/utils";
import { Home, Phone, UserCheck, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DirectoryProfile() {
  const [, params] = useRoute("/directory/:id");
  const id = params?.id;
  const { data: me } = useAuth();
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<any>(`/users/${id}`),
    enabled: !!id,
  });

  const sendRequest = useMutation({
    mutationFn: () => api.post("/contact-requests", { targetId: Number(id) }),
    onSuccess: () => { toast.success("Contact request sent!"); qc.invalidateQueries({ queryKey: ["user", id] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed to send request"),
  });

  if (isLoading) return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="h-40 bg-muted rounded-2xl animate-pulse" />
      <div className="h-20 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  if (!user) return <div className="text-center py-16 text-muted-foreground">User not found.</div>;

  const isSelf = me?.id === user.id;
  const status = user.contactRequestStatus;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border-4 border-card">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : initials(user.name)}
            </div>
            {user.role === "admin" && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">Admin</span>
            )}
          </div>

          <h1 className="text-2xl font-serif font-bold text-foreground">{user.name}</h1>
          {user.bio && <p className="text-muted-foreground text-sm mt-1">{user.bio}</p>}

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Home className="w-4 h-4" /> House {user.houseNumber}</p>
            <p className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> {user.familyCount} family {user.familyCount === 1 ? "member" : "members"}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Member since {formatDate(user.createdAt)}</p>
            {user.phone && status === "approved" && (
              <p className="flex items-center gap-2 text-foreground font-medium">
                <Phone className="w-4 h-4 text-primary" /> {user.phone}
              </p>
            )}
          </div>

          {!isSelf && (
            <div className="mt-5 pt-4 border-t border-border">
              {status === "none" && (
                <button onClick={() => sendRequest.mutate()}
                  disabled={sendRequest.isPending}
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                  {sendRequest.isPending ? "Sending…" : "Request Contact Info"}
                </button>
              )}
              {status === "pending" && (
                <div className="w-full py-2.5 px-4 bg-muted text-muted-foreground text-sm font-medium rounded-lg text-center">
                  Contact request pending
                </div>
              )}
              {status === "approved" && (
                <div className="w-full py-2.5 px-4 bg-primary/10 text-primary text-sm font-semibold rounded-lg text-center flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" /> Contact approved
                </div>
              )}
              {status === "rejected" && (
                <div className="w-full py-2.5 px-4 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center">
                  Contact request was declined
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
