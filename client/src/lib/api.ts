const BASE = "/api";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw { status: res.status, error: err.error ?? "Request failed" };
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

// ---- Types ----
export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  houseNumber: string;
  familyCount: number;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author: SafeUser;
  createdAt: string;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  meetingUrl: string;
  scheduledAt: string;
  authorId: number;
  author: SafeUser;
  createdAt: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  price: number | null;
  authorId: number;
  author: SafeUser;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
}

export interface ContactRequest {
  id: number;
  requesterId: number;
  targetId: number;
  status: string;
  requester: SafeUser;
  target: SafeUser;
  createdAt: string;
}

export interface DashboardSummary {
  totalResidents: number;
  totalAnnouncements: number;
  totalListings: number;
  upcomingMeetings: number;
  pendingContactRequests: number;
  unreadNotifications: number;
  recentAnnouncements: Announcement[];
  recentListings: Listing[];
}
