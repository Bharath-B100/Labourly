import { z } from 'zod';

const environment = z.object({ apiUrl: z.url() }).parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080',
});
export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`Request failed (${status}). Please try again.`);
  }
}
export async function getHealth(
  signal?: AbortSignal,
): Promise<{ status: string }> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 10_000);
  try {
    const response = await fetch(`${environment.apiUrl}/actuator/health`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(response.status);
    return z.object({ status: z.string() }).parse(await response.json());
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
