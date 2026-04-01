import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../theme';
import { Task, CATEGORIES, CATEGORY_COLORS } from '../types';
import TaskItem from '../components/TaskItem';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'all' | 'active' | 'done';

const PRIORITY_FILTERS = [
  { value: 'high',   label: 'High', color: theme.colors.priority.high },
  { value: 'medium', label: 'Med',  color: theme.colors.priority.medium },
  { value: 'low',    label: 'Low',  color: theme.colors.priority.low },
];

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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
    statusFilter !== 'all' || priorityFilter !== null || categoryFilter !== null;

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'active' && task.completed)  return false;
    if (statusFilter === 'done'   && !task.completed) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (categoryFilter && (task.category || 'Other') !== categoryFilter) return false;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  const doneCount   = tasks.filter(t =>  t.completed).length;

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <TaskItem
        task={item}
        onToggleComplete={() => toggleTaskCompletion(item.id)}
        onDelete={() => deleteTask(item.id)}
        drag={isFiltering ? undefined : drag}
        isActive={isActive}
        onEdit={() => handleEditTask(item.id)}
      />
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>

      {/* Stats bar */}
      {tasks.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            <Text style={styles.statsHighlight}>{activeCount}</Text> active
            {'  ·  '}
            <Text style={styles.statsDone}>{doneCount}</Text> done
          </Text>
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
              const color = CATEGORY_COLORS[cat];
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
                setStatusFilter('all');
                setPriorityFilter(null);
                setCategoryFilter(null);
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
                name="filter-outline"
                size={56}
                color={theme.colors.textMuted}
                style={{ opacity: 0.4, marginBottom: 16 }}
              />
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
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

      {isFiltering && (
        <View style={styles.dragHint}>
          <Text style={styles.dragHintText}>Clear filters to reorder</Text>
        </View>
      )}

      <Text style={styles.footer}>Powered by Dynamic.IO</Text>
      <FAB style={styles.fab} icon="plus" onPress={handleAddTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsBar: {
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
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    paddingBottom: 90,
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
  footer: {
    position: 'absolute',
    bottom: theme.spacing.md + 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: theme.colors.textMuted,
    opacity: 0.4,
    fontSize: 11,
  },
});
