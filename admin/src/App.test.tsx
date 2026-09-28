import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';
test('initializes without exposing administrative data', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: 'Dashboard' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Authentication not configured')).toBeInTheDocument();
  expect(screen.getByText(/No customer, worker/)).toBeInTheDocument();
});
test('all seven navigation destinations remain explicitly incomplete', () => {
  render(<App />);
  for (const name of [
    'Dashboard',
    'Customers',
    'Workers',
    'Verification',
    'Requirements',
    'Bookings',
    'Settings',
  ]) {
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${name} is not implemented`)),
    ).toBeInTheDocument();
  }
});
