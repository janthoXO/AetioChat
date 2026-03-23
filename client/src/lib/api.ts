export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3031/api";

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  const token = match ? match[1] : null;
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMsg = "API Request Failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || errorData.error || response.statusText;
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  return response.json();
}
