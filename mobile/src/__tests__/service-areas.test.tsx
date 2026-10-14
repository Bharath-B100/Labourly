import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ServiceAreas from '../location/ServiceAreas';
import { apiJson } from '../api/client';
jest.mock('../api/client', () => ({ apiJson: jest.fn() }));
jest.mock('../auth/session', () => ({
  useSession: (select: any) => select({ session: { userId: 'worker-a' } }),
}));
jest.mock('../components/ui', () => {
  const { View, Text, Pressable, TextInput } =
    jest.requireActual('react-native');
  return {
    Action: ({ label, onPress, disabled, loading }: any) => (
      <Pressable disabled={disabled || loading} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    Input: ({ label, ...props }: any) => (
      <TextInput accessibilityLabel={label} {...props} />
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
const empty = {
  configured: false,
  nationwide: false,
  stateIds: [],
  districtIds: [],
  baseCityId: null,
  radiusKm: null,
};
const clients: QueryClient[] = [];
const mount = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ServiceAreas home="Krishnagiri, TN" />
    </QueryClientProvider>,
  );
};
afterEach(() => clients.splice(0).forEach((client) => client.clear()));
beforeEach(() => {
  jest.mocked(apiJson).mockReset().mockResolvedValue(empty);
});
test('saves multiple states and districts through the authenticated self endpoint', async () => {
  const screen = await mount();
  await waitFor(() =>
    expect(screen.getByText('Save service areas')).toBeTruthy(),
  );
  await fireEvent.press(screen.getByText('Add an entire state:Karnataka'));
  await fireEvent.press(screen.getByText('Add an entire state:Tamil Nadu'));
  await fireEvent.press(
    screen.getByText('Browse districts in state:Karnataka'),
  );
  await fireEvent.press(screen.getByText('Add a district:Bangalore Urban'));
  await fireEvent.press(screen.getByText('Save service areas'));
  await waitFor(() =>
    expect(apiJson).toHaveBeenCalledWith(
      '/api/v1/workers/me/service-coverage',
      expect.objectContaining({ method: 'PUT' }),
    ),
  );
  const options = jest
    .mocked(apiJson)
    .mock.calls.find((c) => c[1]?.method === 'PUT')![1]!;
  expect(JSON.parse(options.body as string)).toEqual({
    nationwide: false,
    stateIds: ['lgd:29', 'lgd:33'],
    districtIds: ['geonames:1277331'],
    baseCityId: null,
    radiusKm: null,
  });
  expect(screen.getByText('Home: Krishnagiri, TN')).toBeTruthy();
});
test('nationwide requires an explicit action and can be disabled before save', async () => {
  const screen = await mount();
  await waitFor(() =>
    expect(screen.getByText('Enable jobs anywhere in India')).toBeTruthy(),
  );
  await fireEvent.press(screen.getByText('Enable jobs anywhere in India'));
  await fireEvent.press(screen.getByText('Nationwide enabled — turn off'));
  await fireEvent.press(screen.getByText('Save service areas'));
  const options = jest
    .mocked(apiJson)
    .mock.calls.find((c) => c[1]?.method === 'PUT')![1]!;
  expect(JSON.parse(options.body as string).nationwide).toBe(false);
});
test('load failure prevents editing until retry succeeds', async () => {
  jest.mocked(apiJson).mockRejectedValueOnce(new Error('Offline'));
  const screen = await mount();
  await waitFor(() =>
    expect(screen.getByText('Retry service areas')).toBeTruthy(),
  );
  expect(screen.queryByText('Save service areas')).toBeNull();
  await fireEvent.press(screen.getByText('Retry service areas'));
  await waitFor(() =>
    expect(screen.getByText('Save service areas')).toBeTruthy(),
  );
});
