import type { UserSyncState } from "@/lib/types";

export async function fetchUserState(signal?: AbortSignal): Promise<UserSyncState | null> {
  const res = await fetch("/api/user/sync", {
    cache: "no-store",
    signal,
  });

  if (res.status === 401) return null;
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Could not load user state");
  }

  return (await res.json()) as UserSyncState;
}
