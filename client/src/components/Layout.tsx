import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api, type Notification } from "@/lib/api";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Home, Users, Bell, Megaphone, Calendar, Store,
  User as UserIcon, Shield, LogOut, Menu, X, Moon, Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation as useWouterLocation } from "wouter";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useAuth();
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.get("/notifications?unread=true"),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications?.length ?? 0;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const [, navigate] = useWouterLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate("/login"),
      onError: () => toast.error("Logout failed"),
    });
  };

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users, label: "Directory", href: "/directory" },
    { icon: Megaphone, label: "Announcements", href: "/announcements" },
    { icon: Calendar, label: "Meetings", href: "/meetings" },
    { icon: Store, label: "Marketplace", href: "/marketplace" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadCount || null },
    { icon: UserIcon, label: "Profile", href: "/profile" },
    ...(user?.role === "admin" ? [{ icon: Shield, label: "Admin", href: "/admin", badge: null }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-[15px] text-primary leading-none">Village Connect</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Community Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  active ? "bg-white/25 text-white" : "bg-destructive text-white"
                )}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <button onClick={() => setDark(d => !d)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">House {user.houseNumber}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-accent transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
