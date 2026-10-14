import { useState } from 'react';
import { Text, View } from 'react-native';
import { Select } from '../components/ui';
import data from './canonical-locations.json';

export const locationCatalogue = data;
export type CataloguePlace = (typeof data.cities)[number];
export function CanonicalPlacePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (city: CataloguePlace | null) => void;
  disabled?: boolean;
}) {
  const selected = data.cities.find((c) => c.id === value);
  const [state, setState] = useState(selected?.stateId ?? '');
  const [district, setDistrict] = useState('');
  const places = data.cities.filter(
    (c) =>
      c.stateId === state &&
      (!district ||
        (district === 'unresolved'
          ? c.districtIds.length !== 1
          : c.districtIds.includes(district))),
  );
  return (
    <View className="gap-3">
      <Select
        label="State or union territory"
        searchable
        disabled={disabled}
        value={state}
        options={data.states.map((s) => ({ value: s.id, label: s.name }))}
        onChange={(id) => {
          setState(id);
          setDistrict('');
          onChange(null);
        }}
      />
      <Select
        label="District"
        searchable
        disabled={disabled || !state}
        value={district}
        options={[
          { value: '', label: 'All places in this state' },
          ...data.districts
            .filter((d) => d.stateId === state)
            .map((d) => ({ value: d.id, label: d.name })),
          {
            value: 'unresolved',
            label: 'District unresolved or spans districts',
          },
        ]}
        onChange={(id) => {
          setDistrict(id);
          onChange(null);
        }}
      />
      <Select
        label="City or town"
        searchable
        disabled={disabled || !state}
        value={value}
        options={places.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(id) =>
          onChange(data.cities.find((c) => c.id === id) ?? null)
        }
      />
      {selected && (
        <Text className="text-sm text-muted">
          {selected.districtResolution === 'UNRESOLVED'
            ? 'District is unresolved. Radius, state and nationwide coverage can still apply.'
            : selected.districtIds.length > 1
              ? 'This place spans districts. District-only eligibility needs a verified worksite district.'
              : 'District relationship available from the location catalogue.'}
        </Text>
      )}
      <Text className="text-xs text-muted">
        Offline place data: GeoNames (CC BY 4.0). State crosswalk: Government
        LGD and Unicode CLDR.
      </Text>
    </View>
  );
}
