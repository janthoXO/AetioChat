import { fetchApi } from "@/lib/api";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: "user" | "admin";
  };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return fetchApi<LoginResponse>("/users/login", {
    method: "POST",
    body: { username, password },
  });
}