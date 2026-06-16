import { type User } from "@village-connect/database";

export function safeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    houseNumber: user.houseNumber,
    familyCount: user.familyCount,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
  };
}
