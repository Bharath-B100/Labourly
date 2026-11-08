import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action, Input, Screen } from '../components/ui';
type Request = {
  id: string;
  kind: string;
  status: string;
  details: string;
  resolution: string | null;
};
export default function SupportRequests() {
  const account = useSession((s) => s.session?.userId);
  return account ? (
    <SupportForm key={account} account={account} />
  ) : (
    <Screen>
      <Text>Sign in to manage your requests.</Text>
    </Screen>
  );
}
function SupportForm({ account }: { account: string }) {
  const cache = useQueryClient();
  const [kind, setKind] = useState<'SUPPORT' | 'ACCOUNT_DELETION'>('SUPPORT');
  const [details, setDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const key = ['support-requests', account];
  const requests = useQuery({
    queryKey: key,
    enabled: !!account,
    queryFn: () => apiJson<Request[]>('/api/v1/support/requests'),
  });
  const submit = useMutation({
    mutationFn: () =>
      apiJson<Request>('/api/v1/support/requests', {
        method: 'POST',
        body: JSON.stringify({ kind, details }),
      }),
    onSuccess: async () => {
      if (useSession.getState().session?.userId !== account) return;
      setNotice(
        kind === 'ACCOUNT_DELETION'
          ? 'Deletion request received. Your account has not been deleted. Support must review retention and complete the request.'
          : 'Support request received. Track its status below.',
      );
      setDetails('');
      setConfirmed(false);
      await cache.invalidateQueries({ queryKey: key });
    },
    onError: () => {
      if (useSession.getState().session?.userId !== account) return;
      setNotice(
        'Could not confirm submission. Your details are preserved. Retry safely; an existing open request will be returned.',
      );
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  if (!account)
    return (
      <Screen>
        <Text>Sign in to manage your requests.</Text>
      </Screen>
    );
  return (
    <Screen>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 24, fontWeight: '700' }}
      >
        Support & account requests
      </Text>
      <Text>
        For help, contact labourly.work@gmail.com. Do not include passwords,
        verification codes or payment-card details.
      </Text>
      <Action
        label="Booking or account help"
        onPress={() => {
          setKind('SUPPORT');
          setConfirmed(false);
          setNotice('');
        }}
        disabled={submit.isPending}
      />
      <Action
        label="Request account deletion"
        onPress={() => {
          setKind('ACCOUNT_DELETION');
          setConfirmed(false);
          setNotice('');
        }}
        disabled={submit.isPending}
      />
      <Text>
        {kind === 'ACCOUNT_DELETION'
          ? 'Request deletion of your account and associated personal data. This submits a request, not an immediate deletion. Booking, dispute and legally required records may need retention; support must explain what is retained and why.'
          : 'Tell us what happened and what help you need.'}
      </Text>
      <Input
        label="Request details"
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={2000}
        editable={!submit.isPending}
      />
      {kind === 'ACCOUNT_DELETION' && (
        <Action
          label={
            confirmed
              ? 'Deletion request confirmed'
              : 'Confirm I want to request deletion'
          }
          onPress={() => setConfirmed(!confirmed)}
          disabled={submit.isPending}
        />
      )}
      <Action
        label={submit.isPending ? 'Sending request…' : 'Submit request'}
        disabled={
          !details.trim() || (kind === 'ACCOUNT_DELETION' && !confirmed)
        }
        loading={submit.isPending}
        onPress={() => {
          if (pending.current) return;
          pending.current = true;
          setNotice('');
          submit.mutate();
        }}
      />
      {!!notice && <Text accessibilityRole="alert">{notice}</Text>}
      <Text
        accessibilityRole="header"
        style={{ fontSize: 20, fontWeight: '700' }}
      >
        Your requests
      </Text>
      {requests.isLoading && <Text>Loading requests…</Text>}
      {requests.isError && (
        <>
          <Text accessibilityRole="alert">Could not load requests.</Text>
          <Action
            label="Retry loading requests"
            onPress={() => void requests.refetch()}
          />
        </>
      )}
      {requests.data?.length === 0 && <Text>No requests yet.</Text>}
      {requests.data?.map((r) => (
        <View
          key={r.id}
          style={{
            padding: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            gap: 8,
          }}
        >
          <Text>
            {r.kind === 'ACCOUNT_DELETION' ? 'Account deletion' : 'Support'} —{' '}
            {r.status.replaceAll('_', ' ')}
          </Text>
          <Text selectable>Reference: {r.id}</Text>
          <Text>{r.details}</Text>
          {r.resolution && <Text>Support response: {r.resolution}</Text>}
        </View>
      ))}
    </Screen>
  );
}
