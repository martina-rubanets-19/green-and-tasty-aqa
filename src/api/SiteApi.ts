import { APIRequestContext, APIResponse } from '@playwright/test';
import type { ContactMessage } from '../data/factories';

export interface Room {
  roomid: number;
  roomName: string;
  type: string;
  accessible: boolean;
  image: string;
  description: string;
  features: string[];
  roomPrice: number;
}

export interface MessageSummary {
  id: number;
  name: string;
  subject: string;
  read: boolean;
}

/**
 * Thin client for the site's public HTTP API (the same endpoints the UI calls).
 * Used for test data preparation, state checks and cleanup — never instead of the UI
 * in the scenarios themselves.
 */
export class SiteApi {
  constructor(private readonly request: APIRequestContext) {}

  // ---------- auth ----------

  async login(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { username, password } });
  }

  /** Returns the admin token, or null when the credentials are rejected. */
  async loginToken(username: string, password: string): Promise<string | null> {
    const response = await this.login(username, password);
    if (!response.ok()) return null;
    const body = await response.json().catch(() => ({}));
    if (body?.token) return String(body.token);
    const cookie = response.headers()['set-cookie'] ?? '';
    const match = cookie.match(/token=([^;]+)/);
    return match ? match[1] : null;
  }

  // ---------- rooms ----------

  async getRoomResponse(roomId: number | string): Promise<APIResponse> {
    return this.request.get(`/api/room/${roomId}`);
  }

  async listRooms(checkin?: string, checkout?: string): Promise<Room[]> {
    const query = checkin && checkout ? `?checkin=${checkin}&checkout=${checkout}` : '';
    const response = await this.request.get(`/api/room${query}`);
    if (!response.ok()) throw new Error(`GET /api/room${query} -> ${response.status()}`);
    const body = await response.json();
    return (body?.rooms ?? []) as Room[];
  }

  // ---------- messages (contact form) ----------

  async sendMessage(message: Partial<ContactMessage>): Promise<APIResponse> {
    return this.request.post('/api/message', { data: message });
  }

  async listMessages(token: string): Promise<MessageSummary[]> {
    const response = await this.request.get('/api/message', {
      headers: { Cookie: `token=${token}` },
    });
    if (!response.ok()) return [];
    const body = await response.json();
    return (body?.messages ?? []) as MessageSummary[];
  }

  async deleteMessage(token: string, id: number): Promise<APIResponse> {
    return this.request.delete(`/api/message/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
  }
}
