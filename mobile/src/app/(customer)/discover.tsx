import { Ionicons } from '@expo/vector-icons';
import {
  GlassBackdrop,
  PageHeading,
  GlassCard,
  glassSurface,
  palette,
} from '../../components/theme';
import { useState, useEffect, useRef, useCallback } from 'react';
import { currentSearchLocation } from '../../location/currentSearchLocation';
import { indiaStates, citiesForState } from '../../location/indiaCities';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getTrades, searchWorkers } from '../../api/marketplace';
import { WorkerCard } from '../../components/WorkerCard';
import { Action, Select, Loading, EmptyState } from '../../components/ui';
import { NotificationBell } from '../../components/NotificationBell';

const initial = { tradeId: '', lat: '', lng: '', radius: '15', cityId: '' };
export default function DiscoverScreen() {
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [validation, setValidation] = useState('');
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [locationSource, setLocationSource] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [cityId, setCityId] = useState('');
  const cities = citiesForState(stateCode);
  const lookupVersion = useRef(0);
  const locate = useCallback(async () => {
    const version = ++lookupVersion.current;
    setLocating(true);
    setLocationError('');
    try {
      const { latitude, longitude } = await currentSearchLocation();
      if (version !== lookupVersion.current) return;
      const coordinates = {
        lat: String(latitude),
        lng: String(longitude),
        cityId: '',
      };
      setDraft((previous) => ({ ...previous, ...coordinates }));
      setApplied((previous) => ({ ...previous, ...coordinates }));
      setLocationSource('Current phone location');
      setStateCode('');
      setCityId('');
      setValidation('');
    } catch (error) {
      if (version === lookupVersion.current)
        setLocationError(
          error instanceof Error
            ? error.message
            : 'Could not get your location. Try again or enter it manually.',
        );
    } finally {
      if (version === lookupVersion.current) setLocating(false);
    }
  }, []);
  useEffect(() => {
    const invalidateLookup = () => {
      lookupVersion.current++;
    };
    // Schedule the asynchronous device request; cleanup ignores late results.
    const timer = setTimeout(() => {
      void locate();
    }, 0);
    return () => {
      clearTimeout(timer);
      invalidateLookup();
    };
  }, [locate]);
  const [locationOpen, setLocationOpen] = useState(false);
  const catalogue = useQuery({
    queryKey: ['discovery-trades'],
    queryFn: getTrades,
  });
  const workers = useQuery({
    queryKey: ['discovery-workers', applied],
    enabled: !!applied.lat && !!applied.lng,
    queryFn: () =>
      searchWorkers({
        tradeId: applied.tradeId || undefined,
        lat: Number(applied.lat),
        lng: Number(applied.lng),
        radiusKm: Number(applied.radius),
        cityId: applied.cityId || undefined,
      }),
  });
  const search = () => {
    const lat = Number(draft.lat),
      lng = Number(draft.lng),
      radius = Number(draft.radius);
    if (
      !draft.lat.trim() ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !draft.lng.trim() ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180 ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      setValidation(
        'Choose a city or use your current location before searching.',
      );
      return;
    }
    setValidation('');
    if (JSON.stringify(draft) === JSON.stringify(applied))
      void workers.refetch();
    else setApplied({ ...draft });
  };
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        <PageHeading
          inset={8}
          title="Find workers"
          subtitle="The right skills. Close to you."
          right={<NotificationBell />}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              locationOpen ? 'Hide city selection' : 'Choose a city instead'
            }
            onPress={() => setLocationOpen(!locationOpen)}
            disabled={locating}
            style={[
              glassSurface,
              {
                flex: 1,
                paddingHorizontal: 14,
                minHeight: 48,
                borderRadius: 28,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <Ionicons name="location-outline" size={23} color={palette.teal} />
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: '600',
                color: palette.teal,
              }}
            >
              {locationSource || 'Choose a city'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={palette.teal} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            disabled={locating}
            onPress={() => void locate()}
            style={{ minHeight: 48, justifyContent: 'center', maxWidth: 110 }}
          >
            <Text
              style={{
                fontSize: 12,
                color: palette.teal,
                textDecorationLine: 'underline',
              }}
            >
              {locating ? 'Locating…' : 'Use current location'}
            </Text>
          </Pressable>
        </View>
        {!!locationError && (
          <Text accessibilityRole="alert" className="text-rose-700">
            {locationError}
          </Text>
        )}
        {locationOpen && (
          <View className="gap-4">
            <Select
              label="State / Union territory"
              searchable
              disabled={locating}
              placeholder="Choose a state"
              value={stateCode}
              options={indiaStates.map((state) => ({
                value: state.code,
                label: state.name,
              }))}
              onChange={(code) => {
                setStateCode(code);
                setCityId('');
                setDraft((previous) => ({ ...previous, lat: '', lng: '' }));
                setApplied((previous) => ({ ...previous, lat: '', lng: '' }));
                setLocationSource('');
                setValidation('');
              }}
            />
            <Select
              key={stateCode}
              label="City"
              searchable
              maxVisibleOptions={50}
              disabled={locating || !stateCode}
              placeholder={stateCode ? 'Choose a city' : 'Choose a state first'}
              value={cityId}
              options={cities.map((city) => ({
                value: city.id,
                label: city.name,
              }))}
              onChange={(id) => {
                const city = cities.find((item) => item.id === id);
                if (!city) return;
                setCityId(id);
                setDraft((previous) => ({
                  ...previous,
                  cityId: city.id,
                  lat: String(city.latitude),
                  lng: String(city.longitude),
                }));
                setLocationSource(
                  `${city.name}, ${indiaStates.find((state) => state.code === stateCode)?.name} · City centre`,
                );
                setLocationError('');
                setValidation('');
              }}
            />
            <Text className="text-sm leading-5 text-muted">
              Search starts from the city centre. For a more precise location,
              use your phone’s location. If your town isn’t listed, choose a
              nearby city. Results use workers’ declared service coverage.
            </Text>
            <Text className="text-xs text-muted">
              City data: GeoNames (CC BY 4.0)
            </Text>
          </View>
        )}
        <GlassCard style={{ gap: 12, padding: 16 }}>
          <View
            style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
          >
            <View style={{ flex: 1 }}>
              <Select
                label="Trade"
                value={draft.tradeId}
                onChange={(tradeId) => setDraft({ ...draft, tradeId })}
                searchable
                disabled={catalogue.isPending}
                options={[
                  { value: '', label: 'All trades' },
                  ...(catalogue.data ?? []).map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                label="Radius"
                value={draft.radius}
                onChange={(radius) => setDraft({ ...draft, radius })}
                options={['5', '15', '30', '50'].map((value) => ({
                  value,
                  label: value + ' km',
                }))}
              />
            </View>
          </View>
          {catalogue.isError && (
            <View>
              <Text accessibilityRole="alert" className="text-rose-700">
                Could not load trades.
              </Text>
              <Action
                label="Retry trades"
                variant="secondary"
                onPress={() => void catalogue.refetch()}
              />
            </View>
          )}
          {!!validation && (
            <Text accessibilityRole="alert" className="text-rose-700">
              {validation}
            </Text>
          )}
          <Action
            label="Search Workers"
            loading={workers.isFetching}
            disabled={locating}
            onPress={search}
          />
        </GlassCard>
        {!draft.cityId && draft.lat && draft.lng ? (
          <Text style={{ fontSize: 11, lineHeight: 15, color: palette.muted }}>
            GPS matches distance-based service areas only. Choose a city to
            include state, district and nationwide coverage.
          </Text>
        ) : null}
        {!applied.lat || !applied.lng ? (
          <EmptyState
            title={
              locating
                ? 'Finding workers near you'
                : 'Choose your search location'
            }
            description={
              locating
                ? 'Waiting for your phone’s location.'
                : 'Use your current location or choose a city and tap Search Workers.'
            }
          />
        ) : workers.isError ? (
          <View className="gap-3">
            <EmptyState
              title="Unable to load workers"
              description={workers.error.message}
            />
            <Action
              label="Retry search"
              variant="secondary"
              onPress={() => {
                void workers.refetch();
              }}
            />
          </View>
        ) : workers.isPending || workers.isFetching ? (
          <Loading />
        ) : workers.data!.items.length === 0 ? (
          <EmptyState
            title="No workers found"
            description="Try another trade or job location. Workers must declare coverage for this area."
          />
        ) : (
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: palette.teal,
                marginBottom: 10,
              }}
            >
              Workers nearby
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm font-semibold text-muted mb-4"
            >
              {workers.data.items.length} workers shown
            </Text>
            {workers.data.items.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
