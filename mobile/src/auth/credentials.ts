import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

export const credentialsSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type Credentials = z.infer<typeof credentialsSchema>;
const KEY = 'nammacrew.credentials';
const listeners = new Set<() => void>();
let writes: Promise<unknown> = Promise.resolve();
let epoch = 0;
export function credentialEpoch() {
  return epoch;
}
async function readStored(): Promise<Credentials | null> {
  const value = await SecureStore.getItemAsync(KEY);
  if (!value) return null;
  return credentialsSchema.parse(JSON.parse(value));
}
export async function readCredentials() {
  await writes;
  return readStored();
}
export function onCredentialsCleared(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
// One encrypted record avoids storing an access token from one rotation with another refresh token.
export function storeCredentials(
  value: Credentials | null,
  expectedRefresh?: string,
): Promise<boolean> {
  if (!expectedRefresh) epoch++;
  const operation = writes.then(async () => {
    if (
      expectedRefresh &&
      (await readStored())?.refreshToken !== expectedRefresh
    )
      return false;
    if (value)
      await SecureStore.setItemAsync(
        KEY,
        JSON.stringify(credentialsSchema.parse(value)),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
      );
    else {
      if (expectedRefresh) epoch++;
      await SecureStore.deleteItemAsync(KEY);
      // Retire the old implementation's separate SecureStore keys as well.
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      listeners.forEach((listener) => listener());
    }
    return true;
  });
  writes = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
