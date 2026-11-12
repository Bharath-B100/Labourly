import { requireOptionalNativeModule } from 'expo';
import { publicJson } from '../api/client';
import { credentialsSchema } from './credentials';

const CLIENT_ID =
  '208033395266-ejqs8vqco559j25r4bugo2kj6co45bvl.apps.googleusercontent.com';
// The free Render instance may sleep; allow enough time for its first login
// challenge to start the service and connect to its database.
const LOGIN_REQUEST_TIMEOUT_MS = 90_000;
type GoogleBridge = {
  signIn(
    clientId: string,
    nonce: string,
  ): Promise<{ cancelled: boolean; idToken?: string }>;
  clearSession(): Promise<void>;
};
function bridge() {
  return requireOptionalNativeModule<GoogleBridge>('LabourlyGoogle');
}
let pending = false;
export async function googleCredentials() {
  const native = bridge();
  if (!native)
    throw new Error(
      'Google sign-in needs the updated Android app. Install the latest Labourly build.',
    );
  if (pending) throw new Error('Sign-in is already in progress.');
  pending = true;
  try {
    const challenge = await publicJson<{ challenge: string; nonce: string }>(
      '/api/v1/auth/google/challenge',
      {},
      LOGIN_REQUEST_TIMEOUT_MS,
    );
    const result = await native.signIn(CLIENT_ID, challenge.nonce);
    if (result.cancelled) return null;
    if (!result.idToken)
      throw new Error('Google did not return a sign-in token. Please retry.');
    return credentialsSchema.parse(
      await publicJson(
        '/api/v1/auth/google',
        {
          idToken: result.idToken,
          challenge: challenge.challenge,
        },
        LOGIN_REQUEST_TIMEOUT_MS,
      ),
    );
  } finally {
    pending = false;
  }
}
export async function clearGoogleSession() {
  await bridge()?.clearSession();
}
