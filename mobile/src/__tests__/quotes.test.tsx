import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react-native';
import OpportunityDetailsScreen from '../app/(worker)/opportunity/[id]';
import QuotesScreen from '../app/(customer)/requirement/quotes';
import { apiJson } from '../api/client';
import {
  submitQuote,
  getMyQuotes,
  editQuote,
  getRequirementQuotes,
  acceptQuote,
  rejectQuote,
} from '../api/quotations';
import { Alert } from 'react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'req-1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useFocusEffect: (cb: any) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(() => {
      const cleanup = cb();
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }, [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../api/client', () => ({
  apiJson: jest.fn(),
}));

jest.mock('../api/quotations', () => ({
  submitQuote: jest.fn(),
  getMyQuotes: jest.fn(),
  withdrawQuote: jest.fn(),
  editQuote: jest.fn(),
  getRequirementQuotes: jest.fn(),
  acceptQuote: jest.fn(),
  rejectQuote: jest.fn(),
}));

const mockAlert = jest.spyOn(Alert, 'alert');
afterEach(async () => {
  await cleanup();
});

describe('Worker Quote Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockImplementation(() => {});
  });

  test('submits a quote successfully with validation', async () => {
    (apiJson as jest.Mock).mockResolvedValue({
      id: 'req-1',
      title: 'Need Carpenter',
      trade: 'CARPENTER',
      description: 'Fixing doors',
      city: 'Bengaluru',
      district: 'Bengaluru',
      workerCount: 1,
      startsAt: '2023-11-01T10:00:00Z',
      endsAt: '2023-11-03T10:00:00Z',
    });
    (getMyQuotes as jest.Mock).mockResolvedValue([]);
    (submitQuote as jest.Mock).mockResolvedValue({});

    await render(<OpportunityDetailsScreen />);

    await waitFor(
      () => expect(screen.getByText('Need Carpenter')).toBeTruthy(),
      { timeout: 5000 },
    );

    await fireEvent.changeText(screen.getByTestId('amount-input'), '3000');
    await fireEvent.changeText(screen.getByPlaceholderText('e.g. 5'), '2');
    await fireEvent.press(screen.getByText('Fixed Total'));

    await waitFor(
      () => expect(screen.getByTestId('amount-input').props.value).toBe('3000'),
      { timeout: 5000 },
    );

    await fireEvent.press(screen.getByText('Send Quote'));

    await waitFor(
      () => {
        expect(submitQuote).toHaveBeenCalledWith(
          'req-1',
          expect.objectContaining({
            amount: 3000,
            pricingBasis: 'FIXED_TOTAL',
            durationDays: 2,
          }),
        );
      },
      { timeout: 5000 },
    );

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Send Quote')).toBeTruthy(), {
      timeout: 5000,
    });
  }, 15000);

  test('renders existing quote and allows withdrawal', async () => {
    (apiJson as jest.Mock).mockResolvedValue({
      id: 'req-1',
      title: 'Need Carpenter',
      trade: 'CARPENTER',
      startsAt: '2023-11-01T10:00:00Z',
      endsAt: '2023-11-03T10:00:00Z',
    });
    (getMyQuotes as jest.Mock).mockResolvedValue([
      {
        id: 'quote-1',
        requirementId: 'req-1',
        amount: 4000,
        pricingBasis: 'PER_DAY',
        durationDays: 3,
        status: 'SUBMITTED',
      },
    ]);

    await render(<OpportunityDetailsScreen />);

    await waitFor(
      () => {
        expect(screen.getByText('Update Quote')).toBeTruthy();
      },
      { timeout: 2000 },
    );

    (editQuote as jest.Mock).mockResolvedValue({});
    await fireEvent.changeText(screen.getByTestId('amount-input'), '4500');

    await waitFor(() =>
      expect(screen.getByTestId('amount-input').props.value).toBe('4500'),
    );

    await fireEvent.press(screen.getByText('Update Quote'));

    await waitFor(() => {
      expect(editQuote).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({ amount: 4500 }),
      );
    });

    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Update Quote')).toBeTruthy(), {
      timeout: 5000,
    });
  });

  test('handles backend/API error gracefully', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('Network Error'));
    await render(<OpportunityDetailsScreen />);
    await waitFor(() => expect(screen.getByText('Network Error')).toBeTruthy());
  });
});

