import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Home } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  houseNumber: z.string().min(1, "House number is required"),
  familyCount: z.coerce.number().int().min(1).default(1),
  phone: z.string().optional(),
});

export default function Register() {
  const [, navigate] = useLocation();
  const register_ = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { familyCount: 1 },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    register_.mutate(data, {
      onSuccess: () => { toast.success("Account created!"); navigate("/"); },
      onError: (e: any) => toast.error(e.error ?? "Registration failed"),
    });
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-primary text-lg">Village Connect</span>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-1 text-sm">Join your community portal today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" error={errors.name?.message}>
                <input {...register("name")} placeholder="Priya Sharma" className={inputCls} />
              </Field>
              <Field label="House number" error={errors.houseNumber?.message}>
                <input {...register("houseNumber")} placeholder="B-12" className={inputCls} />
              </Field>
            </div>

            <Field label="Email address" error={errors.email?.message}>
              <input {...register("email")} type="email" placeholder="you@example.com" className={inputCls} />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input {...register("password")} type="password" placeholder="Min. 6 characters" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Family members" error={errors.familyCount?.message}>
                <input {...register("familyCount")} type="number" min={1} className={inputCls} />
              </Field>
              <Field label="Phone (optional)" error={errors.phone?.message}>
                <input {...register("phone")} placeholder="+91-XXXXXXXXXX" className={inputCls} />
              </Field>
            </div>

            <button
              type="submit"
              disabled={register_.isPending}
              className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 text-sm"
            >
              {register_.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
