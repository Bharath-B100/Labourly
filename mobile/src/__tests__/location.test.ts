import { currentSearchLocation } from '../location/currentSearchLocation';
import * as Location from 'expo-location';
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
});
test('foreground location returns valid coordinates including zero', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
    coords: { latitude: 0, longitude: 0 },
  } as Location.LocationObject);
  await expect(currentSearchLocation()).resolves.toEqual({
    latitude: 0,
    longitude: 0,
  });
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
    accuracy: 4,
  });
});
test('denied permission never requests coordinates', async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
  } as Location.LocationPermissionResponse);
  await expect(currentSearchLocation()).rejects.toThrow('phone settings');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
test('disabled location services provide a recoverable error', async () => {
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);
  await expect(currentSearchLocation()).rejects.toThrow('location services');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
test('invalid native coordinates are rejected', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
    coords: { latitude: NaN, longitude: 80 },
  } as Location.LocationObject);
  await expect(currentSearchLocation()).rejects.toThrow('invalid location');
});

test('slow GPS times out with a manual city fallback and clears its timer', async () => {
  jest.useFakeTimers();
  try {
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockReturnValue(new Promise(() => {}));
    const result = currentSearchLocation();
    const assertion = expect(result).rejects.toThrow('choose a city');
    await jest.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});
