import { Ionicons } from '@expo/vector-icons';
import {
  GlassBackdrop,
  GlassCard,
  glassSurface,
  palette,
} from '../../components/theme';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { currentSearchLocation } from '../../location/currentSearchLocation';
import { indiaStates, citiesForState } from '../../location/indiaCities';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getTrades, searchWorkers } from '../../api/marketplace';
import { WorkerCard } from '../../components/WorkerCard';
import { Action, Select, Loading, EmptyState } from '../../components/ui';

const initial = {
  tradeId: '',
  lat: '',
  lng: '',
  radius: '15',
  cityId: '',
  availability: 'ALL',
  page: 0,
};
export default function DiscoverScreen() {
  const {
    lat: requestedLat,
    lng: requestedLng,
    tradeId: requestedTrade,
    cityId: requestedCity,
    stateCode: requestedState,
  } = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    tradeId?: string;
    cityId?: string;
    stateCode?: string;
  }>();
  const trade = typeof requestedTrade === 'string' ? requestedTrade : '';
  const city =
    typeof requestedState === 'string' && typeof requestedCity === 'string'
      ? citiesForState(requestedState).find((item) => item.id === requestedCity)
      : undefined;
  const gps =
    typeof requestedLat === 'string' &&
    typeof requestedLng === 'string' &&
    requestedLat.trim() &&
    requestedLng.trim() &&
    Number.isFinite(Number(requestedLat)) &&
    Number.isFinite(Number(requestedLng)) &&
    Math.abs(Number(requestedLat)) <= 90 &&
    Math.abs(Number(requestedLng)) <= 180
      ? { lat: requestedLat, lng: requestedLng }
      : undefined;
  return (
    <DiscoverContent
      key={`${trade}:${city?.id || ''}:${gps?.lat || ''}:${gps?.lng || ''}`}
      initialGps={gps}
      initialTrade={trade}
      initialCity={city}
    />
  );
}
function DiscoverContent({
  initialTrade,
  initialCity,
  initialGps,
}: {
  initialTrade: string;
  initialGps?: { lat: string; lng: string };
  initialCity?: ReturnType<typeof citiesForState>[number];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'All' | 'Nearby' | 'Verified' | 'Top Rated'
  >('All');
  const starting = {
    ...initial,
    tradeId: initialTrade,
    ...initialGps,
    ...(initialCity
      ? {
          lat: String(initialCity.latitude),
          lng: String(initialCity.longitude),
          cityId: initialCity.id,
        }
      : {}),
  };
  const [draft, setDraft] = useState(starting);
  const [applied, setApplied] = useState(starting);
  const [validation, setValidation] = useState('');
  const [locating, setLocating] = useState(!initialCity && !initialGps);
  const [locationError, setLocationError] = useState('');
  const [locationSource, setLocationSource] = useState(
    initialCity
      ? `${initialCity.name} city centre`
      : initialGps
        ? 'Current phone location'
        : '',
  );
  const [stateCode, setStateCode] = useState(initialCity?.stateCode || '');
  const [cityId, setCityId] = useState(initialCity?.id || '');
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
        page: 0,
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
    if (initialCity || initialGps) return;
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
  }, [locate, initialCity, initialGps]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const catalogue = useQuery({
    queryKey: ['discovery-trades'],
    queryFn: getTrades,
  });
  // Validate deep-link identifiers against the server catalogue before querying.
  const tradeId = catalogue.data?.some((trade) => trade.id === applied.tradeId)
    ? applied.tradeId
    : undefined;
  const workers = useQuery({
    queryKey: ['discovery-workers', applied, tradeId, activeTab],
    enabled: !!applied.lat && !!applied.lng && catalogue.isSuccess,
    queryFn: () =>
      searchWorkers({
        tradeId,
        nearby: activeTab === 'Nearby',
        page: applied.page,
        availability: applied.availability || undefined,
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
    const next = { ...draft, page: 0 };
    if (JSON.stringify(next) === JSON.stringify(applied))
      void workers.refetch();
    else setApplied(next);
  };

  const selectedTrade = catalogue.data?.find(
    (t) => t.id === applied.tradeId || t.id === draft.tradeId,
  );

  const getPluralTrade = (name?: string) => {
    if (!name) return 'Workers';
    const clean = name.trim();
    if (clean.toLowerCase().endsWith('man')) {
      return clean.slice(0, -3) + 'men';
    }
    if (clean.toLowerCase().endsWith('s')) {
      return clean;
    }
    return clean + 's';
  };

  const headerTradeTitle = selectedTrade
    ? getPluralTrade(selectedTrade.name)
    : 'Workers';

  const selectedCityObj = applied.cityId
    ? cities.find((c) => c.id === applied.cityId)
    : undefined;

  const headerDistrict =
    selectedCityObj?.name ||
    (locationSource
      ? (locationSource.split(',')[0] || '')
          .replace('📍', '')
          .replace('(HQ)', '')
          .replace('city centre', '')
          .trim()
      : 'your area');

  const headerLocationTitle = `in ${headerDistrict || 'your area'}`;

  const unsupportedFilter =
    activeTab === 'Verified' || activeTab === 'Top Rated';
  const displayedWorkers = workers.data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        {/* Target Header matching Labour Listing: Back + Trade in District + Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 4,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              if (router.canGoBack?.()) {
                router.back();
              } else {
                router.replace('/(customer)/home');
              }
            }}
            hitSlop={12}
            style={({ pressed }) => ({
              padding: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={26} color="#0F172A" />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 8 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#0F172A',
                letterSpacing: -0.3,
              }}
            >
              {headerTradeTitle}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#475569',
                marginTop: 1,
              }}
            >
              {headerLocationTitle}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search workers or change filters"
            onPress={() => setFiltersOpen((prev) => !prev)}
            hitSlop={12}
            style={({ pressed }) => ({
              padding: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="search" size={22} color="#0F172A" />
          </Pressable>
        </View>

        {/* Target Filter Tabs: All, Nearby, Verified, Top Rated */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingVertical: 2,
            alignItems: 'center',
          }}
        >
          {(['All', 'Nearby', 'Verified', 'Top Rated'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${tab}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setActiveTab(tab);
                  setApplied((old) => ({ ...old, page: 0 }));
                  if (tab === 'Nearby' && !applied.lat) {
                    void locate();
                  }
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20,
                  minHeight: 48,
                  justifyContent: 'center',
                  backgroundColor: isSelected ? palette.yellow : palette.grey,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '600',
                    color: palette.ink,
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              locationOpen ? 'Hide city selection' : 'Choose a city instead'
            }
            onPress={() => {
              lookupVersion.current++;
              setLocating(false);
              setLocationOpen(!locationOpen);
            }}
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
          <Text accessibilityRole="alert" className="text-ink">
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
                setDraft((previous) => ({
                  ...previous,
                  lat: '',
                  lng: '',
                  cityId: '',
                  page: 0,
                }));
                setApplied((previous) => ({
                  ...previous,
                  lat: '',
                  lng: '',
                  cityId: '',
                  page: 0,
                }));
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
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'AVAILABLE', 'BUSY', 'UNAVAILABLE'].map((availability) => (
            <Pressable
              key={availability}
              accessibilityRole="button"
              accessibilityState={{
                selected: applied.availability === availability,
              }}
              onPress={() => {
                setDraft((old) => ({ ...old, availability }));
                setApplied((old) => ({ ...old, availability, page: 0 }));
              }}
              style={{
                minHeight: 48,
                justifyContent: 'center',
                paddingHorizontal: 16,
                borderRadius: 24,
                backgroundColor:
                  applied.availability === availability
                    ? palette.yellow
                    : palette.grey,
              }}
            >
              <Text style={{ color: palette.ink }}>
                {
                  {
                    ALL: 'All workers',
                    AVAILABLE: 'Available',
                    BUSY: 'Busy',
                    UNAVAILABLE: 'Unavailable',
                  }[availability]
                }
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Smart filters"
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => setFiltersOpen(!filtersOpen)}
            style={{
              minHeight: 48,
              paddingHorizontal: 16,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.grey,
            }}
          >
            <Ionicons name="options-outline" size={18} color={palette.ink} />
            <Text>Filters</Text>
          </Pressable>
        </View>
        {(filtersOpen || locationOpen) && (
          <GlassCard style={{ gap: 16, padding: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                accessibilityRole="header"
                style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}
              >
                Smart filters
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset worker filters"
                onPress={() =>
                  setDraft((old) => ({
                    ...old,
                    tradeId: '',
                    radius: '15',
                    availability: 'ALL',
                  }))
                }
                style={{
                  minHeight: 48,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: palette.ink }}>Reset</Text>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'flex-start',
              }}
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
                <Text accessibilityRole="alert" className="text-ink">
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
              <Text accessibilityRole="alert" className="text-ink">
                {validation}
              </Text>
            )}
            <Action
              label="Search Workers"
              loading={workers.isFetching}
              disabled={locating}
              onPress={search}
            />
            <Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18 }}>
              Nearby uses the worker’s registered base, not live tracking.
              Radius applies to Nearby searches. Availability is
              worker-reported; booking dates are checked when hiring. Rates are
              agreed through quotations. Reviews and verified-identity filters
              are not available yet.
            </Text>
          </GlassCard>
        )}
        {!draft.cityId && draft.lat && draft.lng ? (
          <Text style={{ fontSize: 11, lineHeight: 15, color: palette.muted }}>
            GPS matches distance-based service areas only. Choose a city to
            include state, district and nationwide coverage.
          </Text>
        ) : null}
        {unsupportedFilter ? (
          <EmptyState
            title={
              activeTab === 'Top Rated'
                ? 'Ratings are not available yet'
                : 'Identity verification is not available yet'
            }
            description={
              activeTab === 'Top Rated'
                ? 'Worker reviews are not collected yet. Choose All or Nearby to compare real profiles and quotations.'
                : 'Test review statuses are not identity checks. Choose All or Nearby to browse workers.'
            }
          />
        ) : !applied.lat || !applied.lng ? (
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
              {activeTab === 'Nearby'
                ? 'Workers based nearby'
                : 'Workers serving this location'}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm font-semibold text-muted mb-4"
            >
              {workers.data.total} workers found - Page {applied.page + 1}
            </Text>
            {displayedWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
            <View style={{ gap: 12, marginTop: 16 }}>
              {(applied.page + 1) * workers.data.size < workers.data.total && (
                <Action
                  label="Next workers"
                  onPress={() =>
                    setApplied((old) => ({ ...old, page: old.page + 1 }))
                  }
                />
              )}
            </View>
          </View>
        )}
        {applied.page > 0 && !workers.isFetching && (
          <Action
            label="Previous workers"
            variant="secondary"
            onPress={() =>
              setApplied((old) => ({ ...old, page: old.page - 1 }))
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
