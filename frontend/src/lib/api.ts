const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}
