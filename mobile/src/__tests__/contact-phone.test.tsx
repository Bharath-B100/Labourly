import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { ContactPhoneField } from '../onboarding/ContactPhoneField';
import { useSession, type Session } from '../auth/session';
import { apiJson } from '../api/client';

jest.mock('../api/client', () => ({
  apiJson: jest.fn(),
  publicJson: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../components/ui', () => {
  const { Text, TextInput, Pressable } = jest.requireActual('react-native');
  return {
    Input: ({ label, ...props }: any) => (
      <TextInput accessibilityLabel={label} {...props} />
    ),
    Action: ({ label, onPress, loading }: any) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={loading}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});
const account: Session = {
  userId: 'fictional-account-a',
  phone: '+919800000001',
  fullName: 'Test Person',
  roles: ['CUSTOMER'],
  onboardingState: 'COMPLETED',
  onboardingStep: null,
};
beforeEach(() => {
  jest.clearAllMocks();
  useSession.setState({ session: { ...account } });
});
afterEach(async () => {
  await cleanup();
});
async function save(value: string) {
  await fireEvent.changeText(
    screen.getByLabelText('Contact number (unverified)'),
    value,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Save contact number' }),
  );
}
test('contact save preserves verified login phone and account identity', async () => {
  jest.mocked(apiJson).mockResolvedValue({});
  await render(<ContactPhoneField />);
  await save('9800000002');
  expect(apiJson).toHaveBeenCalledWith('/api/v1/users/me/contact', {
    method: 'PUT',
    body: JSON.stringify({ phone: '+919800000002' }),
  });
  expect(useSession.getState().session).toEqual({
    ...account,
    contactPhone: '+919800000002',
  });
  expect(
    screen.getByText('Contact saved. This number remains unverified.'),
  ).toBeTruthy();
});
test('invalid phone never reaches server', async () => {
  await render(<ContactPhoneField />);
  await save('abc');
  expect(apiJson).not.toHaveBeenCalled();
  expect(screen.getByText(/Could not save/)).toBeTruthy();
});
test('network failure preserves session and permits retry', async () => {
  jest
    .mocked(apiJson)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({});
  await render(<ContactPhoneField />);
  await save('9800000002');
  expect(useSession.getState().session).toEqual(account);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Save contact number' }),
  );
  expect(apiJson).toHaveBeenCalledTimes(2);
  expect(useSession.getState().session?.contactPhone).toBe('+919800000002');
});
test('empty contact clears only the unverified contact', async () => {
  jest.mocked(apiJson).mockResolvedValue({});
  await render(<ContactPhoneField />);
  await save('');
  expect(useSession.getState().session).toEqual({
    ...account,
    contactPhone: null,
  });
});
test('late save response cannot change a different signed-in account', async () => {
  jest.mocked(apiJson).mockImplementation(async () => {
    useSession.setState({
      session: { ...account, userId: 'fictional-account-b' },
    });
    return {};
  });
  await render(<ContactPhoneField />);
  await save('9800000002');
  expect(useSession.getState().session).toEqual({
    ...account,
    userId: 'fictional-account-b',
  });
  expect(
    screen.queryByText('Contact saved. This number remains unverified.'),
  ).toBeNull();
});
