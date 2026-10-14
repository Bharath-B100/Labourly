import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PostRequirement from '../app/(customer)/post';
import { apiJson } from '../api/client';
import { getTrades, postRequirement } from '../api/marketplace';
import { Alert, BackHandler } from 'react-native';
import {
  DraftNavigationGuard,
  type DraftExitGuard,
} from '../navigation/DraftNavigationGuard';
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockNavigation = { dispatch: mockDispatch };
let mockRemove: any;
let mockPrevent = false;
let hardwareBack: () => boolean;
const guard: DraftExitGuard = { current: null };
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ editId: 'draft-id' }),
  useNavigation: () => mockNavigation,
  useFocusEffect: (cb: any) => jest.requireActual('react').useEffect(cb, [cb]),
}));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (dirty: boolean, cb: any) => {
    mockPrevent = dirty;
    mockRemove = cb;
  },
}));
jest.mock('../api/client', () => ({ apiJson: jest.fn() }));
jest.mock('../api/marketplace', () => ({
  getTrades: jest.fn(),
  postRequirement: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('../location/JobLocationPicker', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    JobLocationPicker: ({ onChange }: any) => (
      <Pressable
        onPress={() =>
          onChange({
            city: 'Krishnagiri',
            district: 'Krishnagiri',
            stateCode: 'TN',
            lat: 12.51921,
            lng: 78.21382,
            locationSource: 'CITY_CENTRE',
            locationStateId: 'lgd:33',
            locationCityId: '1265863',
          })
        }
      >
        <Text>Confirm selected location</Text>
      </Pressable>
    ),
  };
});
const draft = {
  title: 'Original draft',
  description: 'Original description',
  category_id: 'trade',
  skill_ids: ['skill'],
  worker_count: 2,
  budget: 1500,
  edit_version: 3,
  starts_at: '2031-10-15T04:00:00Z',
  ends_at: '2031-10-17T04:00:00Z',
  city: 'Bengaluru',
  state_code: 'KA',
  lat: 12.9716,
  lng: 77.5946,
  location_source: null,
};
beforeEach(() => {
  jest.clearAllMocks();
  guard.current = null;
  jest.mocked(getTrades).mockResolvedValue([
    {
      id: 'trade',
      code: 'CARPENTER',
      name: 'Carpenter',
      skills: [{ id: 'skill', name: 'Furniture' }],
    },
  ]);
  jest.mocked(apiJson).mockResolvedValue(draft);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_name, cb) => {
      hardwareBack = cb as () => boolean;
      return { remove: jest.fn() };
    });
});
async function open() {
  const s = await render(
    <DraftNavigationGuard.Provider value={guard}>
      <PostRequirement />
    </DraftNavigationGuard.Provider>,
  );
  await waitFor(() =>
    expect(s.getByDisplayValue('Original draft')).toBeTruthy(),
  );
  return s;
}
async function choice(text: string) {
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)![2]!;
  await act(() => buttons.find((b) => b.text === text)!.onPress!());
}
function noMutation() {
  expect(
    jest.mocked(apiJson).mock.calls.filter((c) => c[1]?.method),
  ).toHaveLength(0);
  expect(postRequirement).not.toHaveBeenCalled();
}
test('unchanged draft is clean and Back leaves without warning or mutation', async () => {
  await open();
  expect(mockPrevent).toBe(false);
  await act(() => hardwareBack());
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalled();
  noMutation();
});
test('title edit is dirty; hardware Back warns once; Keep Editing preserves values', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Unsaved title');
  expect(mockPrevent).toBe(true);
  await act(() => {
    hardwareBack();
    hardwareBack();
  });
  await choice('Keep Editing');
  expect(Alert.alert).toHaveBeenCalledTimes(1);
  expect(s.getByDisplayValue('Unsaved title')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  noMutation();
});
test('discard leaves without writing and reopening reloads stored values', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Discard this title');
  await act(() => hardwareBack());
  await choice('Discard Changes');
  expect(mockReplace).toHaveBeenCalled();
  await waitFor(() =>
    expect(s.getByDisplayValue('Original draft')).toBeTruthy(),
  );
  noMutation();
});
test('tab navigation is blocked until Discard and replays only the chosen action', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Unsaved tab title');
  const action = { type: 'JUMP_TO', payload: { name: 'discover' } };
  await act(() => {
    expect(guard.current!(action)).toBe(true);
  });
  await choice('Keep Editing');
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(s.getByDisplayValue('Unsaved tab title')).toBeTruthy();
  await act(() => {
    guard.current!(action);
  });
  await choice('Discard Changes');
  expect(mockDispatch).toHaveBeenCalledWith(action);
  noMutation();
});
test('header Back and navigation removal use the same confirmation', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Unsaved header title');
  await fireEvent.press(s.getByText('Back'));
  await choice('Keep Editing');
  const action = { type: 'POP' };
  await act(() => mockRemove({ data: { action } }));
  await choice('Discard Changes');
  expect(mockDispatch).toHaveBeenCalledWith(action);
  noMutation();
});
test('reverting a title to loaded values removes dirty state', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Temporary title');
  await fireEvent.changeText(s.getByLabelText('Title'), draft.title);
  expect(mockPrevent).toBe(false);
  noMutation();
});
test('only explicit Save updates the existing ID once; subsequent exit is allowed', async () => {
  const s = await open();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Changed draft title');
  await fireEvent.press(s.getByText('Confirm selected location'));
  noMutation();
  await fireEvent.press(s.getByText('Save draft'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  const writes = jest
    .mocked(apiJson)
    .mock.calls.filter((c) => c[1]?.method === 'PUT');
  expect(writes).toHaveLength(1);
  expect(writes[0]![0]).toBe('/api/v1/requirements/draft-id/draft');
  expect(JSON.parse(writes[0]![1]!.body as string)).toMatchObject({
    expectedVersion: 3,
    form: { title: 'Changed draft title', locationCityId: '1265863' },
  });
  expect(postRequirement).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        id: 'draft-id',
        refresh: expect.any(String),
      }),
    }),
  );
  await act(() => hardwareBack());
  expect(Alert.alert).not.toHaveBeenCalled();
});
test('missing location and stale update failures do not clear edited values', async () => {
  const s = await open();
  await fireEvent.press(s.getByText('Save draft'));
  expect(Alert.alert).toHaveBeenCalledWith(
    'Error',
    'Choose and confirm the job location.',
  );
  noMutation();
  await fireEvent.changeText(s.getByLabelText('Title'), 'Unsaved title');
  await fireEvent.press(s.getByText('Confirm selected location'));
  jest
    .mocked(apiJson)
    .mockRejectedValueOnce(
      new Error('This draft changed. Reload before saving.'),
    );
  await fireEvent.press(s.getByText('Save draft'));
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'This draft changed. Reload before saving.',
    ),
  );
  expect(s.getByDisplayValue('Unsaved title')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockPrevent).toBe(true);
});
