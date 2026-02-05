import type { ServerResponse } from '@eftypes/server';
import { backendHost } from '@/services/env';

class ServerService {
  constructor() {}

  private unauthorizedHandler() {
    // TODO
  }

  public async request<T>(url: string, options?: RequestInit): Promise<ServerResponse<T>> {
    try {
      const fullURL = new URL(url, backendHost || window.location.origin);
      const response = await fetch(fullURL, options);

      // Handle 401 specifically
      if (response.status === 401) {
        if (this.unauthorizedHandler) {
          this.unauthorizedHandler();
        }
        throw new Error('Token expired');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ServerResponse<T>;

      if (data.code !== 200) {
        // Handle application-level 401 if code matches
        if (data.code === 401) {
          if (this.unauthorizedHandler) {
            this.unauthorizedHandler();
          }
        }
        throw new Error(data.message || 'Server error');
      }

      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }
}

export const serverService = new ServerService();
