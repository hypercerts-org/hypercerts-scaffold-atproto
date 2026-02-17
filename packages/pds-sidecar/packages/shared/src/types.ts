export interface Account {
  id: number;
  email: string;
  did: string | null;
  handle: string | null;
  created_at: string;
}

export interface OTPToken {
  id: number;
  email: string;
  token_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  used: number;
  created_at: string;
}

export interface RateLimitEntry {
  id: number;
  key: string;
  action: string;
  count: number;
  window_start: string;
}
