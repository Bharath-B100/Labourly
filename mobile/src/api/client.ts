import { z } from 'zod';
import {
  credentialsSchema,
  credentialEpoch,
  readCredentials,
  storeCredentials,
  type Credentials,
} from '../auth/credentials';
import { ApiError, request, responseJson } from './http';
export { environment, ApiError } from './http';
let flight: { refreshToken: string; promise: Promise<Credentials> } | null =
  null;
async function refresh(previous: Credentials): Promise<Credentials> {
  if (flight?.refreshToken === previous.refreshToken) return flight.promise;
  const promise = (async () => {
    try {
      const response = await request('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: previous.refreshToken }),
      });
      const next = credentialsSchema.parse(
        await responseJson<unknown>(response),
      );
      if (!(await storeCredentials(next, previous.refreshToken)))
        throw new ApiError(401, 'Session changed. Please sign in again.');
      return next;
    } catch (error) {
      // Only an authoritative credential rejection ends the session. Network,
      // throttling and server failures must remain retryable without signing out.
      if (error instanceof ApiError && [400, 401, 403].includes(error.status))
        await storeCredentials(null, previous.refreshToken);
      throw error;
    }
  })();
  flight = { refreshToken: previous.refreshToken, promise };
  try {
    return await promise;
  } finally {
    if (flight?.promise === promise) flight = null;
  }
}
function authorized(options: RequestInit, token?: string): RequestInit {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...options, headers };
}
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const epoch = credentialEpoch();
  const previous = await readCredentials();
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  const response = await request(
    endpoint,
    authorized(options, previous?.accessToken),
  );
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  if (
    response.status !== 401 ||
    !previous ||
    endpoint.startsWith('/api/v1/auth/')
  )
    return response;
  // A delayed 401 for the old token must reuse an already-completed rotation.
  const current = await readCredentials();
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  if (!current) return response;
  const next =
    current.refreshToken !== previous.refreshToken
      ? current
      : await refresh(current);
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  const retried = await request(
    endpoint,
    authorized(options, next.accessToken),
  );
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  if (retried.status === 401) await storeCredentials(null, next.refreshToken);
  return retried; // Exactly one retry; this does not call apiFetch recursively.
}
export async function apiJson<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const epoch = credentialEpoch();
  const data = await responseJson<T>(await apiFetch(endpoint, options));
  if (epoch !== credentialEpoch()) throw new ApiError(401, 'Session changed.');
  return data;
}
export async function publicJson<T>(
  endpoint: string,
  body: unknown,
  timeoutMs?: number,
): Promise<T> {
  return responseJson<T>(
    await request(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      timeoutMs,
    ),
  );
}
export async function getHealth(
  signal?: AbortSignal,
): Promise<{ status: string }> {
  return z
    .object({ status: z.string() })
    .parse(
      await responseJson<unknown>(
        await request('/actuator/health', { signal }),
      ),
    );
}
