import { render, screen, cleanup } from '@testing-library/react-native';
import { LabourlySplashScreen } from '../components/LabourlySplashScreen';

afterEach(async () => {
  await cleanup();
});

describe('LabourlySplashScreen', () => {
  test('renders splash screen image and accessible progress bar', async () => {
    await render(<LabourlySplashScreen progress={0.5} animated={false} />);

    // Verify accessibility image label
    const splashImage = screen.getByLabelText(
      'Labourly: Hire Local Labour, Fast. Skilled People Build a Better Tomorrow',
    );
    expect(splashImage).toBeTruthy();

    // Verify progress bar role and value
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 50,
    });
  });
});
