import { GlassBackdrop, PageHeading, GlassCard } from '../../components/theme';
import {
  JobLocationPicker,
  type JobLocation,
} from '../../location/JobLocationPicker';
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrades, postRequirement, Trade } from '../../api/marketplace';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useDraftNavigationGuard } from '../../navigation/DraftNavigationGuard';
import { apiJson } from '../../api/client';
import { z } from 'zod';
import { Action, Select, Input } from '../../components/ui';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tradeId: z.string().min(1, 'Please select a trade'),
  skillIds: z.array(z.string()).min(1, 'Please select at least one skill'),
  workerCount: z.number().min(1, 'Must need at least 1 worker'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  startsInDays: z.number().min(0, 'Start day must be valid'),
});

export default function PostRequirementScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const [generation, setGeneration] = useState(0);
  useFocusEffect(useCallback(() => () => setGeneration((v) => v + 1), []));
  return (
    <RequirementEditor
      key={`${editId ?? 'create'}:${generation}`}
      onDiscard={() => setGeneration((v) => v + 1)}
    />
  );
}
function RequirementEditor({ onDiscard }: { onDiscard: () => void }) {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const [baseline, setBaseline] = useState(
    JSON.stringify({
      title: '',
      description: '',
      tradeId: '',
      skillIds: [],
      workerCount: '1',
      location: null,
      startsInDays: '1',
      durationDays: '2',
      budget: '',
      startDate: '',
      startTime: '',
    }),
  );
  const saved = useRef(false);
  const [version, setVersion] = useState<number | null>(null);
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [draftError, setDraftError] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(!editId);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [workerCount, setWorkerCount] = useState('1');
  const [location, setLocation] = useState<JobLocation | null>(null);
  const [startsInDays, setStartsInDays] = useState('1'); // Tomorrow
  const [durationDays, setDurationDays] = useState('2');

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .catch(() =>
        setCatalogueError('Could not load trades. Please try again.'),
      );
  }, []);

  const snapshot = JSON.stringify({
    title,
    description,
    tradeId,
    skillIds,
    workerCount,
    location,
    startsInDays,
    durationDays,
    budget,
    startDate,
    startTime,
  });
  useEffect(() => {
    if (!editId) return;
    let active = true;
    apiJson<any>(`/api/v1/requirements/${editId}/draft`)
      .then((d) => {
        if (!active) return;
        const start = new Date(d.starts_at);
        const date = [
          start.getFullYear(),
          String(start.getMonth() + 1).padStart(2, '0'),
          String(start.getDate()).padStart(2, '0'),
        ].join('-');
        const time = [
          String(start.getHours()).padStart(2, '0'),
          String(start.getMinutes()).padStart(2, '0'),
          String(start.getSeconds()).padStart(2, '0'),
        ].join(':');
        setTitle(d.title);
        setDescription(d.description);
        setTradeId(d.category_id);
        setSkillIds(d.skill_ids);
        setWorkerCount(String(d.worker_count));
        setBudget(d.budget == null ? '' : String(d.budget));
        setVersion(d.edit_version);
        setStartDate(date);
        setStartTime(time);
        setDurationDays(
          String((new Date(d.ends_at).getTime() - start.getTime()) / 86400000),
        );
        const savedLoc = d.location_source
          ? {
              locationSource: d.location_source,
              locationStateId: d.location_state_id,
              locationCityId: d.location_city_id,
              lat: d.lat,
              lng: d.lng,
              city: d.city,
              district: d.district ?? '',
              stateCode: d.state_code,
            }
          : null;
        setLocation(savedLoc);
        setCurrentLocation(
          `${d.city}, ${d.state_code} · ${d.lat}, ${d.lng}. ${d.location_source ? 'Canonical location loaded' : 'Legacy location — canonical identity not confirmed. Confirm the job location below before saving.'}`,
        );
        setBaseline(
          JSON.stringify({
            title: d.title,
            description: d.description,
            tradeId: d.category_id,
            skillIds: d.skill_ids,
            workerCount: String(d.worker_count),
            location: savedLoc,
            startsInDays: '1',
            durationDays: String(
              (new Date(d.ends_at).getTime() - start.getTime()) / 86400000,
            ),
            budget: d.budget == null ? '' : String(d.budget),
            startDate: date,
            startTime: time,
          }),
        );
        setDraftLoaded(true);
      })
      .catch((e) => {
        if (active) setDraftError(e.message || 'Could not load draft.');
      });
    return () => {
      active = false;
    };
  }, [editId]);
  const leaveEditor = () => {
    if (editId)
      router.replace({ pathname: '/requirement/[id]', params: { id: editId } });
    else router.replace('/requirements');
  };
  const requestExit = useDraftNavigationGuard({
    dirty: draftLoaded && !!baseline && baseline !== snapshot,
    saved,
    discard: onDiscard,
    leave: leaveEditor,
  });
  const selectedTrade = trades.find((t) => t.id === tradeId);

  const toggleSkill = (id: string) => {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    try {
      if (!location) throw new Error('Choose and confirm the job location.');
      const parsedStartsIn = parseInt(startsInDays) || 0;
      const parsedDuration = Number(durationDays);

      const data = {
        title,
        description,
        tradeId,
        skillIds,
        workerCount: parseInt(workerCount) || 0,
        durationDays: parsedDuration,
        startsInDays: parsedStartsIn,
      };

      formSchema.parse(data);

      setLoading(true);
      const startsAt = editId
        ? new Date(`${startDate}T${startTime}`)
        : new Date();
      if (!editId) startsAt.setDate(startsAt.getDate() + parsedStartsIn);
      if (
        !Number.isFinite(startsAt.getTime()) ||
        startsAt.getTime() <= Date.now()
      )
        throw new Error('Choose a valid future start date and time.');
      const endsAt = new Date(startsAt);
      endsAt.setTime(startsAt.getTime() + parsedDuration * 86400000);

      const payload = {
        title,
        description,
        tradeId,
        skillIds,
        workerCount: data.workerCount,
        ...location,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      };

      if (editId) {
        if (budget && (!Number.isFinite(Number(budget)) || Number(budget) <= 0))
          throw new Error('Enter a positive budget.');
        await apiJson(`/api/v1/requirements/${editId}/draft`, {
          method: 'PUT',
          body: JSON.stringify({
            form: payload,
            expectedVersion: version,
            budget: budget ? Number(budget) : null,
          }),
        });
        setBaseline(snapshot);
        saved.current = true;
        router.replace({
          pathname: '/requirement/[id]',
          params: { id: editId, refresh: String(Date.now()) },
        });
        return;
      }
      await postRequirement(payload);
      saved.current = true;
      Alert.alert('Success', 'Requirement posted successfully', [
        { text: 'OK', onPress: () => router.push('/requirements') },
      ]);
    } catch (e: any) {
      if (e && e.name === 'ZodError') {
        Alert.alert(
          'Validation Error',
          e.issues?.[0]?.message || 'Invalid input',
        );
      } else {
        Alert.alert('Error', e.message || 'Failed to post requirement');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
      >
        {editId && (
          <Action
            label="Back"
            variant="quiet"
            onPress={() => requestExit(leaveEditor)}
          />
        )}
        <PageHeading
          inset={8}
          title={editId ? 'Edit Draft' : 'Post a job'}
          subtitle="Tell workers what you need."
        />
        <GlassCard style={{ padding: 16, gap: 12 }}>
          {!!draftError && (
            <Text accessibilityRole="alert" className="text-rose-700">
              {draftError}
            </Text>
          )}
          {editId && !draftLoaded && (
            <Text className="text-ink">Loading draft…</Text>
          )}
          {!!currentLocation && (
            <Text style={{ fontSize: 11, color: '#466E68' }}>
              {currentLocation}
            </Text>
          )}
          <Input
            label="Job title"
            accessibilityLabel="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Carpentry for kitchen cabinets"
          />
          <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
          >
            <View style={{ flex: 1 }}>
              <Select
                label="Trade required"
                searchable
                value={tradeId}
                options={trades.map((t) => ({ value: t.id, label: t.name }))}
                onChange={(value) => {
                  setTradeId(value);
                  setSkillIds([]);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Workers needed"
                accessibilityLabel="Workers needed"
                value={workerCount}
                onChangeText={setWorkerCount}
                keyboardType="number-pad"
              />
            </View>
          </View>
          {!!catalogueError && (
            <>
              <Text accessibilityRole="alert" className="text-rose-700">
                {catalogueError}
              </Text>
              <Action
                label="Retry trades"
                variant="secondary"
                onPress={() => {
                  setCatalogueError('');
                  getTrades()
                    .then(setTrades)
                    .catch(() =>
                      setCatalogueError(
                        'Could not load trades. Please try again.',
                      ),
                    );
                }}
              />
            </>
          )}
          {!!selectedTrade?.skills?.length && (
            <View style={{ gap: 7 }}>
              <Text style={{ fontSize: 12, color: '#145C58' }}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {selectedTrade.skills.map((skill) => (
                  <Pressable
                    key={skill.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={skill.name}
                    accessibilityState={{
                      checked: skillIds.includes(skill.id),
                    }}
                    onPress={() => toggleSkill(skill.id)}
                    style={{
                      minHeight: 40,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: 'white',
                      backgroundColor: skillIds.includes(skill.id)
                        ? 'rgba(255,211,54,0.65)'
                        : 'rgba(255,255,255,0.22)',
                    }}
                  >
                    <Text
                      style={{
                        color: '#145C58',
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {skill.name}
                      {skillIds.includes(skill.id) ? '  ×' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {draftLoaded && (
            <JobLocationPicker
              initialValue={location}
              onChange={setLocation}
              compact
            />
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label={editId ? 'Start date (YYYY-MM-DD)' : 'Start in (days)'}
                accessibilityLabel={editId ? 'Start date' : 'Start in days'}
                value={editId ? startDate : startsInDays}
                onChangeText={editId ? setStartDate : setStartsInDays}
                keyboardType={editId ? 'default' : 'number-pad'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Duration (days)"
                accessibilityLabel="Duration in days"
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
              />
            </View>
          </View>
          {editId && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Start time"
                  accessibilityLabel="Start time"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Budget (optional)"
                  accessibilityLabel="Budget"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}
          <Input
            label="Description"
            accessibilityLabel="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the job in detail"
            multiline
            numberOfLines={3}
            style={{ minHeight: 55 }}
          />
          <Action
            label={editId ? 'Save draft' : 'Post Requirement'}
            disabled={!draftLoaded || !!draftError}
            loading={loading}
            onPress={handleSubmit}
          />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
