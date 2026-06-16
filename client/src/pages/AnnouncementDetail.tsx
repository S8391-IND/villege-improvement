import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { api, type Announcement } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { ArrowLeft, Calendar } from "lucide-react";

export default function AnnouncementDetail() {
  const [, params] = useRoute("/announcements/:id");
  const { data, isLoading } = useQuery<Announcement>({
    queryKey: ["announcement", params?.id],
    queryFn: () => api.get(`/announcements/${params?.id}`),
    enabled: !!params?.id,
  });

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
      <div className="h-64 bg-muted rounded-2xl animate-pulse" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-muted-foreground">Announcement not found.</div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/announcements"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Announcements
      </Link>

      <article className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-snug">
            {data.title}
          </h1>

          <div className="flex items-center gap-4 mt-4 pb-6 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {initials(data.author.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{data.author.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3" />
                {formatDateTime(data.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 text-foreground leading-relaxed whitespace-pre-wrap">
            {data.content}
          </div>
        </div>
      </article>
    </div>
  );
}
