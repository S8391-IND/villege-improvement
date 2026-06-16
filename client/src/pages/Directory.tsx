import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { initials } from "@/lib/utils";
import { Search, Users, Home } from "lucide-react";

export default function Directory() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["users", debounced],
    queryFn: () => api.get<{ users: any[]; total: number }>(`/users?search=${encodeURIComponent(debounced)}&limit=50`),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Resident Directory</h1>
        <p className="text-muted-foreground mt-1">Find and connect with your neighbours.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or house number…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {/* Count */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? "resident" : "residents"} found
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data?.users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No residents found</p>
          <p className="text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.users.map((user: any) => (
            <Link key={user.id} href={`/directory/${user.id}`}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Home className="w-3 h-3" /> House {user.houseNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.familyCount} {user.familyCount === 1 ? "member" : "members"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
