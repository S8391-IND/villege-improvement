import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Notification } from "@/lib/api";
import { formatRelative } from "@/lib/utils";
import { Bell, BellOff, CheckCheck, Megaphone, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  new_announcement: Megaphone,
  contact_request: Users,
  contact_approved: UserCheck,
  contact_rejected: UserX,
};

const TYPE_COLOR: Record<string, string> = {
  new_announcement: "bg-primary/10 text-primary",
  contact_request: "bg-secondary/10 text-secondary",
  contact_approved: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  contact_rejected: "bg-destructive/10 text-destructive",
};

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications"),
  });

  const markOne = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => {
      toast.success("All marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <BellOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map(n => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const color = TYPE_COLOR[n.type] ?? "bg-muted text-muted-foreground";
            return (
              <div key={n.id}
                onClick={() => !n.isRead && markOne.mutate(n.id)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                  n.isRead
                    ? "bg-card border-border opacity-70 hover:opacity-100"
                    : "bg-card border-primary/30 shadow-sm hover:border-primary/50"
                )}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", n.isRead ? "text-muted-foreground" : "text-foreground font-medium")}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
