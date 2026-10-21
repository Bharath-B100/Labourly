import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { ScheduleCalendar, dateKey } from '../components/ScheduleCalendar';

afterEach(async () => {
  await cleanup();
});

test('calendar selects the exact local date and navigates months', async () => {
  const onChange = jest.fn();
  await render(<ScheduleCalendar value="2090-02-10" onChange={onChange} />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Select 2090-02-11' }),
  );
  expect(onChange).toHaveBeenCalledWith('2090-02-11');
  await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  expect(
    screen.getByRole('button', { name: 'Select 2090-03-01' }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
  expect(
    screen.getByRole('button', { name: 'Select 2090-02-10', selected: true }),
  ).toBeTruthy();
});

test('calendar prevents choosing past dates and formats local date components', async () => {
  const onChange = jest.fn();
  await render(<ScheduleCalendar value="2000-01-01" onChange={onChange} />);
  expect(
    screen.getByRole('button', { name: 'Select 2000-01-02', disabled: true }),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Select 2000-01-02' }),
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(dateKey(new Date(2090, 0, 2))).toBe('2090-01-02');
});
