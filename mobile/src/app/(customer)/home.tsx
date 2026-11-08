import { useState, useEffect, useRef } from 'react';
import {
  Image,
  Text,
  View,
  Pressable,
  TextInput,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getTrades } from '../../api/marketplace';
import { apiJson } from '../../api/client';
import type { Draft } from '../../onboarding/profile';
import { Screen, Action, Select } from '../../components/ui';
import { GlassCard, palette, LabourlyLogo } from '../../components/theme';
import { NotificationBell } from '../../components/NotificationBell';
import { getDefaultWorkerAvatar } from '../../assets/defaultAvatars';
import { indiaStates, citiesForState } from '../../location/indiaCities';
import { currentSearchLocation } from '../../location/currentSearchLocation';

export default function CustomerHome() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gps, setGps] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const locationVersion = useRef(0);
  const selectManualLocation = () => {
    ++locationVersion.current;
    setGps(null);
    setDetectingGps(false);
    setGpsError('');
  };
  const [districtLabel, setDistrictLabel] = useState<string>('');
  const [selection, setSelection] = useState<{
    stateCode: string;
    cityId: string;
  } | null>(null);

  const profileQuery = useQuery({
    queryKey: ['home-customer-profile'],
    queryFn: async () => {
      try {
        const res = await apiJson<Draft>('/api/v1/profile/customer');
        return res ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const saved = profileQuery.data?.data;
  const savedState = indiaStates.find(
    (state) =>
      state.name.toLowerCase() === saved?.state?.trim().toLowerCase() ||
      state.code === saved?.state,
  );
  const matches = savedState
    ? citiesForState(savedState.code).filter(
        (item) => item.name.toLowerCase() === saved?.city?.trim().toLowerCase(),
      )
    : [];
  const savedCity = matches.length === 1 ? matches[0] : undefined;
  const stateCode = selection?.stateCode ?? savedCity?.stateCode ?? '';
  const cityId = selection?.cityId ?? savedCity?.id ?? '';
  const cities = citiesForState(stateCode);
  const city = cities.find((item) => item.id === cityId);

  // Automatically request device location on startup and begin with detected location
  useEffect(() => {
    let active = true;
    const requests = locationVersion;
    const version = ++requests.current;
    (async () => {
      try {
        const res = await currentSearchLocation();
        if (active && version === requests.current) setGps(res);
      } catch {
        // Fallback silently if offline or permission denied
      }
    })();
    return () => {
      active = false;
      ++requests.current;
    };
  }, []);

  const catalogue = useQuery({
    queryKey: ['discovery-trades'],
    queryFn: getTrades,
  });

  const trades = catalogue.data?.filter((trade) =>
    trade.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const discover = (tradeId?: string) =>
    router.push({
      pathname: '/(customer)/discover',
      params: {
        ...(tradeId ? { tradeId } : {}),
        ...(gps
          ? { lat: String(gps.latitude), lng: String(gps.longitude) }
          : city
            ? { cityId: city.id, stateCode }
            : {}),
      },
    });

  const columns = fontScale >= 1.5 ? 1 : width < 360 ? 2 : 3;

  // Format the location subheader (Display District name for villages/sublocalities)
  const activeDistrict =
    districtLabel || (city ? city.name : '') || saved?.district || '';
  const activeStateName =
    indiaStates.find((state) => state.code === stateCode)?.name ||
    saved?.state ||
    '';
  const locationDisplay = gps
    ? 'Current phone location'
    : activeDistrict && activeStateName
      ? `${activeDistrict}, ${activeStateName}`
      : city
        ? `${city.name}, ${activeStateName}`
        : 'Choose your work location';

  return (
    <Screen branded={false}>
      {/* Top Header Row with Logo, Sub-Header Location, and Notification Bell */}
      <View style={styles.headerContainer}>
        <View style={styles.brandAndLocationColumn}>
          <LabourlyLogo width={138} />
          {/* Sub-header Location Indicator (Matching target screenshot) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose work location"
            accessibilityState={{ expanded: locationOpen }}
            onPress={() => setLocationOpen(!locationOpen)}
            style={styles.locationPillButton}
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location-sharp" size={18} color={palette.ink} />
            </View>
            <Text style={styles.locationPillText}>{locationDisplay}</Text>
            <View style={styles.locationChevron}>
              <Ionicons name="chevron-down" size={16} color={palette.ink} />
            </View>
          </Pressable>
        </View>
        <NotificationBell />
      </View>

      {/* Expandable Location Selector Modal Card */}
      {locationOpen && (
        <GlassCard style={{ gap: 12 }}>
          {/* Auto-detect Device Location GPS Action */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Detect my GPS location"
            disabled={detectingGps}
            onPress={async () => {
              const version = ++locationVersion.current;
              setDetectingGps(true);
              try {
                const res = await currentSearchLocation();
                if (version !== locationVersion.current) return;
                setGps(res);
                setGpsError('');
                setLocationOpen(false);
              } catch (error) {
                if (version !== locationVersion.current) return;
                setGpsError(
                  error instanceof Error
                    ? error.message
                    : 'Could not get location. Choose a city.',
                );
              } finally {
                if (version === locationVersion.current) setDetectingGps(false);
              }
            }}
            style={({ pressed }) => [
              styles.gpsButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="locate" size={18} color="#202326" />
            <Text style={styles.gpsButtonText}>
              {detectingGps
                ? 'Detecting device GPS...'
                : '📍 Use current device location (GPS)'}
            </Text>
          </Pressable>

          {!!gpsError && <Text accessibilityRole="alert">{gpsError}</Text>}
          {/* Quick Hub Chips */}
          <View style={styles.quickHubsRow}>
            {[
              { name: 'Bengaluru', cityId: '1277333', stateCode: '19' },
              { name: 'Coimbatore', cityId: '1273865', stateCode: '25' },
              { name: 'Chennai', cityId: '1264527', stateCode: '25' },
              { name: 'Krishnagiri', cityId: '1265863', stateCode: '25' },
            ].map((hub) => (
              <Pressable
                key={hub.name}
                accessibilityRole="button"
                accessibilityLabel={`Search in ${hub.name}`}
                onPress={() => {
                  selectManualLocation();
                  setSelection({
                    stateCode: hub.stateCode,
                    cityId: hub.cityId,
                  });
                  setDistrictLabel(hub.name);
                  setLocationOpen(false);
                }}
                style={[
                  styles.quickHubChip,
                  cityId === hub.cityId && styles.quickHubChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickHubChipText,
                    cityId === hub.cityId && styles.quickHubChipTextActive,
                  ]}
                >
                  {hub.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Select
            label="State / Union territory"
            searchable
            value={stateCode}
            options={indiaStates.map((state) => ({
              label: state.name,
              value: state.code,
            }))}
            onChange={(value) => {
              selectManualLocation();
              setSelection({ stateCode: value, cityId: '' });
              setDistrictLabel('');
            }}
          />
          <Select
            label="City"
            searchable
            value={cityId}
            disabled={!stateCode}
            options={cities.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={(value) => {
              const matched = cities.find((c) => c.id === value);
              selectManualLocation();
              setSelection({ stateCode, cityId: value });
              if (matched) setDistrictLabel(matched.name);
            }}
          />
          <Text style={{ color: palette.ink, fontSize: 13 }}>
            Manual search uses the selected city centre. GPS search uses device
            coordinates. Results must match the worker’s declared service
            coverage.
          </Text>
          <Action
            label="Find workers here"
            disabled={!city && !gps}
            onPress={() => discover()}
          />
        </GlassCard>
      )}

      {/* Main Search Bar with Filter Icon Button (Matching Screenshot) */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          accessibilityLabel="Search trades"
          placeholder="Search for labour, skills, or jobs..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {!!searchQuery && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearchQuery('')}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter trades"
          onPress={() => setLocationOpen(!locationOpen)}
          style={styles.searchFilterIconBtn}
        >
          <Ionicons name="options-outline" size={18} color="#202326" />
        </Pressable>
      </View>

      {/* Trade Grid Section Header */}
      <Text
        accessibilityRole="header"
        style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}
      >
        Find your crew
      </Text>

      {catalogue.isPending && (
        <Text accessibilityRole="progressbar">Loading trades…</Text>
      )}
      {catalogue.isError && (
        <>
          <Text accessibilityRole="alert">
            Trades could not be loaded. Please try again.
          </Text>
          <Action
            label="Retry trades"
            variant="secondary"
            onPress={() => void catalogue.refetch()}
          />
        </>
      )}
      {catalogue.isSuccess && catalogue.data.length === 0 && (
        <Text>No trades are available yet.</Text>
      )}
      {!!catalogue.data?.length && trades?.length === 0 && (
        <Text>No matching trades. Try another name.</Text>
      )}

      {/* Trade Cards Grid (Matching Screenshot) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {trades?.map((trade) => (
          <Pressable
            key={trade.id}
            accessibilityRole="button"
            accessibilityLabel={`Find ${trade.name} workers`}
            onPress={() => discover(trade.id)}
            style={({ pressed }) => [
              styles.tradeCard,
              { width: columns === 1 ? '100%' : columns === 2 ? '47%' : '30%' },
              pressed && styles.tradeCardPressed,
            ]}
          >
            <Image
              source={getDefaultWorkerAvatar(trade.name)}
              accessible={false}
              style={styles.tradeAvatarImage}
              resizeMode="cover"
            />
            <Text numberOfLines={1} style={styles.tradeCardName}>
              {trade.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Action
        label="Browse all workers and filters"
        variant="secondary"
        onPress={() => discover()}
      />

      {/* Promo Banner (Matching Screenshot: "Get Skilled Labour Near You") */}
      <Pressable onPress={() => discover()} style={styles.promoBannerCard}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.promoBannerTitle}>
            Get Skilled Labour Near You
          </Text>
          <Text style={styles.promoBannerSubtitle}>
            Verified • Reliable • On Demand
          </Text>
        </View>
        <Image
          source={getDefaultWorkerAvatar('Mason')}
          style={styles.promoWorkerImage}
          resizeMode="cover"
        />
        <View style={styles.promoArrowCircle}>
          <Ionicons name="chevron-forward" size={18} color="#0284C7" />
        </View>
      </Pressable>

      <GlassCard
        style={{ backgroundColor: palette.yellow, gap: 12, padding: 20 }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: palette.ink }}>
          Your next project starts here.
        </Text>
        <Text style={{ color: palette.ink }}>
          Tell workers what you need and choose the right quotation.
        </Text>
        <Action
          label="Post a requirement"
          onPress={() => router.push('/(customer)/post')}
        />
      </GlassCard>

      <Text
        accessibilityRole="header"
        style={{ color: palette.ink, fontSize: 20, fontWeight: '700' }}
      >
        Manage your work
      </Text>
      <Action
        label="My jobs and quotations"
        variant="secondary"
        onPress={() => router.push('/(customer)/requirements')}
      />
      <Action
        label="My bookings"
        variant="secondary"
        onPress={() => router.push('/(customer)/bookings')}
      />
      <Text style={{ color: palette.ink, fontSize: 13, marginBottom: 20 }}>
        Prices come from worker quotations. Bookings are confirmed after
        acceptance and availability checks.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  brandAndLocationColumn: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  locationPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: palette.grey,
  },
  locationIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationChevron: {
    width: 20,
    flexShrink: 0,
    alignItems: 'center',
  },
  locationPillText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  gpsButton: {
    backgroundColor: '#FFCC25',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  gpsButtonText: {
    color: '#202326',
    fontWeight: '800',
    fontSize: 13,
  },
  quickHubsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  quickHubChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickHubChipActive: {
    backgroundColor: '#FFCC25',
    borderColor: '#EAB308',
  },
  quickHubChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickHubChipTextActive: {
    color: '#202326',
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 48,
  },
  searchFilterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeCard: {
    minHeight: 140,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tradeCardPressed: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF08A',
  },
  tradeAvatarImage: {
    width: 74,
    height: 74,
    borderRadius: 16,
    backgroundColor: '#FEF9C3',
  },
  tradeCardName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  promoBannerCard: {
    backgroundColor: '#0284C7',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
  },
  promoBannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  promoBannerSubtitle: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
  },
  promoWorkerImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
    marginRight: 10,
  },
  promoArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
