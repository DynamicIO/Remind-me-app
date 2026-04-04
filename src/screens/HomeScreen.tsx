import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Animated as RNAnimated,
  Easing as RNEasing,
  Dimensions,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { theme } from '../theme';
import { Task, CATEGORIES, CATEGORY_COLORS } from '../types';
import TaskItem from '../components/TaskItem';
import { RootStackParamList } from '../../App';
import { cancelTaskReminder } from '../notifications';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'all' | 'active' | 'done';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PRIORITY_FILTERS = [
  { value: 'high',   label: 'High', color: theme.colors.priority.high },
  { value: 'medium', label: 'Med',  color: theme.colors.priority.medium },
  { value: 'low',    label: 'Low',  color: theme.colors.priority.low },
];

// ─── Animated entrance wrapper for each task row ─────────────────────────────

function AnimatedTaskRow({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    const delay = Math.min(index, 10) * 45;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 270 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 270, easing: Easing.out(Easing.quad) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showConfetti,   setShowConfetti]   = useState(false);

  // Progress bar animation (RN Animated for non-transform width)
  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const prevAllDoneRef = useRef(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  const navigation = useNavigation<NavProp>();

  useFocusEffect(
    React.useCallback(() => { loadTasks(); }, [])
  );

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) setTasks(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading tasks:', e);
    }
  };

  const saveTasks = async (updated: Task[]) => {
    await AsyncStorage.setItem('tasks', JSON.stringify(updated));
  };

  // Animate progress bar whenever counts change
  useEffect(() => {
    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    const target = total > 0 ? done / total : 0;
    RNAnimated.timing(progressAnim, {
      toValue: target,
      duration: 600,
      easing: RNEasing.out(RNEasing.quad),
      useNativeDriver: false,
    }).start();
  }, [tasks]);

  // Detect transition to 100% completion and fire confetti
  useEffect(() => {
    if (tasks.length === 0) {
      prevAllDoneRef.current = false;
      return;
    }
    const allDone = tasks.every(t => t.completed);
    if (allDone && !prevAllDoneRef.current) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevAllDoneRef.current = allDone;
  }, [tasks]);

  const toggleTaskCompletion = async (taskId: string) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    await saveTasks(updated);
  };

  const deleteTask = async (taskId: string) => {
    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) return;
      if (taskToDelete.dueDate) await cancelTaskReminder(taskId);
      const deletedTask = { ...taskToDelete, deletedAt: new Date().toISOString() };
      const storedDeleted = await AsyncStorage.getItem('deletedTasks');
      const deletedTasks = storedDeleted ? JSON.parse(storedDeleted) : [];
      await AsyncStorage.setItem('deletedTasks', JSON.stringify([deletedTask, ...deletedTasks]));
      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      await saveTasks(updated);
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  const handleDragEnd = async ({ data }: { data: Task[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks(data);
    await saveTasks(data);
  };

  const handleAddTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddTask');
  };

  const handleEditTask = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddTask', { taskId });
  };

  const isFiltering =
    statusFilter !== 'all' || priorityFilter !== null || categoryFilter !== null || searchQuery.trim().length > 0;

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'active' && task.completed)  return false;
    if (statusFilter === 'done'   && !task.completed) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (categoryFilter && (task.category || 'Other') !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const inTitle = task.title.toLowerCase().includes(q);
      const inDesc  = task.description?.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  const doneCount   = tasks.filter(t =>  t.completed).length;

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <AnimatedTaskRow index={getIndex?.() ?? 0}>
        <TaskItem
          task={item}
          onToggleComplete={() => toggleTaskCompletion(item.id)}
          onDelete={() => deleteTask(item.id)}
          drag={isFiltering ? undefined : drag}
          isActive={isActive}
          onEdit={() => handleEditTask(item.id)}
        />
      </AnimatedTaskRow>
    </ScaleDecorator>
  );

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, SCREEN_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <View style={styles.progressTrack}>
          <RNAnimated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      )}

      {/* Stats bar */}
      {tasks.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            <Text style={styles.statsHighlight}>{activeCount}</Text> active
            {'  ·  '}
            <Text style={styles.statsDone}>{doneCount}</Text> done
          </Text>
          {tasks.length > 0 && (
            <Text style={styles.statsPercent}>
              {tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%
            </Text>
          )}
        </View>
      )}

      {/* Search bar */}
      {tasks.length > 0 && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            selectionColor={theme.colors.primary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearchQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter bar */}
      {tasks.length > 0 && (
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {/* Status */}
            {(['all', 'active', 'done'] as StatusFilter[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  statusFilter === s && styles.chipActiveNeutral,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(s);
                }}
              >
                <Text style={[
                  styles.chipText,
                  statusFilter === s && styles.chipTextActiveNeutral,
                ]}>
                  {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Done'}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.chipDivider} />

            {/* Priority */}
            {PRIORITY_FILTERS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.chip,
                  priorityFilter === p.value
                    ? { backgroundColor: p.color, borderColor: p.color }
                    : { borderColor: p.color + '60' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPriorityFilter(prev => prev === p.value ? null : p.value);
                }}
              >
                <Text style={[
                  styles.chipText,
                  { color: priorityFilter === p.value ? '#0D0D12' : p.color },
                  priorityFilter === p.value && { fontWeight: '700' },
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.chipDivider} />

            {/* Categories */}
            {CATEGORIES.map(cat => {
              const color  = CATEGORY_COLORS[cat];
              const active = categoryFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: color, borderColor: color }
                      : { borderColor: color + '60' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategoryFilter(prev => prev === cat ? null : cat);
                  }}
                >
                  <Text style={[
                    styles.chipText,
                    { color: active ? '#0D0D12' : color },
                    active && { fontWeight: '700' },
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isFiltering && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStatusFilter('all');
                setPriorityFilter(null);
                setCategoryFilter(null);
                setSearchQuery('');
              }}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List / Empty state */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          {tasks.length === 0 ? (
            <>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={72}
                color={theme.colors.primary}
                style={{ opacity: 0.25, marginBottom: 20 }}
              />
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add your first task
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name={searchQuery ? 'magnify' : 'filter-outline'}
                size={56}
                color={theme.colors.textMuted}
                style={{ opacity: 0.4, marginBottom: 16 }}
              />
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? `No tasks matching "${searchQuery}"` : 'Try adjusting your filters'}
              </Text>
            </>
          )}
        </View>
      ) : (
        <DraggableFlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.list}
        />
      )}

      {isFiltering && filteredTasks.length > 0 && (
        <View style={styles.dragHint}>
          <Text style={styles.dragHintText}>Clear filters to reorder</Text>
        </View>
      )}

      <FAB style={styles.fab} icon="plus" onPress={handleAddTask} />

      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          autoStart
          fadeOut
          fallSpeed={3000}
          explosionSpeed={350}
          colors={[
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.priority.high,
            theme.colors.priority.medium,
            '#FBBF24',
            '#C084FC',
          ]}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 4,
  },
  statsText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  statsHighlight: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statsDone: {
    color: theme.colors.priority.low,
    fontWeight: '700',
  },
  statsPercent: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: 6,
  },
  filterBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 6,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActiveNeutral: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  chipTextActiveNeutral: {
    color: '#0D0D12',
    fontWeight: '700',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
    marginHorizontal: 2,
  },
  clearBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    marginRight: theme.spacing.sm,
  },
  clearBtnText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 140,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  dragHint: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dragHintText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
