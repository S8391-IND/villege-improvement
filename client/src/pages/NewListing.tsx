import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";

const CATEGORIES = ["Furniture", "Electronics", "Appliances", "Sports", "Books", "Clothing", "Services", "Other"];

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  price: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function NewListing() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: (data: z.infer<typeof schema>) =>
      api.post("/marketplace", { ...data, imageUrl: data.imageUrl || undefined }),
    onSuccess: () => {
      toast.success("Listing created!");
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      navigate("/marketplace");
    },
    onError: (e: any) => toast.error(e.error ?? "Failed to create listing"),
  });

  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">New Listing</h1>
        <p className="text-muted-foreground mt-1">Post something for sale or give away.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-5">
          <Field label="Title" error={errors.title?.message}>
            <input {...register("title")} placeholder="e.g. Teak wood dining table" className={inputCls} />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} rows={4} placeholder="Describe your item..." className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.category?.message}>
              <select {...register("category")} className={inputCls}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price (₹) — leave blank if free" error={errors.price?.message}>
              <input {...register("price")} type="number" min={0} step={0.01} placeholder="0" className={inputCls} />
            </Field>
          </div>

          <Field label="Image URL (optional)" error={errors.imageUrl?.message}>
            <input {...register("imageUrl")} placeholder="https://..." className={inputCls} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending}
              className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {create.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Store className="w-4 h-4" /> Post Listing</span>
              )}
            </button>
            <Link href="/marketplace"
              className="px-4 py-2.5 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
