import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, type Listing } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRelative, initials } from "@/lib/utils";
import { Store, Plus, Search, Trash2, Tag, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Furniture", "Electronics", "Appliances", "Sports", "Books", "Clothing", "Services", "Other"];

export default function Marketplace() {
  const { data: me } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const debounced = useDebounce(search, 300);

  const params = new URLSearchParams();
  if (debounced) params.set("search", debounced);
  if (category !== "All") params.set("category", category);
  params.set("limit", "24");

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", debounced, category],
    queryFn: () => api.get<{ listings: Listing[]; total: number }>(`/marketplace?${params}`),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/marketplace/${id}`),
    onSuccess: () => { toast.success("Listing removed"); qc.invalidateQueries({ queryKey: ["marketplace"] }); },
    onError: (e: any) => toast.error(e.error ?? "Failed to remove"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy, sell, and trade within the community.</p>
        </div>
        <Link href="/marketplace/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === c
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : data?.listings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm mt-1">Be the first to post something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.listings.map(l => (
            <div key={l.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all group flex flex-col">
              {/* Image / placeholder */}
              <div className="h-36 bg-gradient-to-br from-muted to-accent flex items-center justify-center shrink-0">
                {l.imageUrl ? (
                  <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-muted-foreground/40" />
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{l.title}</h3>
                  {l.price != null ? (
                    <span className="text-sm font-bold text-secondary shrink-0 flex items-center">
                      <IndianRupee className="w-3 h-3" />{l.price.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-primary shrink-0">Free</span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">{l.description}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />{l.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                      {initials(l.author.name)}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelative(l.createdAt)}</span>
                  </div>
                </div>

                {(me?.id === l.authorId || me?.role === "admin") && (
                  <button onClick={() => { if (confirm("Remove this listing?")) remove.mutate(l.id); }}
                    className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 py-1.5 rounded-lg transition-colors w-full">
                    <Trash2 className="w-3.5 h-3.5" /> Remove listing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
