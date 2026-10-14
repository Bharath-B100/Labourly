import * as Location from 'expo-location';
// A one-shot foreground lookup. No background tracking or stored location history.
export async function currentSearchLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      permission.canAskAgain
        ? 'Location permission was denied. Try again or choose a city instead.'
        : 'Location permission is off. Enable it in your phone settings, or choose a city instead.',
    );
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Turn on your phone’s location services, then try again.');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        // A one-shot GPS-capable request also works without a network location fix.
        accuracy: Location.Accuracy.High,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                'Location took too long. Try again outdoors or choose a city instead.',
              ),
            ),
          15000,
        );
      }),
    ]);
    const { latitude, longitude } = position.coords;
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      throw new Error(
        'Your phone returned an invalid location. Please try again.',
      );
    return { latitude, longitude };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
