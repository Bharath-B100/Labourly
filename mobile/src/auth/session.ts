import { create } from 'zustand';

export type Role = 'CUSTOMER' | 'WORKER';
export type Session = { userId: string; roles: Role[] };
// No login shortcut or persisted token. A verified identity flow is a later phase.
export const useSession = create<{ session: Session | null }>(() => ({
  session: null,
}));
export function hasRole(session: Session | null, role: Role): boolean {
  return session?.roles.includes(role) ?? false;
}
