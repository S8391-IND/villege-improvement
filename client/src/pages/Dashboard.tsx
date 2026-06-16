import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, type DashboardSummary } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/utils";
import { Users, Megaphone, Store, Calendar, Bell, UserCheck, ArrowRight, Clock } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useAuth();
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard/summary"),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = summary ? [
    { label: "Residents", value: summary.totalResidents, icon: Users, color: "bg-primary/10 text-primary", href: "/directory" },
    { label: "Announcements", value: summary.totalAnnouncements, icon: Megaphone, color: "bg-secondary/10 text-secondary", href: "/announcements" },
    { label: "Marketplace", value: summary.totalListings, icon: Store, color: "bg-accent text-accent-foreground", href: "/marketplace" },
    { label: "Upcoming Meetings", value: summary.upcomingMeetings, icon: Calendar, color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400", href: "/meetings" },
    { label: "Notifications", value: summary.unreadNotifications, icon: Bell, color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400", href: "/notifications" },
    { label: "Pending Requests", value: summary.pendingContactRequests, icon: UserCheck, color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400", href: "/notifications" },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {greeting}{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your community.</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                {card.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Recent Announcements
            </h2>
            <Link href="/announcements" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            )) : summary?.recentAnnouncements.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No announcements yet</div>
            ) : summary?.recentAnnouncements.map((a) => (
              <Link key={a.id} href={`/announcements/${a.id}`}
                className="block px-5 py-4 hover:bg-accent/50 transition-colors">
                <p className="font-medium text-sm text-foreground line-clamp-1">{a.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatRelative(a.createdAt)} · {a.author.name}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Store className="w-4 h-4 text-secondary" /> Marketplace
            </h2>
            <Link href="/marketplace" className="text-sm text-primary hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            )) : summary?.recentListings.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No listings yet</div>
            ) : summary?.recentListings.map((l) => (
              <Link key={l.id} href="/marketplace"
                className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{l.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.category}</p>
                </div>
                <div className="ml-4 shrink-0">
                  {l.price != null ? (
                    <span className="text-sm font-semibold text-secondary">₹{l.price.toLocaleString("en-IN")}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
