import { create } from 'zustand';

interface LoginTransitionState {
  isActive: boolean;
  isReadyToSettle: boolean;
  statusText: string;
  startTransition: () => void;
  markReadyToSettle: (statusText?: string) => void;
  finishTransition: () => void;
  cancelTransition: () => void;
}

export const useLoginTransition = create<LoginTransitionState>((set) => ({
  isActive: false,
  isReadyToSettle: false,
  statusText: 'Verifying code & preparing your workspace...',
  startTransition: () =>
    set({
      isActive: true,
      isReadyToSettle: false,
      statusText: 'Verifying code & preparing your workspace...',
    }),
  markReadyToSettle: (statusText = 'Loading your dashboard...') =>
    set({ isReadyToSettle: true, statusText }),
  finishTransition: () => set({ isActive: false, isReadyToSettle: false }),
  cancelTransition: () => set({ isActive: false, isReadyToSettle: false }),
}));
