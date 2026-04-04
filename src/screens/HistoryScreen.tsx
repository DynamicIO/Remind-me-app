import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Task } from '../types';
import TaskItem from '../components/TaskItem';

export default function HistoryScreen() {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  useFocusEffect(
    React.useCallback(() => { loadDeletedTasks(); }, [])
  );

  const loadDeletedTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('deletedTasks');
      if (stored) {
        const parsed: Task[] = JSON.parse(stored);
        const sorted = parsed.sort((a, b) => {
          const da = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
          const db = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
          return db - da;
        });
        setDeletedTasks(sorted);
      }
    } catch (e) {
      console.error('Error loading deleted tasks:', e);
    }
  };

  const restoreTask = async (taskId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const taskToRestore = deletedTasks.find(t => t.id === taskId);
      if (!taskToRestore) return;
      const { deletedAt, ...restored } = taskToRestore;
      const storedTasks = await AsyncStorage.getItem('tasks');
      const tasks = storedTasks ? JSON.parse(storedTasks) : [];
      await AsyncStorage.setItem('tasks', JSON.stringify([...tasks, restored]));
      const updated = deletedTasks.filter(t => t.id !== taskId);
      setDeletedTasks(updated);
      await AsyncStorage.setItem('deletedTasks', JSON.stringify(updated));
    } catch (e) {
      console.error('Error restoring task:', e);
    }
  };

  const permanentlyDelete = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const updated = deletedTasks.filter(t => t.id !== taskId);
    setDeletedTasks(updated);
    await AsyncStorage.setItem('deletedTasks', JSON.stringify(updated));
  };

  const clearHistory = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeletedTasks([]);
    await AsyncStorage.removeItem('deletedTasks');
  };

  const formatAge = (dateString?: string) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (h < 1)  return 'Just now';
    if (h < 24) return `${h}h ago`;
    if (d === 1) return 'Yesterday';
    if (d < 7)  return `${d} days ago`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {deletedTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="delete-empty-outline"
            size={72}
            color={theme.colors.textMuted}
            style={{ opacity: 0.3, marginBottom: 20 }}
          />
          <Text style={styles.emptyTitle}>No deleted tasks</Text>
          <Text style={styles.emptySubtitle}>Deleted tasks will appear here</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerCount}>
              {deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={clearHistory} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={deletedTasks}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <TaskItem
                  task={item}
                  onToggleComplete={() => {}}
                  onDelete={() => permanentlyDelete(item.id)}
                />
                <View style={styles.historyMeta}>
                  <View style={styles.historyMetaLeft}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={12}
                      color={theme.colors.textMuted}
                    />
                    <Text style={styles.historyDate}>
                      {formatAge(item.deletedAt)}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => restoreTask(item.id)}
                    style={styles.restoreBtn}
                    contentStyle={styles.restoreBtnContent}
                    labelStyle={styles.restoreBtnLabel}
                    compact
                  >
                    Restore
                  </Button>
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    opacity: 0.65,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCount: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearAllText: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '700',
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  historyCard: {
    marginBottom: theme.spacing.md,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: 6,
  },
  historyMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  restoreBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  restoreBtnContent: {
    paddingHorizontal: 4,
  },
  restoreBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
