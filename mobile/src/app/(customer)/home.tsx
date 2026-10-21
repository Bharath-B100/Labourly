import { Image, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getTrades } from '../../api/marketplace';
import { useRouter } from 'expo-router';
import { Screen, Action } from '../../components/ui';
import { GlassCard, palette, LabourlyLogo } from '../../components/theme';
import { NotificationBell } from '../../components/NotificationBell';
import {
  DASHBOARD_BANNER,
  getDefaultWorkerAvatar,
} from '../../assets/defaultAvatars';

export default function CustomerHome() {
  const router = useRouter();
  const catalogue = useQuery({
    queryKey: ['discovery-trades'],
    queryFn: getTrades,
  });
  return (
    <Screen branded={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <LabourlyLogo width={148} />
        <NotificationBell />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose work location"
        onPress={() => router.push('/(customer)/discover')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 48,
        }}
      >
        <Ionicons name="location-outline" size={16} color={palette.ink} />
        <Text style={{ color: palette.ink, flex: 1 }}>
          Choose your work location
        </Text>
        <Ionicons name="chevron-down" size={16} color={palette.ink} />
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search workers, trades and locations"
          onPress={() => router.push('/(customer)/discover')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: palette.grey,
            borderRadius: 12,
            padding: 14,
            minHeight: 48,
          }}
        >
          <Ionicons name="search-outline" size={20} color={palette.ink} />
          <Text style={{ flex: 1, color: palette.ink }}>
            Search workers, skills or trades
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open worker filters"
          onPress={() => router.push('/(customer)/discover')}
          style={{
            backgroundColor: palette.yellow,
            borderRadius: 12,
            padding: 14,
            justifyContent: 'center',
            minWidth: 48,
          }}
        >
          <Ionicons name="options-outline" size={22} color={palette.ink} />
        </Pressable>
      </View>
      <View style={{ gap: 16 }}>
        <Text
          accessibilityRole="header"
          style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}
        >
          Find your crew
        </Text>
        {catalogue.isPending && (
          <Text accessibilityRole="progressbar">Loading trades…</Text>
        )}
        {catalogue.isError && (
          <View style={{ gap: 8 }}>
            <Text accessibilityRole="alert">
              Trades could not be loaded. Please try again.
            </Text>
            <Action
              label="Retry trades"
              variant="secondary"
              onPress={() => void catalogue.refetch()}
            />
          </View>
        )}
        {catalogue.isSuccess && catalogue.data.length === 0 && (
          <Text>No trades are available yet.</Text>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {catalogue.data?.map((trade) => (
            <Pressable
              key={trade.id}
              accessibilityRole="button"
              accessibilityLabel={`Find ${trade.name} workers`}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/discover',
                  params: { tradeId: trade.id },
                })
              }
              style={({ pressed }) => ({
                width: '30%',

                minWidth: 84,
                padding: 8,
                borderRadius: 12,
                borderWidth: 0,
                borderColor: palette.grey,
                backgroundColor: pressed ? palette.yellow : palette.white,
                alignItems: 'center',
                gap: 10,
              })}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: palette.grey,
                  borderWidth: 1,
                  borderColor: palette.grey,
                }}
              >
                <Image
                  source={getDefaultWorkerAvatar(trade.name)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Text
                style={{
                  color: palette.ink,
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {trade.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <GlassCard
        style={{
          backgroundColor: palette.yellow,
          borderColor: palette.yellow,
          gap: 12,
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              style={{ color: palette.ink, fontSize: 22, fontWeight: '700' }}
            >
              Get skilled labour near you
            </Text>
            <Text style={{ color: palette.ink }}>
              Local skills. Stronger projects.
            </Text>
          </View>
          <Image
            source={DASHBOARD_BANNER}
            style={{
              width: 88,
              height: 88,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: palette.white,
            }}
            resizeMode="cover"
            accessibilityLabel="Skilled labour worker banner"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a requirement"
          onPress={() => router.push('/(customer)/post')}
          style={{
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontWeight: '700', color: palette.ink }}>
            Post a requirement
          </Text>
          <Ionicons name="arrow-forward-circle" size={32} color={palette.ink} />
        </Pressable>
      </GlassCard>
      <Text
        accessibilityRole="header"
        style={{ color: palette.ink, fontSize: 20, fontWeight: '700' }}
      >
        Manage your work
      </Text>
      <Action
        label="My jobs and quotations"
        variant="secondary"
        onPress={() => router.push('/(customer)/requirements')}
      />
      <Action
        label="My bookings"
        variant="secondary"
        onPress={() => router.push('/(customer)/bookings')}
      />
      <Text style={{ color: palette.ink, fontSize: 14, lineHeight: 22 }}>
        Prices come from worker quotations. A booking is confirmed only after
        acceptance and availability checks.
      </Text>
    </Screen>
  );
}
