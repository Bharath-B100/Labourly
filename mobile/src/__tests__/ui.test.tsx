import { useState } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { Action, Select } from '../components/ui';
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));
afterEach(async () => {
  await cleanup();
});
const options = [
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'electrician', label: 'Electrician' },
];
function TradePicker() {
  const [value, setValue] = useState('');
  return (
    <Select
      label="Trade"
      value={value}
      options={options}
      onChange={setValue}
      searchable
    />
  );
}
test('searchable trade dropdown selects an option, closes and retains its selection', async () => {
  await render(<TradePicker />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Trade: Choose an option' }),
  );
  await fireEvent.changeText(screen.getByLabelText('Search trade'), 'elect');
  expect(screen.queryByRole('radio', { name: 'Carpenter' })).toBeNull();
  await fireEvent.press(screen.getByRole('radio', { name: 'Electrician' }));
  expect(
    screen.getByRole('button', { name: 'Trade: Electrician' }).props
      .accessibilityState,
  ).toMatchObject({ expanded: false });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Trade: Electrician' }),
  );
  expect(
    screen.getByRole('radio', { name: 'Electrician' }).props.accessibilityState,
  ).toMatchObject({ checked: true });
  expect(screen.getByRole('radio', { name: 'Carpenter' })).toBeTruthy();
});
test('dropdown empty search and dismissal do not change the selected value', async () => {
  await render(<TradePicker />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Trade: Choose an option' }),
  );
  await fireEvent.changeText(screen.getByLabelText('Search trade'), 'plumber');
  expect(screen.getByText('No options found.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close options' }));
  expect(
    screen.getByRole('button', { name: 'Trade: Choose an option' }).props
      .accessibilityState,
  ).toMatchObject({ expanded: false });
});
test('disabled dropdown cannot open', async () => {
  await render(
    <Select
      label="Trade"
      value=""
      options={options}
      onChange={jest.fn()}
      disabled
    />,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Trade: Choose an option' }),
  );
  expect(screen.queryByRole('radio')).toBeNull();
});
test('busy action blocks repeat submission and exposes loading state', async () => {
  const submit = jest.fn();
  const view = await render(<Action label="Save" loading onPress={submit} />);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
  await fireEvent.press(button);
  expect(submit).not.toHaveBeenCalled();
  await view.rerender(<Action label="Save" onPress={submit} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(submit).toHaveBeenCalledTimes(1);
});
