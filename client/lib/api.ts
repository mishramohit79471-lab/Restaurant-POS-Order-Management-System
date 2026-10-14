const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const TOKEN_KEY = "dineflow_token";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/login")) {
      tokenStore.clear();
      window.location.href = "/login";
    }
    throw new ApiError(body.message ?? "Request failed", res.status);
  }
  return body as T;
}
