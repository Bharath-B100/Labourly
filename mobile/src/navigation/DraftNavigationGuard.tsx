import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useEffect,
} from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import {
  usePreventRemove,
  type NavigationAction,
} from 'expo-router/react-navigation';

// Tab changes do not remove routes. The tab router delegates exits here as well.
export type DraftExitGuard = {
  current: ((action: NavigationAction) => boolean) | null;
};
export const DraftNavigationGuard = createContext<DraftExitGuard>({
  current: null,
});

export function useDraftNavigationGuard({
  dirty,
  saved,
  discard,
  leave,
}: {
  dirty: boolean;
  saved: { current: boolean };
  discard: () => void;
  leave: () => void;
}) {
  const navigation = useNavigation();
  const guardRef = useContext(DraftNavigationGuard);
  const latest = useRef({ dirty, discard, leave });
  useEffect(() => {
    latest.current = { dirty, discard, leave };
  }, [dirty, discard, leave]);
  const showing = useRef(false);
  const active = useRef(false);
  const requestExit = useCallback(
    (proceed: () => void) => {
      if (!latest.current.dirty || saved.current) {
        // Finish the native Back event before dispatching Expo's queued action.
        queueMicrotask(proceed);
        return;
      }
      if (showing.current) return;
      showing.current = true;
      // Router evaluation must finish before showing a native dialog.
      queueMicrotask(() => {
        if (!active.current) {
          showing.current = false;
          return;
        }
        Alert.alert(
          'Discard unsaved changes?',
          'Your changes have not been saved.',
          [
            {
              text: 'Keep Editing',
              style: 'cancel',
              onPress: () => {
                showing.current = false;
              },
            },
            {
              text: 'Discard Changes',
              style: 'destructive',
              onPress: () => {
                showing.current = false;
                saved.current = true;
                latest.current.discard();
                proceed();
              },
            },
          ],
          { cancelable: false },
        );
      });
    },
    [saved],
  );

  usePreventRemove(dirty, ({ data }) =>
    requestExit(() => navigation.dispatch(data.action)),
  );

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      const intercept = (action: NavigationAction) => {
        if (!latest.current.dirty || saved.current) return false;
        requestExit(() => navigation.dispatch(action));
        return true;
      };
      guardRef.current = intercept;
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        requestExit(() => latest.current.leave());
        return true;
      });
      return () => {
        active.current = false;
        back.remove();
        if (guardRef.current === intercept) guardRef.current = null;
      };
    }, [guardRef, navigation, requestExit, saved]),
  );
  useEffect(
    () => () => {
      showing.current = false;
    },
    [],
  );
  return requestExit;
}
