import { useState, useRef } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '../auth/session';
import { normalizePhone } from '../auth/validation';
import { apiJson } from '../api/client';
import { Action, Input } from '../components/ui';

export function ContactPhoneField() {
  const account = useSession((state) => state.session);
  const [phone, setPhone] = useState(account?.contactPhone ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  return (
    <View style={{ gap: 8 }}>
      <Input
        label="Contact number (unverified)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!busy}
        hint="Optional contact detail. This does not verify your number or change your sign-in account."
      />
      <Action
        label={busy ? 'Saving contact…' : 'Save contact number'}
        loading={busy}
        onPress={async () => {
          if (pending.current || !account) return;
          pending.current = true;
          setBusy(true);
          setNotice('');
          try {
            const normalized = phone.trim() ? normalizePhone(phone) : null;
            await apiJson('/api/v1/users/me/contact', {
              method: 'PUT',
              body: JSON.stringify({ phone: normalized }),
            });
            if (useSession.getState().session?.userId !== account.userId)
              return;
            useSession.setState((state) => ({
              session: state.session
                ? { ...state.session, contactPhone: normalized }
                : null,
            }));
            setPhone(normalized ?? '');
            setNotice('Contact saved. This number remains unverified.');
          } catch {
            if (useSession.getState().session?.userId === account?.userId)
              setNotice(
                'Could not save the contact number. Check the number and connection, then retry.',
              );
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
      />
      {!!notice && <Text accessibilityRole="alert">{notice}</Text>}
    </View>
  );
}