describe('Customer Quote Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockImplementation(() => {});
  });

  test('renders empty quote state', async () => {
    (getRequirementQuotes as jest.Mock).mockResolvedValue([]);
    await render(<QuotesScreen />);
    await waitFor(() => {
      expect(screen.getByText('No quotes yet')).toBeTruthy();
    });
  });

  test('renders quotes and allows accepting', async () => {
    (getRequirementQuotes as jest.Mock).mockResolvedValue([
      {
        id: 'quote-1',
        workerName: 'Worker A',
        status: 'SUBMITTED',
        amount: 1500,
        pricingBasis: 'PER_DAY',
        durationDays: 2,
        createdAt: '2023-10-01T10:00:00Z',
        startsAt: '2023-11-01T10:00:00Z',
      },
    ]);

    await render(<QuotesScreen />);
    await waitFor(() => expect(screen.getByText('Worker A')).toBeTruthy());

    mockAlert.mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });
    (acceptQuote as jest.Mock).mockResolvedValue({});

    await fireEvent.press(screen.getByText('Accept'));

    await waitFor(() => expect(acceptQuote).toHaveBeenCalledWith('quote-1'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Worker A')).toBeTruthy(), {
      timeout: 5000,
    });
  });

  test('rejects quote successfully', async () => {
    (getRequirementQuotes as jest.Mock).mockResolvedValue([
      {
        id: 'quote-1',
        workerName: 'Worker A',
        status: 'SUBMITTED',
        amount: 1500,
        pricingBasis: 'PER_DAY',
        durationDays: 2,
        createdAt: '2023-10-01T10:00:00Z',
        startsAt: '2023-11-01T10:00:00Z',
      },
    ]);

    await render(<QuotesScreen />);
    await waitFor(() => expect(screen.getByText('Reject')).toBeTruthy());

    mockAlert.mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });
    (rejectQuote as jest.Mock).mockResolvedValue({});

    await fireEvent.press(screen.getByText('Reject'));

    await waitFor(() => expect(rejectQuote).toHaveBeenCalledWith('quote-1'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Worker A')).toBeTruthy(), {
      timeout: 5000,
    });
  });
});

test('quote list retry recovers after a failed request', async () => {
  jest
    .mocked(getRequirementQuotes)
    .mockReset()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue([]);
  await render(<QuotesScreen />);
  await screen.findByText('Offline');
  await fireEvent.press(screen.getByText('Retry'));
  await screen.findByText('No quotes yet');
  expect(getRequirementQuotes).toHaveBeenCalledTimes(2);
});

test('a withdrawn quote can be submitted again without editing finalized history', async () => {
  jest.mocked(apiJson).mockResolvedValue({
    id: 'req-1',
    title: 'Need Carpenter',
    startsAt: '2031-01-01T00:00:00Z',
    endsAt: '2031-01-03T00:00:00Z',
  });
  jest.mocked(getMyQuotes).mockResolvedValue([
    {
      id: 'old-quote',
      requirementId: 'req-1',
      amount: 1500,
      durationDays: 2,
      pricingBasis: 'PER_DAY',
      status: 'WITHDRAWN',
    } as Awaited<ReturnType<typeof getMyQuotes>>[number],
  ]);
  jest.mocked(submitQuote).mockClear().mockResolvedValue('new-quote');
  jest.mocked(editQuote).mockClear();
  mockAlert.mockImplementation(() => {});
  await render(<OpportunityDetailsScreen />);
  await screen.findByText('Send Quote');
  await fireEvent.press(screen.getByText('Send Quote'));
  await waitFor(() =>
    expect(submitQuote).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({ amount: 1500 }),
    ),
  );
  expect(editQuote).not.toHaveBeenCalled();
});
