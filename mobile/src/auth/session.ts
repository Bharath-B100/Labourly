import { create } from 'zustand';
import { z } from 'zod';
import { apiJson, publicJson } from '../api/client';
import {
  onCredentialsCleared,
  readCredentials,
  storeCredentials,
  type Credentials,
} from './credentials';
export type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN';
const userSchema = z.object({
  id: z.string(),
  phone: z.string(),
  fullName: z.string().nullable(),
  roles: z.array(z.enum(['CUSTOMER', 'WORKER', 'ADMIN'])),
  onboardingState: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  onboardingStep: z.string().nullable(),
});
export type Session = {
  userId: string;
  phone: string;
  fullName: string | null;
  roles: Role[];
  onboardingState: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  onboardingStep: string | null;
};
interface SessionState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  loadSession: () => Promise<void>;
  signIn: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}
let restoration = 0;
async function identity(): Promise<Session> {
  const user = userSchema.parse(await apiJson<unknown>('/api/v1/users/me'));
  return { ...user, userId: user.id };
}
export const useSession = create<SessionState>((set, get) => ({
  session: null,
  isLoading: true,
  error: null,
  loadSession: async () => {
    const version = ++restoration;
    set({ isLoading: true, error: null });
    try {
      const credentials = await readCredentials();
      const session = credentials ? await identity() : null;
      if (version === restoration) set({ session, isLoading: false });
    } catch {
      if (version === restoration)
        set({
          session: null,
          isLoading: false,
          error:
            'Unable to restore your session. Check your connection and try again.',
        });
    }
  },
  signIn: async (credentials) => {
    await storeCredentials(credentials);
    await get().loadSession();
  },
  logout: async () => {
    const credentials = await readCredentials().catch(() => null);
    ++restoration;
    try {
      if (credentials)
        await publicJson('/api/v1/auth/logout', {
          refreshToken: credentials.refreshToken,
        });
    } finally {
      await storeCredentials(null);
      set({ session: null, isLoading: false, error: null });
    }
  },
}));
onCredentialsCleared(() => {
  ++restoration;
  useSession.setState({ session: null, isLoading: false, error: null });
});
export function hasRole(session: Session | null, role: Role) {
  return session?.roles.includes(role) ?? false;
}
export function homeRoute(
  session: Session | null,
):
  | '/'
  | '/auth/onboarding'
  | '/(customer)/discover'
  | '/(worker)/opportunities' {
  if (!session) return '/';
  if (session.onboardingState !== 'COMPLETED') return '/auth/onboarding';
  if (hasRole(session, 'CUSTOMER')) return '/(customer)/discover';
  if (hasRole(session, 'WORKER')) return '/(worker)/opportunities';
  return '/';
}
