import { z } from 'zod';
const defaultApiUrl = __DEV__
  ? 'http://10.0.2.2:8080'
  : 'https://labourly-api.onrender.com';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

if (!__DEV__ && !apiUrl.startsWith('https://')) {
  throw new Error('Production API must use HTTPS');
}

export const environment = z.object({ apiUrl: z.url() }).parse({ apiUrl });
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message = `Request failed (${status}). Please try again.`,
  ) {
    super(message);
  }
}
export async function request(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  if (!endpoint.startsWith('/') || endpoint.startsWith('//'))
    throw new Error('Invalid API endpoint');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    return await fetch(`${environment.apiUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
export async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new ApiError(
      response.status,
      problem?.detail ??
        `Request failed (${response.status}). Please try again.`,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
