import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Layout from "@/components/Layout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Directory from "@/pages/Directory";
import DirectoryProfile from "@/pages/DirectoryProfile";
import Announcements from "@/pages/Announcements";
import AnnouncementDetail from "@/pages/AnnouncementDetail";
import Meetings from "@/pages/Meetings";
import Marketplace from "@/pages/Marketplace";
import NewListing from "@/pages/NewListing";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { data: user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate("/login"); return; }
    if (adminOnly && user.role !== "admin") navigate("/");
  }, [user, isLoading, adminOnly, navigate]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || (adminOnly && user.role !== "admin")) return null;

  return <Layout><Component /></Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/directory" component={() => <ProtectedRoute component={Directory} />} />
      <Route path="/directory/:id" component={() => <ProtectedRoute component={DirectoryProfile} />} />
      <Route path="/announcements" component={() => <ProtectedRoute component={Announcements} />} />
      <Route path="/announcements/:id" component={() => <ProtectedRoute component={AnnouncementDetail} />} />
      <Route path="/meetings" component={() => <ProtectedRoute component={Meetings} />} />
      <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} />} />
      <Route path="/marketplace/new" component={() => <ProtectedRoute component={NewListing} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} adminOnly />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
