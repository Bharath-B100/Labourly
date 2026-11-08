import { GlassBackdrop } from '../../components/theme';
import { Action, Select } from '../../components/ui';
import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOpportunities, RequirementView } from '../../api/marketplace';
import { RequirementCard } from '../../components/RequirementCard';
import { useFocusEffect, useRouter } from 'expo-router';

import { currentSearchLocation } from '../../location/currentSearchLocation';
import { indiaStates, citiesForState } from '../../location/indiaCities';
import { useSession } from '../../auth/session';
import { NotificationBell } from '../../components/NotificationBell';

export default function OpportunitiesScreen() {
  const userId = useSession((state) => state.session?.userId);
  return <FindJobs key={userId || 'signed-out'} />;
}
function FindJobs() {
  const [area, setArea] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
    label: string;
  }>();
  const [editing, setEditing] = useState(false);
  const [stateCode, setStateCode] = useState('');
  const [cityId, setCityId] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const locationVersion = useRef(0);
  const requestVersion = useRef(0);
  const [pageNumber, setPageNumber] = useState(0);
  const chooseArea = (next: typeof area) => {
    ++locationVersion.current;
    setLocating(false);
    setLocationError('');
    setPageNumber(0);
    setArea(next);
    setEditing(false);
  };
  const locate = async () => {
    const version = ++locationVersion.current;
    setLocating(true);
    setLocationError('');
    try {
      const point = await currentSearchLocation();
      if (version !== locationVersion.current) return;
      chooseArea({
        lat: point.latitude,
        lng: point.longitude,
        radiusKm: 30,
        label: `Phone location (${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)})`,
      });
    } catch (e) {
      if (version === locationVersion.current)
        setLocationError(
          e instanceof Error ? e.message : 'Choose a city instead.',
        );
    } finally {
      if (version === locationVersion.current) setLocating(false);
    }
  };
  const [opportunities, setOpportunities] = useState<RequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchOpps = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    setOpportunities([]);
    try {
      const page = await getOpportunities(pageNumber, 20, area);
      if (version === requestVersion.current) setOpportunities(page.items);
    } catch (e: any) {
      if (version === requestVersion.current)
        setError(e.message || 'Failed to load opportunities');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [area, pageNumber]);
  useFocusEffect(
    useCallback(() => {
      setLocating(false);
      void fetchOpps();
      return () => {
        ++requestVersion.current;
        ++locationVersion.current;
      };
    }, [fetchOpps]),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#202326' }}>
          Find Jobs
        </Text>
        <NotificationBell />
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View
          style={{
            padding: 16,
            gap: 12,
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#202326', fontWeight: '700' }}>
            Searching jobs in
          </Text>
          <Text>
            {area
              ? `${area.label} Â· within 30 km`
              : 'All your saved service areas'}
          </Text>
          <Text>
            Only jobs matching your trade, service coverage and schedule are
            shown. Changing this search does not change your profile.
          </Text>
          <Action
            label={editing ? 'Close location options' : 'Change location'}
            variant="secondary"
            onPress={() => setEditing(!editing)}
          />
          {editing && (
            <>
              <Action
                label={
                  locating
                    ? 'Getting phone locationâ€¦'
                    : 'Use my current location'
                }
                onPress={locate}
                disabled={locating}
              />
              <Text>
                Phone location is a one-time GPS reading, not continuous
                tracking.
              </Text>
              {locationError ? (
                <Text accessibilityRole="alert">{locationError}</Text>
              ) : null}
              <Select
                label="State"
                value={stateCode}
                options={indiaStates.map((s) => ({
                  value: s.code,
                  label: s.name,
                }))}
                onChange={(value) => {
                  ++locationVersion.current;
                  setLocating(false);
                  setStateCode(value);
                  setCityId('');
                }}
                searchable
              />
              <Select
                label="City"
                value={cityId}
                options={citiesForState(stateCode).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                onChange={setCityId}
                searchable
                disabled={!stateCode}
              />
              <Action
                label="Search selected city"
                disabled={!cityId}
                onPress={() => {
                  const city = citiesForState(stateCode).find(
                    (c) => c.id === cityId,
                  );
                  if (city)
                    chooseArea({
                      lat: city.latitude,
                      lng: city.longitude,
                      radiusKm: 30,
                      label: `${city.name}, ${indiaStates.find((s) => s.code === stateCode)?.name} city centre`,
                    });
                }}
              />
              <Action
                label="Use all my service areas"
                variant="secondary"
                onPress={() => chooseArea(undefined)}
              />
            </>
          )}
        </View>
        {error ? (
          <View className="items-center mt-8">
            <Text className="text-ink text-center mb-4">{error}</Text>
            <Action label="Retry" variant="secondary" onPress={fetchOpps} />
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" size="large" color="#202326" />
        ) : opportunities.length === 0 ? (
          <View className="items-center mt-8 p-6 bg-surface rounded-xl border border-outline">
            <Text className="text-ink text-lg font-semibold mb-2">
              No jobs found
            </Text>
            <Text className="text-muted text-center">
              No eligible jobs were found in this search area. Try another city
              or all your saved service areas.
            </Text>
          </View>
        ) : (
          opportunities.map((opp) => (
            <RequirementCard
              key={opp.id}
              requirement={opp}
              onPress={() => router.push(`/(worker)/opportunity/${opp.id}`)}
            />
          ))
        )}
        {!loading && !error && (
          <View style={{ gap: 12, marginVertical: 16 }}>
            {pageNumber > 0 && (
              <Action
                label="Previous jobs"
                variant="secondary"
                onPress={() => setPageNumber((p) => p - 1)}
              />
            )}
            {opportunities.length === 20 && (
              <Action
                label="More jobs"
                variant="secondary"
                onPress={() => setPageNumber((p) => p + 1)}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
