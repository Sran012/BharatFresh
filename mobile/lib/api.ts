import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://bharatfresh.onrender.com/api";

type OnUnauthorized = () => void;

class ApiClient {
  private token: string | null = null;
  private onUnauthorized: OnUnauthorized | null = null;

  setOnUnauthorized(cb: OnUnauthorized) {
    this.onUnauthorized = cb;
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem("auth_token", token);
    } else {
      await AsyncStorage.removeItem("auth_token");
    }
  }

  async loadToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.loadToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Cannot reach server at ${BASE_URL} (timeout)`);
      }
      throw new Error(`Cannot reach server at ${BASE_URL}: ${error instanceof Error ? error.message : "network error"}`);
    } finally {
      clearTimeout(timeout);
    }

    const json = await res.json();

    if (res.status === 401) {
      await this.setToken(null);
      this.onUnauthorized?.();
      throw new Error("Session expired");
    }

    if (!res.ok) {
      throw new Error(json.error?.message ?? "Request failed");
    }

    return json.data as T;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

export const api = new ApiClient();
