// All paths use Vite dev proxy → backend port 8084
export const apiUrl = '';

// ── Types mirroring the Spring Boot DTOs ─────────────────────────────────────

export interface HealthStatus {
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface WorkerCard {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  workerType: string;
  trade: string;
  skills: string[];
  experienceYears: number;
  teamSize?: number;
  availability: string;
  district: string;
  city: string;
  state: string;
  verificationStatus: string;
}

export interface RequirementView {
  id: string;
  title: string;
  description: string;
  trade: string;
  skills: string[];
  workerCount: number;
  startsAt: string;
  endsAt: string;
  city: string;
  district: string;
  state: string;
  status: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Trade {
  id: string;
  code: string;
  name: string;
  skills: { id: string; name: string }[];
}

// ── Token store (in-memory; persisted to sessionStorage) ─────────────────────
const TOKEN_KEY = 'labourly_admin_token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${apiUrl}${path}`, { signal, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function post<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth calls ────────────────────────────────────────────────────────────────
export const requestOtp = (phone: string) =>
  post<void>('/api/v1/auth/otp/request', { phone });

export const verifyOtp = (phone: string, code: string) =>
  post<AuthTokens>('/api/v1/auth/otp/verify', { phone, code });

// ── Data calls ────────────────────────────────────────────────────────────────
export const fetchHealth = (signal?: AbortSignal) =>
  get<HealthStatus>('/actuator/health', signal);

export const fetchTrades = (signal?: AbortSignal) =>
  get<{ trades: Trade[] }>('/api/v1/onboarding/catalogue', signal).then(
    (d) => d.trades,
  );

export const fetchWorkers = (
  params: {
    page?: number;
    size?: number;
    cityId?: string;
    tradeId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  } = {},
  signal?: AbortSignal,
) => {
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  if (params.cityId) q.set('cityId', params.cityId);
  if (params.tradeId) q.set('tradeId', params.tradeId);
  if (params.lat !== undefined) q.set('lat', String(params.lat));
  if (params.lng !== undefined) q.set('lng', String(params.lng));
  if (params.radiusKm !== undefined) q.set('radiusKm', String(params.radiusKm));
  return get<Paginated<WorkerCard>>(
    `/api/v1/marketplace/workers?${q.toString()}`,
    signal,
  );
};

export const fetchOpportunities = (
  params: { page?: number; size?: number } = {},
  signal?: AbortSignal,
) => {
  const q = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 50),
  });
  return get<Paginated<RequirementView>>(
    `/api/v1/marketplace/opportunities?${q.toString()}`,
    signal,
  );
};
