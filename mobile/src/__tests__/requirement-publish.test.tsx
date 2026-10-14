import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import RequirementDetailsScreen from '../app/(customer)/requirement/[id]';
import * as api from '../api/marketplace';
import { Alert } from 'react-native';
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'req-123' }),
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}));

jest.mock('../api/marketplace', () => ({
  getRequirement: jest.fn(),
  getRequirementMatches: jest.fn(),
  updateRequirementStatus: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});
afterEach(async () => {
  await cleanup();
});

describe('RequirementDetailsScreen - Publish Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDraftReq = {
    id: 'req-123',
    title: 'Test Req',
    status: 'DRAFT',
  };

  const mockOpenReq = {
    id: 'req-123',
    title: 'Test Req',
    status: 'OPEN',
  };

  it('shows Publish button when requirement is DRAFT', async () => {
    (api.getRequirement as jest.Mock).mockResolvedValueOnce(mockDraftReq);
    (api.getRequirementMatches as jest.Mock).mockResolvedValueOnce([]);

    await render(<RequirementDetailsScreen />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Publish Requirement' }),
      ).toBeTruthy();
      expect(screen.getByText('Cancel Job')).toBeTruthy();
      expect(screen.queryByText('Close Job')).toBeNull();
    });
  });

  it('hides Publish button when requirement is not DRAFT', async () => {
    (api.getRequirement as jest.Mock).mockResolvedValueOnce(mockOpenReq);
    (api.getRequirementMatches as jest.Mock).mockResolvedValueOnce([]);

    await render(<RequirementDetailsScreen />);

    await screen.findByText('OPEN');
    expect(
      screen.queryByRole('button', { name: 'Publish Requirement' }),
    ).toBeNull();
    expect(screen.getByText('Cancel Job')).toBeTruthy();
    expect(screen.getByText('Close Job')).toBeTruthy();
  });

  it('hides all actions when requirement is CLOSED', async () => {
    (api.getRequirement as jest.Mock).mockResolvedValueOnce({
      ...mockOpenReq,
      status: 'CLOSED',
    });
    (api.getRequirementMatches as jest.Mock).mockResolvedValueOnce([]);
    await render(<RequirementDetailsScreen />);
    await screen.findByText('CLOSED');
    expect(
      screen.queryByRole('button', { name: 'Publish Requirement' }),
    ).toBeNull();
    expect(screen.queryByText('Cancel Job')).toBeNull();
    expect(screen.queryByText('Close Job')).toBeNull();
  });

  it('hides all actions when requirement is CANCELLED', async () => {
    (api.getRequirement as jest.Mock).mockResolvedValueOnce({
      ...mockOpenReq,
      status: 'CANCELLED',
    });
    (api.getRequirementMatches as jest.Mock).mockResolvedValueOnce([]);
    await render(<RequirementDetailsScreen />);
    await screen.findByText('CANCELLED');
    expect(
      screen.queryByRole('button', { name: 'Publish Requirement' }),
    ).toBeNull();
    expect(screen.queryByText('Cancel Job')).toBeNull();
    expect(screen.queryByText('Close Job')).toBeNull();
  });

  it('successfully publishes and updates status to OPEN', async () => {
    (api.getRequirement as jest.Mock)
      .mockResolvedValueOnce(mockDraftReq)
      .mockResolvedValueOnce(mockOpenReq);
    (api.getRequirementMatches as jest.Mock).mockResolvedValue([]);
    (api.updateRequirementStatus as jest.Mock).mockResolvedValueOnce(undefined);

    await render(<RequirementDetailsScreen />);

    let publishBtn: any;
    await waitFor(() => {
      publishBtn = screen.getByRole('button', { name: 'Publish Requirement' });
    });

    await fireEvent.press(publishBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Publish Requirement',
      expect.any(String),
      expect.any(Array),
    );
    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmAction = alertArgs[2].find(
      (b: any) => b.text === 'Publish',
    ).onPress;

    await act(async () => {
      await confirmAction();
    });

    expect(api.updateRequirementStatus).toHaveBeenCalledWith('req-123', 'OPEN');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Requirement published successfully',
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Publish Requirement' }),
      ).toBeNull();
    });

    expect(screen.getByText('OPEN')).toBeTruthy();
  });

  it('shows error if API rejects the transition', async () => {
    (api.getRequirement as jest.Mock).mockResolvedValueOnce(mockDraftReq);
    (api.getRequirementMatches as jest.Mock).mockResolvedValueOnce([]);
    (api.updateRequirementStatus as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid state transition'),
    );

    await render(<RequirementDetailsScreen />);

    let publishBtn: any;
    await waitFor(() => {
      publishBtn = screen.getByRole('button', { name: 'Publish Requirement' });
    });

    await fireEvent.press(publishBtn);

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmAction = alertArgs[2].find(
      (b: any) => b.text === 'Publish',
    ).onPress;

    await act(async () => {
      await confirmAction();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Invalid state transition',
    );

    expect(
      screen.getByRole('button', { name: 'Publish Requirement' }),
    ).toBeTruthy();
  });
});
