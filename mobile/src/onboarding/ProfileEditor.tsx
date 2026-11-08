import { ContactPhoneField } from './ContactPhoneField';
import { CustomerCategories } from './CustomerCategories';
import { glassSurface, GlassRim } from '../components/theme';
import ServiceAreas from '../location/ServiceAreas';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiJson } from '../api/client';
import { useSession } from '../auth/session';
import { Action, Input, Loading, Screen, Select } from '../components/ui';
import { detectDeviceLocation } from '../location/deviceLocation';
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
  multiple = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  multiple?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      className={`min-h-12 rounded-xl border p-3 ${selected ? 'border-ink bg-sunshine' : 'border-outline bg-surface'}`}
    >
      <Text className="text-base text-ink">
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
    <Input
      label={label}
      value={value}
      onChangeText={onChange}
      keyboardType={numeric ? 'number-pad' : 'default'}
      maxLength={maxLength}
      autoCapitalize={numeric ? 'none' : 'sentences'}
    />
  );
}
export default function ProfileEditor({
  editing = false,
  requestedRole,
}: {
  editing?: boolean;
  requestedRole?: string;
}) {
  const session = useSession((state) => state.session);
  const roles =
    session?.roles.filter((role) => role === 'CUSTOMER' || role === 'WORKER') ??
    [];
  const editRole = requestedRole ?? (roles.length === 1 ? roles[0] : undefined);
  const query = useQuery({
    queryKey: ['onboarding', session?.userId, editing, editRole],
    queryFn: async () => ({
      draft: await (async () => {
        if (!editing) return apiJson<Draft>('/api/v1/onboarding');
        if (!editRole || !roles.includes(editRole as ProfileRole))
          throw new Error('Choose an authorized profile from its role tab.');
        return apiJson<Draft>(`/api/v1/profile/${editRole.toLowerCase()}`);
      })(),
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
        <Text accessibilityRole="alert" className="text-ink">
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
      key={`${session?.userId}:${editing}:${editRole}`}
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
    hydrateProfile({
      ...initial.data,
      fullName: initial.data.fullName || session?.fullName || '',
    }),
  );
  const initialDataStr = JSON.stringify(
    hydrateProfile({
      ...initial.data,
      fullName: initial.data.fullName || session?.fullName || '',
    }),
  );
  const isDirty = JSON.stringify(data) !== initialDataStr;
  const role = initial.role;
  const last = role === 'CUSTOMER' ? 2 : 3;
  const locationStep = role === 'CUSTOMER' ? 1 : 2;
  const [step, setStep] = useState(editing ? last : initial.step);
  const [notice, setNotice] = useState<string | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsInfoNote, setGpsInfoNote] = useState<string | null>(null);

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
      if (editing && !finish) return { next, finish };
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
      setNotice(
        editing && !finish
          ? 'Changes are saved only when you select Save profile.'
          : 'Progress saved.',
      );
      if (finish) {
        await useSession.getState().loadSession();
        if (!editing) {
          router.replace('/');
        }
      }
    },
  });
  if (!role)
    return (
      <Screen>
        <Text
          accessibilityRole="header"
          className="text-3xl font-bold text-ink"
        >
          Let&apos;s build your profile.
        </Text>
        <Text className="text-muted">
          {session?.phone
            ? `Verified phone: ${session.phone}`
            : 'Signed in securely. Choose how you want to use Labourly.'}
        </Text>
        <Action
          label="I'm here to hire talent"
          disabled={selection.isPending}
          onPress={() => selection.mutate('CUSTOMER')}
        />
        <Action
          label="I'm here to find work"
          disabled={selection.isPending}
          onPress={() => selection.mutate('WORKER')}
        />
        {selection.isError && (
          <Text accessibilityRole="alert" className="text-ink">
            {selection.error.message}
          </Text>
        )}
      </Screen>
    );
  const trade = catalogue.trades.find((item) => item.id === data.tradeId);
  const titles =
    role === 'CUSTOMER'
      ? ['Your details', 'Your location', 'Review your profile']
      : [
          'About you',
          'Your trade and skills',
          'Location and availability',
          'Review your profile',
        ];

  const uiTitles = editing
    ? titles
    : [session?.phone ? 'Phone verified' : 'Signed in', ...titles];
  const uiStep = editing ? step : step + 1;
  const uiLast = editing ? last : last + 1;
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text
          accessibilityRole="header"
          className="text-3xl font-bold text-ink"
        >
          {editing ? 'My profile' : titles[step]}
        </Text>
        <Text className="text-base text-muted">
          {editing
            ? 'Your details, all in one place.'
            : 'Let’s get your profile ready.'}
        </Text>
      </View>
      {editing && (
        <View
          style={{
            ...glassSurface,
            backgroundColor: '#FFCC25',
            borderRadius: 24,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FFCC25',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#202326', fontSize: 24, fontWeight: '700' }}>
              {(
                data.fullName.trim() ||
                session?.fullName ||
                (role === 'CUSTOMER' ? 'Customer' : 'Worker')
              )
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0))
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: '#202326', fontSize: 19, fontWeight: '700' }}>
              {data.fullName.trim() ||
                session?.fullName ||
                (role === 'CUSTOMER' ? 'Customer account' : 'Worker account')}
            </Text>
            <Text style={{ color: '#202326', fontSize: 14 }}>
              {session?.phone || session?.contactPhone}
            </Text>
            <Text style={{ color: '#202326', fontSize: 12 }}>
              {session?.phone ? 'Phone verified' : 'Signed in'} ·{' '}
              {role === 'CUSTOMER' ? 'Customer' : 'Worker'}
            </Text>
          </View>
        </View>
      )}
      <View
        style={{ gap: 10 }}
        accessibilityLabel={`Step ${uiStep + 1} of ${uiLast + 1}`}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            paddingHorizontal: 48,
            alignItems: 'center',
          }}
        >
          {uiTitles.map((title, index) => (
            <View
              key={title}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: index <= uiStep ? '#FFFFFF' : '#E5E7EB',
                  backgroundColor: index <= uiStep ? '#FFCC25' : '#FFFFFF',
                  boxShadow: index <= uiStep ? '0 0 7px #FFCC25' : 'none',
                }}
              />
              {index < uiTitles.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: index < uiStep ? '#FFCC25' : '#E5E7EB',
                  }}
                />
              )}
            </View>
          ))}
        </View>
        <Text className="text-sm text-muted text-center">
          {uiStep + 1} of {uiLast + 1} · {uiTitles[uiStep]}
        </Text>
      </View>
      <View
        style={{
          ...glassSurface,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          gap: 14,
        }}
      >
        <GlassRim />
        <View style={{ gap: 5 }}>
          <Text className="text-lg font-bold text-ink">
            {step === last
              ? editing
                ? 'Profile summary'
                : 'Review details'
              : step === 0
                ? 'Personal information'
                : step === locationStep
                  ? 'Address details'
                  : 'Skills & experience'}
          </Text>
          <Text className="text-sm leading-5 text-muted">
            {step === 0
              ? 'Help people know who they’re working with.'
              : step === last
                ? editing
                  ? 'Your information currently visible on your profile.'
                  : 'Check your information before saving.'
                : 'Keep your information accurate and up to date.'}
          </Text>
        </View>
        {step === 0 && (
          <View className="gap-4">
            <Field
              label="Full name"
              value={data.fullName}
              onChange={(v) => field('fullName', v)}
              maxLength={120}
            />
            <ContactPhoneField key={session?.userId} />
            {role === 'CUSTOMER' ? (
              <>
                <CustomerCategories
                  value={data.customerType}
                  options={catalogue.customerTypes}
                  onChange={(value) => field('customerType', value)}
                />
                <Field
                  label="Company or business name (optional)"
                  value={data.companyName}
                  onChange={(v) => field('companyName', v)}
                  maxLength={180}
                />
              </>
            ) : (
              <>
                <Text className="text-muted font-semibold text-sm">
                  Worker type
                </Text>
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
            <Select
              label="Primary trade"
              value={data.tradeId ?? ''}
              searchable
              options={catalogue.trades.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => {
                field('tradeId', value);
                field('skillIds', []);
              }}
            />
            <Text className="text-muted font-semibold text-sm">
              Skills and sub-skills
            </Text>
            {trade?.skills.map((skill) => (
              <Choice
                key={skill.id}
                multiple
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
            {/* Auto-detect Location Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Auto-detect location with GPS"
              disabled={locatingGps}
              onPress={async () => {
                setLocatingGps(true);
                setGpsInfoNote(null);
                try {
                  const res = await detectDeviceLocation();
                  if (res.granted && res.district) {
                    field('state', (res.stateCode || '').toUpperCase());
                    field('district', res.district);
                    field('city', res.district); // Standardize on parent district name for worker matching
                    if (res.postalCode) {
                      field('postalCode', res.postalCode);
                    }
                    if (res.exactVillageOrLocality) {
                      setGpsInfoNote(
                        `Detected village/area: "${res.exactVillageOrLocality}". Registered under District: "${res.district}" for worker matching.`,
                      );
                    } else {
                      setGpsInfoNote(
                        `Detected location: ${res.district}, ${res.stateName || res.stateCode}`,
                      );
                    }
                  } else if (res.error) {
                    setNotice(res.error);
                  }
                } catch (err: any) {
                  setNotice(
                    err?.message || 'Could not detect device location.',
                  );
                } finally {
                  setLocatingGps(false);
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: '#FFCC25',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name="navigate-circle-outline"
                size={20}
                color="#202326"
              />
              <Text
                style={{ color: '#202326', fontWeight: '700', fontSize: 14 }}
              >
                {locatingGps
                  ? 'Detecting GPS location…'
                  : '📍 Auto-detect location (GPS)'}
              </Text>
            </Pressable>

            {!!gpsInfoNote && (
              <View
                style={{
                  backgroundColor: '#FEF9C3',
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FDE047',
                }}
              >
                <Text
                  style={{ fontSize: 12, color: '#854D0E', fontWeight: '500' }}
                >
                  {gpsInfoNote}
                </Text>
              </View>
            )}

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
                <Text className="text-muted font-semibold text-sm">
                  Availability
                </Text>
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
            <Text className="text-xl font-bold text-ink">{data.fullName}</Text>
            <Text className="text-muted">
              {session?.phone || session?.contactPhone}
            </Text>
            <Text className="text-muted">
              {role === 'CUSTOMER'
                ? catalogue.customerTypes.find(
                    (item) => item.code === data.customerType,
                  )?.name
                : data.workerType}
            </Text>
            {role === 'CUSTOMER' && !!data.companyName && (
              <Text className="text-muted">{data.companyName}</Text>
            )}
            {role === 'WORKER' && (
              <>
                <Text className="text-muted">
                  {trade?.name} · {data.experienceYears} years
                </Text>
                <Text className="text-muted">
                  {trade?.skills
                    .filter((s) => data.skillIds.includes(s.id))
                    .map((s) => s.name)
                    .join(', ')}
                </Text>
                <Text className="text-muted">{data.availability}</Text>
                {data.workerType === 'TEAM' && (
                  <Text className="text-muted">
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
            <Text className="text-muted">
              {data.city}, {data.district}, {data.state} {data.postalCode}
            </Text>
            {!editing && (
              <Text className="text-muted">
                Don&apos;t lose your progress. Save your profile now to avoid
                losing your work and start connecting with people.
              </Text>
            )}
            {editing && isDirty && (
              <Text className="text-muted font-bold">
                You have unsaved changes. Tap &quot;Save profile&quot; below to
                apply them.
              </Text>
            )}
          </View>
        )}
      </View>
      {save.isError && (
        <Text accessibilityRole="alert" className="text-ink">
          {save.error.message}
        </Text>
      )}
      {notice && (
        <Text accessibilityLiveRegion="polite" className="text-ink">
          {notice}
        </Text>
      )}
      {(!editing || step < last || isDirty) && (
        <Action
          label={
            save.isPending
              ? 'Saving…'
              : step === last
                ? editing
                  ? 'Save profile'
                  : 'Complete profile'
                : editing
                  ? 'Continue'
                  : 'Save and continue'
          }
          loading={save.isPending}
          onPress={() =>
            save.mutate({
              next: Math.min(last, step + 1),
              finish: step === last,
            })
          }
        />
      )}
      {step > 0 && (
        <Action
          label={editing && step === last ? 'Edit details' : 'Back'}
          variant={
            editing && step === last && !isDirty ? 'primary' : 'secondary'
          }
          disabled={save.isPending}
          onPress={() => {
            setStep((old) => old - 1);
            setNotice(null);
          }}
        />
      )}
      {!editing && step < last && (
        <Action
          label="Save progress"
          variant="secondary"
          disabled={save.isPending}
          onPress={() => save.mutate({ next: step })}
        />
      )}
      {editing && role === 'WORKER' && (
        <ServiceAreas
          home={[data.city, data.district, data.state]
            .filter(Boolean)
            .join(', ')}
        />
      )}
      <Action
        label="Sign out"
        variant="quiet"
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
