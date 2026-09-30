import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action, Loading, Screen } from '../components/ui';
import {
  hydrateProfile,
  validateStep,
  type Catalogue,
  type Draft,
  type ProfileData,
  type ProfileRole,
} from './profile';

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-12 rounded-lg border p-3 ${selected ? 'border-teal-800 bg-teal-50' : 'border-slate-300 bg-white'}`}
    >
      <Text>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  onChange,
  numeric = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  maxLength?: number;
}) {
  return (
    <View className="gap-2">
      <Text>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'number-pad' : 'default'}
        maxLength={maxLength}
        autoCapitalize={numeric ? 'none' : 'sentences'}
        className="rounded-lg border border-slate-300 bg-white p-3 text-base"
      />
    </View>
  );
}
export default function ProfileEditor({
  editing = false,
}: {
  editing?: boolean;
}) {
  const session = useSession((state) => state.session);
  const query = useQuery({
    queryKey: ['onboarding', session?.userId, editing],
    queryFn: async () => ({
      draft: await apiJson<Draft>('/api/v1/onboarding'),
      catalogue: await apiJson<Catalogue>('/api/v1/onboarding/catalogue'),
    }),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  if (query.isPending || query.isFetching)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <Text accessibilityRole="alert">
          Unable to load your saved profile. {query.error.message}
        </Text>
        <Action
          label="Try again"
          onPress={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  return (
    <ProfileForm
      key={`${session?.userId}:${editing}`}
      editing={editing}
      initial={query.data.draft}
      catalogue={query.data.catalogue}
    />
  );
}
function ProfileForm({
  editing,
  initial,
  catalogue,
}: {
  editing: boolean;
  initial: Draft;
  catalogue: Catalogue;
}) {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const [data, setData] = useState<ProfileData>(() =>
    hydrateProfile(initial.data),
  );
  const [step, setStep] = useState(editing ? 0 : initial.step);
  const role = initial.role;
  const [notice, setNotice] = useState<string | null>(null);
  function field<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setNotice(null);
    setData((old) => ({ ...old, [key]: value }));
  }
  const selection = useMutation({
    mutationFn: (selected: ProfileRole) =>
      apiJson('/api/v1/users/me/roles', {
        method: 'POST',
        body: JSON.stringify({ role: selected }),
      }),
    onSuccess: async () => {
      await useSession.getState().loadSession();
    },
  });
  const save = useMutation({
    mutationFn: async ({
      next,
      finish = false,
    }: {
      next: number;
      finish?: boolean;
    }) => {
      if (!role) throw new Error('Select a role.');
      const validation = validateStep(data, role, next);
      if (validation) throw new Error(validation);
      if (finish && editing)
        await apiJson(`/api/v1/profile/${role.toLowerCase()}`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      else {
        await apiJson<Draft>('/api/v1/onboarding', {
          method: 'PUT',
          body: JSON.stringify({ step: next, data }),
        });
        if (finish)
          await apiJson('/api/v1/onboarding/complete', { method: 'POST' });
      }
      return { next, finish };
    },
    onSuccess: async ({ next, finish }) => {
      setStep(next);
      setNotice('Progress saved.');
      if (finish) {
        await useSession.getState().loadSession();
        router.replace('/');
      }
    },
  });
  if (!role)
    return (
      <Screen>
        <Text accessibilityRole="header" className="text-3xl font-bold">
          What brings you here?
        </Text>
        <Text>Verified phone: {session?.phone}</Text>
        <Action
          label="I need workers"
          disabled={selection.isPending}
          onPress={() => selection.mutate('CUSTOMER')}
        />
        <Action
          label="I am a worker"
          disabled={selection.isPending}
          onPress={() => selection.mutate('WORKER')}
        />
        {selection.isError && (
          <Text accessibilityRole="alert">{selection.error.message}</Text>
        )}
      </Screen>
    );
  const last = role === 'CUSTOMER' ? 2 : 3;
  const trade = catalogue.trades.find((item) => item.id === data.tradeId);
  const locationStep = role === 'CUSTOMER' ? 1 : 2;
  const titles =
    role === 'CUSTOMER'
      ? ['Your details', 'Your location', 'Review your profile']
      : [
          'About you',
          'Your trade and skills',
          'Location and availability',
          'Review your profile',
        ];
  return (
    <Screen>
      <Text accessibilityRole="header" className="text-2xl font-bold">
        {editing ? 'Edit profile' : titles[step]}
      </Text>
      <Text>
        Step {step + 1} of {last + 1} · Verified phone: {session?.phone}
      </Text>
      {step === 0 && (
        <View className="gap-4">
          <Field
            label="Full name"
            value={data.fullName}
            onChange={(v) => field('fullName', v)}
            maxLength={120}
          />
          {role === 'CUSTOMER' ? (
            <>
              <Text>Customer type</Text>
              {catalogue.customerTypes.map((type) => (
                <Choice
                  key={type.code}
                  label={type.name}
                  selected={data.customerType === type.code}
                  onPress={() => field('customerType', type.code)}
                />
              ))}
              <Field
                label="Company or business name (optional)"
                value={data.companyName}
                onChange={(v) => field('companyName', v)}
                maxLength={180}
              />
            </>
          ) : (
            <>
              <Text>Worker type</Text>
              <Choice
                label="Individual"
                selected={data.workerType === 'INDIVIDUAL'}
                onPress={() => {
                  field('workerType', 'INDIVIDUAL');
                  field('teamName', '');
                  field('teamSize', null);
                }}
              />
              <Choice
                label="Team"
                selected={data.workerType === 'TEAM'}
                onPress={() => field('workerType', 'TEAM')}
              />
              {data.workerType === 'TEAM' && (
                <>
                  <Field
                    label="Team name"
                    value={data.teamName}
                    onChange={(v) => field('teamName', v)}
                    maxLength={120}
                  />
                  <Field
                    label="Team size"
                    numeric
                    value={data.teamSize?.toString() ?? ''}
                    onChange={(v) => field('teamSize', v ? Number(v) : null)}
                    maxLength={4}
                  />
                </>
              )}
              <Field
                label="Profile photo HTTPS link (optional)"
                value={data.profilePhotoUrl}
                onChange={(v) => field('profilePhotoUrl', v)}
                maxLength={2048}
              />
            </>
          )}
        </View>
      )}
      {role === 'WORKER' && step === 1 && (
        <View className="gap-4">
          <Text>Primary trade</Text>
          {catalogue.trades.map((item) => (
            <Choice
              key={item.id}
              label={item.name}
              selected={data.tradeId === item.id}
              onPress={() => {
                field('tradeId', item.id);
                field('skillIds', []);
              }}
            />
          ))}
          <Text>Skills and sub-skills</Text>
          {trade?.skills.map((skill) => (
            <Choice
              key={skill.id}
              label={skill.name}
              selected={data.skillIds.includes(skill.id)}
              onPress={() =>
                field(
                  'skillIds',
                  data.skillIds.includes(skill.id)
                    ? data.skillIds.filter((id) => id !== skill.id)
                    : [...data.skillIds, skill.id],
                )
              }
            />
          ))}
          <Field
            label="Years of experience"
            numeric
            value={data.experienceYears?.toString() ?? ''}
            onChange={(v) => field('experienceYears', v ? Number(v) : null)}
            maxLength={2}
          />
        </View>
      )}
      {step === locationStep && (
        <View className="gap-4">
          <Field
            label="State code (for example KA)"
            value={data.state}
            onChange={(v) => field('state', v.toUpperCase())}
            maxLength={8}
          />
          <Field
            label="District"
            value={data.district}
            onChange={(v) => field('district', v)}
            maxLength={100}
          />
          <Field
            label="City"
            value={data.city}
            onChange={(v) => field('city', v)}
            maxLength={100}
          />
          <Field
            label="Postal code"
            numeric
            value={data.postalCode}
            onChange={(v) => field('postalCode', v)}
            maxLength={6}
          />
          {role === 'WORKER' && (
            <>
              <Text>Availability</Text>
              {(['AVAILABLE', 'BUSY', 'UNAVAILABLE'] as const).map((item) => (
                <Choice
                  key={item}
                  label={
                    item === 'AVAILABLE'
                      ? 'Available'
                      : item === 'BUSY'
                        ? 'Busy'
                        : 'Unavailable'
                  }
                  selected={data.availability === item}
                  onPress={() => field('availability', item)}
                />
              ))}
            </>
          )}
        </View>
      )}
      {step === last && (
        <View className="gap-3">
          <Text className="text-xl font-bold">{data.fullName}</Text>
          <Text>{session?.phone}</Text>
          <Text>
            {role === 'CUSTOMER'
              ? catalogue.customerTypes.find(
                  (item) => item.code === data.customerType,
                )?.name
              : data.workerType}
          </Text>
          {role === 'CUSTOMER' && !!data.companyName && (
            <Text>{data.companyName}</Text>
          )}
          {role === 'WORKER' && (
            <>
              <Text>
                {trade?.name} · {data.experienceYears} years
              </Text>
              <Text>
                {trade?.skills
                  .filter((s) => data.skillIds.includes(s.id))
                  .map((s) => s.name)
                  .join(', ')}
              </Text>
              <Text>{data.availability}</Text>
              {data.workerType === 'TEAM' && (
                <Text>
                  {data.teamName} · {data.teamSize} people
                </Text>
              )}
              {!!data.profilePhotoUrl && (
                <Image
                  accessibilityLabel="Profile photo preview"
                  source={{ uri: data.profilePhotoUrl }}
                  style={{ width: 96, height: 96 }}
                />
              )}
            </>
          )}
          <Text>
            {data.city}, {data.district}, {data.state} {data.postalCode}
          </Text>
          <Text>Review these details before completing your profile.</Text>
        </View>
      )}
      {save.isError && (
        <Text accessibilityRole="alert">{save.error.message}</Text>
      )}
      {notice && <Text accessibilityLiveRegion="polite">{notice}</Text>}
      {step > 0 && (
        <Action
          label="Back"
          disabled={save.isPending}
          onPress={() => {
            setStep((old) => old - 1);
            setNotice(null);
          }}
        />
      )}
      <Action
        label={
          save.isPending
            ? 'Saving…'
            : step === last
              ? editing
                ? 'Save profile'
                : 'Complete profile'
              : 'Save and continue'
        }
        disabled={save.isPending}
        onPress={() =>
          save.mutate({ next: Math.min(last, step + 1), finish: step === last })
        }
      />
      {step < last && (
        <Action
          label="Save progress"
          disabled={save.isPending}
          onPress={() => save.mutate({ next: step })}
        />
      )}
      <Action
        label="Sign out"
        disabled={save.isPending}
        onPress={() => {
          void useSession
            .getState()
            .logout()
            .then(() => router.replace('/'))
            .catch(() =>
              setNotice(
                'Signed out on this device. Server revocation could not be confirmed.',
              ),
            );
        }}
      />
    </Screen>
  );
}
