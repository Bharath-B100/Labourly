import { fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  JobLocationPicker,
  cityJobLocation,
} from '../location/JobLocationPicker';
import { locationCatalogue } from '../location/CanonicalPlacePicker';
import { currentSearchLocation } from '../location/currentSearchLocation';

jest.mock('../location/currentSearchLocation', () => ({
  currentSearchLocation: jest.fn(),
}));
jest.mock('../components/ui', () => {
  const { View, Text, Pressable } = jest.requireActual('react-native');
  return {
    Action: ({ label, onPress, disabled, loading }: any) => (
      <Pressable disabled={disabled || loading} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    Select: ({ label, options, onChange, disabled }: any) => (
      <View>
        {!disabled &&
          options.map((o: any) => (
            <Pressable key={o.value} onPress={() => onChange(o.value)}>
              <Text>
                {label}:{o.label}
              </Text>
            </Pressable>
          ))}
      </View>
    ),
  };
});

test('retains all places, unresolved districts and the verified state crosswalk', () => {
  expect(locationCatalogue.cities).toHaveLength(3781);
  expect(
    locationCatalogue.cities.filter(
      (c) => c.districtResolution === 'UNRESOLVED',
    ),
  ).toHaveLength(27);
  expect(locationCatalogue.states).toHaveLength(36);
  expect(
    locationCatalogue.states.find((s) => s.id === 'lgd:29')
      ?.applicationStateCode,
  ).toBe('KA');
});

test.each([
  ['1277333', 12.97194, 77.59369, 'KA'],
  ['1265863', 12.51921, 78.21382, 'TN'],
])(
  'manual %s resolves independent city-centre coordinates',
  (id, lat, lng, state) => {
    const result = cityJobLocation(
      locationCatalogue.cities.find((c) => c.id === id)!,
    );
    expect(result).toMatchObject({
      lat,
      lng,
      stateCode: state,
      locationSource: 'CITY_CENTRE',
      locationCityId: id,
    });
  },
);

test('manual selection recovers from denied GPS and requires confirmation', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockRejectedValueOnce(new Error('Permission denied. Choose a city.'));
  const change = jest.fn();
  const screen = await render(<JobLocationPicker onChange={change} />);
  await fireEvent.press(screen.getByText('Use current job-site location'));
  await waitFor(() =>
    expect(screen.getByText('Permission denied. Choose a city.')).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByText('State or union territory:Tamil Nadu'),
  );
  await fireEvent.press(screen.getByText('City or town:Krishnagiri'));
  expect(change).toHaveBeenLastCalledWith(null);
  await fireEvent.press(screen.getByText('Confirm this job location'));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({
      lat: 12.51921,
      lng: 78.21382,
      locationCityId: '1265863',
    }),
  );
  await fireEvent.press(screen.getByText('State or union territory:Karnataka'));
  expect(change).toHaveBeenLastCalledWith(null);
});

test('GPS preserves the point without claiming a verified district or state', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockResolvedValueOnce({ latitude: 12.52, longitude: 78.22 });
  const change = jest.fn();
  const screen = await render(<JobLocationPicker onChange={change} />);
  await fireEvent.press(screen.getByText('Use current job-site location'));
  await waitFor(() =>
    expect(screen.getByText('Confirm this job location')).toBeTruthy(),
  );
  await fireEvent.press(screen.getByText('Confirm this job location'));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({
      lat: 12.52,
      lng: 78.22,
      locationSource: 'GPS',
      locationStateId: null,
      locationCityId: null,
      district: '',
    }),
  );
});

test('Mumbai is retained without a fabricated district', () => {
  expect(
    cityJobLocation(locationCatalogue.cities.find((c) => c.id === '1275339')!),
  ).toMatchObject({ district: '', locationStateId: 'lgd:27' });
});

test('initialValue populates confirmed location and skips reselection', async () => {
  const change = jest.fn();
  const initial = cityJobLocation(
    locationCatalogue.cities.find((c) => c.id === '1265863')!,
  );
  const screen = await render(
    <JobLocationPicker initialValue={initial} onChange={change} />,
  );

  // Confirmed button is present and disabled
  expect(screen.getByText('Job location confirmed')).toBeTruthy();

  // If user picks a new state, it resets confirmed and fires onChange(null)
  await fireEvent.press(screen.getByText('State or union territory:Karnataka'));
  expect(change).toHaveBeenCalledWith(null);
  expect(screen.queryByText('Job location confirmed')).toBeNull();
});

test('GPS explains radius-only matching and manual fallback replaces rather than labels GPS', async () => {
  jest
    .mocked(currentSearchLocation)
    .mockResolvedValueOnce({ latitude: 51.5, longitude: -0.12 });
  const change = jest.fn();
  const screen = await render(<JobLocationPicker onChange={change} />);
  await fireEvent.press(screen.getByText('Use current job-site location'));
  await waitFor(() =>
    expect(
      screen.getByText(/GPS matches distance-based service areas only/),
    ).toBeTruthy(),
  );
  await fireEvent.press(screen.getByText('Confirm this job location'));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({
      lat: 51.5,
      lng: -0.12,
      locationStateId: null,
      locationCityId: null,
    }),
  );
  await fireEvent.press(
    screen.getByText('State or union territory:Tamil Nadu'),
  );
  await fireEvent.press(screen.getByText('City or town:Krishnagiri'));
  expect(change).toHaveBeenLastCalledWith(null);
  await fireEvent.press(screen.getByText('Confirm this job location'));
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({
      lat: 12.51921,
      lng: 78.21382,
      locationStateId: 'lgd:33',
      locationCityId: '1265863',
      locationSource: 'CITY_CENTRE',
    }),
  );
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
