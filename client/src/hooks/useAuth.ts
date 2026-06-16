import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type SafeUser } from "@/lib/api";

export function useAuth() {
  return useQuery<SafeUser>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<{ user: SafeUser }>("/auth/login", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; email: string; password: string;
      houseNumber: string; familyCount?: number; phone?: string;
    }) => api.post<{ user: SafeUser }>("/auth/register", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout", {}),
    onSuccess: () => {
      qc.clear();
    },
  });
}
