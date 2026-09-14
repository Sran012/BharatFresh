import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:4000/api";

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

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

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
