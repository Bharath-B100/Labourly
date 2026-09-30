import { z } from 'zod';
export const environment = z
  .object({ apiUrl: z.url() })
  .parse({ apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080' });
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
): Promise<Response> {
  if (!endpoint.startsWith('/') || endpoint.startsWith('//'))
    throw new Error('Invalid API endpoint');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10_000);
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
