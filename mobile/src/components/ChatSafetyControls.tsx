import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action, Input } from './ui';
type Safety = { blockedByMe: boolean; messagingBlocked: boolean };
export function ChatSafetyControls({ threadId }: { threadId: string }) {
  const account = useSession((s) => s.session?.userId);
  return (
    <Controls
      key={`${account}:${threadId}`}
      account={account}
      threadId={threadId}
    />
  );
}
function Controls({
  account,
  threadId,
}: {
  account?: string;
  threadId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const cache = useQueryClient();
  const pending = useRef(false);
  const key = ['chat-safety', account, threadId];
  const state = useQuery({
    queryKey: key,
    enabled: open && !!account,
    queryFn: () => apiJson<Safety>(`/api/v1/chat/threads/${threadId}/safety`),
  });
  const action = useMutation({
    mutationFn: async (kind: 'block' | 'report') => {
      if (kind === 'block')
        return apiJson(`/api/v1/chat/threads/${threadId}/block`, {
          method: 'PUT',
          body: JSON.stringify({ blocked: !state.data?.blockedByMe }),
        });
      return apiJson(`/api/v1/chat/threads/${threadId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: async (_, kind) => {
      if (useSession.getState().session?.userId !== account) return;
      setNotice(
        kind === 'report'
          ? 'Report received by support. Track it in Profile → Support requests.'
          : 'Conversation preference saved.',
      );
      if (kind === 'report') setReason('');
      await cache.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      if (useSession.getState().session?.userId === account)
        setNotice(`Could not confirm the action. ${error.message}`);
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  const run = (kind: 'block' | 'report') => {
    if (pending.current) return;
    pending.current = true;
    setNotice('');
    action.mutate(kind);
  };
  return (
    <View style={{ padding: 12, gap: 8 }}>
      <Action
        label={open ? 'Close conversation safety' : 'Conversation safety'}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Text>
            Blocking stops new messages from both participants in this
            conversation. Your booking and existing messages remain. For booking
            issues, contact support.
          </Text>
          {state.isLoading && <Text>Loading safety settings…</Text>}
          {state.isError && (
            <>
              <Text>Cannot load safety settings.</Text>
              <Action
                label="Retry safety settings"
                onPress={() => void state.refetch()}
              />
            </>
          )}
          {state.data && (
            <>
              <Text>
                {state.data.messagingBlocked
                  ? 'Messaging is blocked in this conversation.'
                  : 'Messaging is allowed.'}
              </Text>
              <Action
                label={
                  state.data.blockedByMe
                    ? 'Unblock this conversation'
                    : 'Block this conversation'
                }
                disabled={action.isPending}
                onPress={() => run('block')}
              />
            </>
          )}
          <Input
            label="Report reason"
            value={reason}
            onChangeText={setReason}
            maxLength={1500}
            multiline
            editable={!action.isPending}
          />
          <Action
            label="Send report to support"
            disabled={!reason.trim() || action.isPending}
            onPress={() => run('report')}
          />
          {!!notice && <Text accessibilityRole="alert">{notice}</Text>}
        </>
      )}
    </View>
  );
}
