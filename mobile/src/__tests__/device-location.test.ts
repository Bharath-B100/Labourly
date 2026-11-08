import * as Location from 'expo-location';
import { detectDeviceLocation } from '../location/deviceLocation';

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
});
test.each([
  [12.97, 77.59],
  [0, 0],
  [51.5, -0.1],
])(
  'GPS %s,%s never invents a district or state',
  async (latitude, longitude) => {
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockResolvedValue({ coords: { latitude, longitude } } as never);
    const result = await detectDeviceLocation();
    expect(result).toMatchObject({ granted: true, latitude, longitude });
    expect(result.stateCode).toBeUndefined();
    expect(result.district).toBeUndefined();
    expect(result.cityId).toBeUndefined();
    expect(result.error).toContain('city');
    expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();
  },
);
test('permission denial retains manual fallback without requesting position', async () => {
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: false } as never);
  expect((await detectDeviceLocation()).error).toContain('city');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
test('invalid coordinates fail safely', async () => {
  jest
    .mocked(Location.getCurrentPositionAsync)
    .mockResolvedValue({ coords: { latitude: NaN, longitude: 77 } } as never);
  expect(await detectDeviceLocation()).toMatchObject({ granted: false });
});
