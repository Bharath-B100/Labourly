import { GlassStartButton } from '../components/GlassStartButton';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { homeRoute, useSession } from '../auth/session';
import { Brand, GlassBackdrop, GlassCard, palette } from '../components/theme';

export default function Welcome() {
  const session = useSession((state) => state.session);
  const router = useRouter();
  const route = homeRoute(session);
  if (route !== '/') return <Redirect href={route} />;
  return (
    <SafeAreaView style={styles.page}>
      <GlassBackdrop />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Brand />
          <View style={styles.eyebrow}>
            <View style={styles.dot} />
            <Text style={styles.eyebrowText}>GOOD WORK STARTS HERE</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Big ideas.{'\n'}Skilled hands.
          </Text>
          <Text style={styles.subtitle}>
            Find the right people for your project. Or find the next project for
            your skills.
          </Text>

          <View
            style={styles.scene}
            accessible
            accessibilityLabel="Construction illustration: buildings taking shape"
          >
            <View style={styles.sun} />
            <View style={styles.skyline}>
              {[72, 118, 156, 96].map((height, index) => (
                <View
                  key={height}
                  style={[
                    styles.building,
                    {
                      height,
                      backgroundColor: index === 2 ? '#145C58' : '#BBD8CF',
                    },
                  ]}
                >
                  <View style={styles.windows}>
                    {Array.from({ length: 6 }, (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.window,
                          {
                            backgroundColor:
                              index === 2 ? '#CEE7DD' : '#F6FAF7',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.ground} />
            <View style={styles.sceneLabel}>
              <Text style={styles.sceneLabelText}>
                LOCAL SKILLS. REAL POSSIBILITIES.
              </Text>
            </View>
          </View>

          <GlassCard style={styles.paths}>
            <View style={styles.path}>
              <Text style={styles.pathNumber}>01 / CUSTOMERS</Text>
              <Text style={styles.pathTitle}>Build your crew</Text>
              <Text style={styles.pathCopy}>
                Post a job. Compare quotes. Hire.
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.path}>
              <Text style={styles.pathNumber}>02 / WORKERS</Text>
              <Text style={styles.pathTitle}>Find your next job</Text>
              <Text style={styles.pathCopy}>
                Show your skills. Discover local work.
              </Text>
            </View>
          </GlassCard>
          <View style={styles.footer}>
            <Text style={styles.ready}>Ready to build?</Text>
            <GlassStartButton
              label="Get Started"
              onPress={() => router.push('/auth/login')}
            />
            <Text style={styles.note}>One account. Your next opportunity.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.pearl },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 16 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C79725' },
  eyebrowText: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    flexShrink: 1,
  },
  title: {
    color: palette.ink,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.8,
    lineHeight: 49,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 420,
  },
  scene: {
    height: 190,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  sun: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#F4D778',
    right: 32,
    top: 10,
  },
  skyline: {
    position: 'absolute',
    bottom: 28,
    left: '10%',
    right: '10%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  building: {
    flex: 1,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    padding: 10,
  },
  windows: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  window: { width: '30%', height: 10, borderRadius: 1 },
  ground: {
    position: 'absolute',
    bottom: 27,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#8FAFA5',
  },
  sceneLabel: {
    position: 'absolute',
    bottom: 9,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sceneLabelText: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: palette.muted,
  },
  paths: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  path: { flex: 1, minWidth: 115, gap: 7 },
  pathNumber: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pathTitle: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  pathCopy: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  divider: { width: 1, backgroundColor: 'rgba(20,92,88,0.12)' },
  footer: { gap: 12, paddingTop: 4 },
  ready: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  note: { color: palette.muted, fontSize: 11, textAlign: 'center' },
});
