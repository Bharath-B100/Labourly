import { glassSurface, palette } from '../components/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Action } from '../components/ui';
import {
  CanonicalPlacePicker,
  locationCatalogue,
  type CataloguePlace,
} from './CanonicalPlacePicker';
import { currentSearchLocation } from './currentSearchLocation';

export type JobLocation = {
  locationSource: 'GPS' | 'CITY_CENTRE';
  locationStateId: string | null;
  locationCityId: string | null;
  lat: number;
  lng: number;
  city: string;
  district: string;
  stateCode: string;
};
export function cityJobLocation(city: CataloguePlace): JobLocation {
  const state = locationCatalogue.states.find((s) => s.id === city.stateId)!;
  const district =
    city.districtIds.length === 1
      ? (locationCatalogue.districts.find((d) => d.id === city.districtIds[0])
          ?.name ?? '')
      : '';
  return {
    locationSource: 'CITY_CENTRE',
    locationStateId: state.id,
    locationCityId: city.id,
    lat: city.latitude,
    lng: city.longitude,
    city: city.name,
    district,
    stateCode: state.applicationStateCode,
  };
}
export function JobLocationPicker({
  initialValue,
  onChange,
  compact = false,
}: {
  initialValue?: JobLocation | null;
  compact?: boolean;
  onChange: (value: JobLocation | null) => void;
}) {
  const [expanded, setExpanded] = useState(!compact);
  const [candidate, setCandidate] = useState<JobLocation | null>(
    initialValue || null,
  );
  const [confirmed, setConfirmed] = useState(!!initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const change = (v: JobLocation | null) => {
    setCandidate(v);
    setConfirmed(false);
    onChange(null);
  };
  const gps = async () => {
    const token = ++version.current;
    setBusy(true);
    setError('');
    change(null);
    try {
      const point = await currentSearchLocation();
      if (token !== version.current) return;
      change({
        locationSource: 'GPS',
        locationStateId: null,
        locationCityId: null,
        lat: point.latitude,
        lng: point.longitude,
        city: 'GPS job location',
        district: '',
        stateCode: 'IN',
      });
    } catch (e) {
      if (token === version.current)
        setError(
          e instanceof Error
            ? e.message
            : 'Location unavailable. Choose a city below.',
        );
    } finally {
      if (token === version.current) setBusy(false);
    }
  };
  return (
    <View style={{ gap: 10, marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: palette.teal }}>Job location</Text>
      {compact && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose job location"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
          style={[
            glassSurface,
            {
              borderRadius: 28,
              padding: 12,
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            },
          ]}
        >
          <Ionicons name="location-outline" size={24} color={palette.teal} />
          <Text
            style={{
              flex: 1,
              color: palette.teal,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            {confirmed && candidate
              ? candidate.city + ', ' + candidate.stateCode
              : 'Choose job location'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={palette.teal} />
        </Pressable>
      )}
      {expanded && (
        <>
          <Action
            label="Use current job-site location"
            loading={busy}
            onPress={() => {
              void gps();
            }}
          />
          {error ? (
            <Text accessibilityRole="alert" className="text-rose-700">
              {error}
            </Text>
          ) : null}
          <CanonicalPlacePicker
            value={candidate?.locationCityId ?? ''}
            onChange={(city) => {
              ++version.current;
              setBusy(false);
              setError('');
              change(city ? cityJobLocation(city) : null);
            }}
          />
          {candidate && (
            <>
              <Text className="text-ink">
                {candidate.locationSource === 'CITY_CENTRE'
                  ? `${candidate.city} · Approximate city centre, not an exact worksite pin.`
                  : 'GPS matches distance-based service areas only. State, district and nationwide coverage need a verified catalogue location. Choose a state and city below to include those workers; confirming a city replaces the GPS point with its approximate city centre.'}
              </Text>
              <Action
                label={
                  confirmed
                    ? 'Job location confirmed'
                    : 'Confirm this job location'
                }
                variant="secondary"
                disabled={confirmed}
                onPress={() => {
                  setConfirmed(true);
                  if (compact) setExpanded(false);
                  onChange(candidate);
                }}
              />
            </>
          )}
        </>
      )}
    </View>
  );
}
