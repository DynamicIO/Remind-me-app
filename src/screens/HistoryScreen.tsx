import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Task } from '../types';
import TaskItem from '../components/TaskItem';

export default function HistoryScreen() {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadDeletedTasks();
    }, [])
  );

  const loadDeletedTasks = async () => {
    try {
      const storedDeletedTasks = await AsyncStorage.getItem('deletedTasks');
      if (storedDeletedTasks) {
        const parsedTasks = JSON.parse(storedDeletedTasks);
        // Sort by deletion date (newest first)
        const sortedTasks = parsedTasks.sort((a: Task, b: Task) => {
          const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
          const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
          return dateB - dateA;
        });
        setDeletedTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Error loading deleted tasks:', error);
    }
  };

  const restoreTask = async (taskId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Find the task to restore
      const taskToRestore = deletedTasks.find(task => task.id === taskId);
      if (!taskToRestore) return;

      // Remove deletedAt property
      const { deletedAt, ...restoredTask } = taskToRestore;

      // Add back to active tasks
      const storedTasks = await AsyncStorage.getItem('tasks');
      const tasks = storedTasks ? JSON.parse(storedTasks) : [];
      const updatedTasks = [...tasks, restoredTask];
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));

      // Remove from deleted tasks
      const updatedDeletedTasks = deletedTasks.filter(task => task.id !== taskId);
      setDeletedTasks(updatedDeletedTasks);
      await AsyncStorage.setItem('deletedTasks', JSON.stringify(updatedDeletedTasks));
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const permanentlyDelete = async (taskId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      const updatedDeletedTasks = deletedTasks.filter(task => task.id !== taskId);
      setDeletedTasks(updatedDeletedTasks);
      await AsyncStorage.setItem('deletedTasks', JSON.stringify(updatedDeletedTasks));
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    }
  };

  const clearHistory = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      setDeletedTasks([]);
      await AsyncStorage.removeItem('deletedTasks');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatDeletedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {deletedTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No deleted tasks</Text>
          <Text style={styles.emptySubText}>Deleted tasks will appear here</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>{deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}</Text>
            <Button
              mode="text"
              onPress={clearHistory}
              textColor={theme.colors.error}
              style={styles.clearButton}
            >
              Clear All
            </Button>
          </View>
          <FlatList
            data={deletedTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.taskWrapper}>
                <View style={styles.taskItemContainer}>
                  <TaskItem
                    task={item}
                    onToggleComplete={() => {}}
                    onDelete={() => permanentlyDelete(item.id)}
                  />
                </View>
                <View style={styles.actionsContainer}>
                  <Text style={styles.deletedDate}>
                    Deleted {formatDeletedDate(item.deletedAt)}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => restoreTask(item.id)}
                    style={styles.restoreButton}
                    compact
                  >
                    Restore
                  </Button>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
      <Text style={styles.footerText}>Powered by Dynamic.IO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubText: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerText: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
  },
  clearButton: {
    marginRight: -theme.spacing.sm,
  },
  taskWrapper: {
    marginBottom: theme.spacing.md,
  },
  taskItemContainer: {
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  deletedDate: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.5,
  },
  restoreButton: {
    backgroundColor: theme.colors.primary,
  },
  footerText: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: theme.colors.text,
    opacity: 0.5,
    fontSize: 12,
  },
});

