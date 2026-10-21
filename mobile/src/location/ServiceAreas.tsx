import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action, Input, Select } from '../components/ui';
import {
  CanonicalPlacePicker,
  locationCatalogue as data,
} from './CanonicalPlacePicker';

type Coverage = {
  configured: boolean;
  nationwide: boolean;
  stateIds: string[];
  districtIds: string[];
  baseCityId: string | null;
  radiusKm: number | null;
};
const endpoint = '/api/v1/workers/me/service-coverage';
export default function ServiceAreas({ home }: { home: string }) {
  const client = useQueryClient();
  const userId = useSession((state) => state.session?.userId);
  const query = useQuery({
    queryKey: ['my-service-coverage', userId],
    queryFn: () => apiJson<Coverage>(endpoint),
  });
  return (
    <View className="gap-4 rounded-2xl border border-outline bg-surface p-4">
      <Text className="text-xl font-bold text-accent">Service Areas</Text>
      <Text className="text-ink">Home: {home || 'Not recorded'}</Text>
      <Text className="text-ink">
        Choose where you accept jobs. Your home address stays unchanged.
      </Text>
      {query.isPending ? (
        <Text className="text-ink">Loading service areas…</Text>
      ) : query.isError ? (
        <>
          <Text className="text-ink" accessibilityRole="alert">
            Could not load service areas. Your saved coverage has not changed.
          </Text>
          <Action
            label="Retry service areas"
            onPress={() => {
              void query.refetch();
            }}
          />
        </>
      ) : (
        <CoverageForm
          key={userId}
          initial={query.data}
          onSaved={(saved) =>
            client.setQueryData(['my-service-coverage', userId], saved)
          }
        />
      )}
    </View>
  );
}
function CoverageForm({
  initial,
  onSaved,
}: {
  initial: Coverage;
  onSaved: (value: Coverage) => void;
}) {
  const [value, setValue] = useState(initial);
  const [browseState, setBrowseState] = useState('');
  const [radius, setRadius] = useState(
    initial.radiusKm ? String(initial.radiusKm) : '15',
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    setNotice('');
    if (
      value.baseCityId &&
      (!Number.isFinite(Number(radius)) ||
        Number(radius) <= 0 ||
        Number(radius) > 500)
    ) {
      setError('Radius must be greater than zero and at most 500 km.');
      return;
    }
    setBusy(true);
    try {
      const saved = await apiJson<Coverage>(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          nationwide: value.nationwide,
          stateIds: value.stateIds,
          districtIds: value.districtIds,
          baseCityId: value.baseCityId,
          radiusKm: value.baseCityId ? Number(radius) : null,
        }),
      });
      setValue(saved);
      setNotice('Service areas saved.');
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View className="gap-4">
      {!value.configured && (
        <Text className="text-ink">
          No new service areas configured. Existing radius coverage remains
          until you save.
        </Text>
      )}
      <Text className="text-ink font-bold">Local radius</Text>
      <CanonicalPlacePicker
        disabled={busy}
        value={value.baseCityId ?? ''}
        onChange={(c) => setValue({ ...value, baseCityId: c?.id ?? null })}
      />
      {value.baseCityId && (
        <>
          <Input
            label="Radius in kilometres"
            value={radius}
            onChangeText={setRadius}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Action
            label="Remove local radius"
            variant="quiet"
            disabled={busy}
            onPress={() => setValue({ ...value, baseCityId: null })}
          />
        </>
      )}
      <Select
        label="Add an entire state"
        searchable
        disabled={busy}
        value=""
        options={data.states
          .filter((s) => !value.stateIds.includes(s.id))
          .map((s) => ({ value: s.id, label: s.name }))}
        onChange={(id) =>
          setValue({ ...value, stateIds: [...value.stateIds, id] })
        }
      />
      {value.stateIds.map((id) => (
        <Action
          key={id}
          disabled={busy}
          variant="secondary"
          label={`Remove state: ${data.states.find((s) => s.id === id)?.name ?? id}`}
          onPress={() =>
            setValue({
              ...value,
              stateIds: value.stateIds.filter((x) => x !== id),
            })
          }
        />
      ))}
      <Select
        label="Browse districts in state"
        searchable
        disabled={busy}
        value={browseState}
        options={data.states.map((s) => ({ value: s.id, label: s.name }))}
        onChange={setBrowseState}
      />
      <Select
        label="Add a district"
        searchable
        disabled={busy || !browseState}
        value=""
        options={data.districts
          .filter(
            (d) =>
              d.stateId === browseState && !value.districtIds.includes(d.id),
          )
          .map((d) => ({ value: d.id, label: d.name }))}
        onChange={(id) =>
          setValue({ ...value, districtIds: [...value.districtIds, id] })
        }
      />
      {value.districtIds.map((id) => (
        <Action
          key={id}
          disabled={busy}
          variant="secondary"
          label={`Remove district: ${data.districts.find((d) => d.id === id)?.name ?? id}`}
          onPress={() =>
            setValue({
              ...value,
              districtIds: value.districtIds.filter((x) => x !== id),
            })
          }
        />
      ))}
      <Action
        label={
          value.nationwide
            ? 'Nationwide enabled — turn off'
            : 'Enable jobs anywhere in India'
        }
        variant="secondary"
        disabled={busy}
        onPress={() => setValue({ ...value, nationwide: !value.nationwide })}
      />
      <Text className="text-ink">
        {value.nationwide
          ? 'Nationwide service is selected. Save to apply.'
          : `${value.stateIds.length} states and ${value.districtIds.length} districts selected${value.baseCityId ? ', plus a local radius' : ''}.`}
      </Text>
      {!value.nationwide &&
        !value.baseCityId &&
        !value.stateIds.length &&
        !value.districtIds.length && (
          <Text className="text-ink">
            Saving with no areas selected disables geographic eligibility until
            you configure coverage.
          </Text>
        )}
      {!!error && (
        <Text accessibilityRole="alert" className="text-ink">
          {error}
        </Text>
      )}
      {!!notice && (
        <Text className="text-ink" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      )}
      <Action
        label="Save service areas"
        loading={busy}
        onPress={() => {
          void save();
        }}
      />
    </View>
  );
}
