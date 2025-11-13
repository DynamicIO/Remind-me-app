import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Task } from '../types';
import TaskItem from '../components/TaskItem';
import { RootStackParamList } from '../../App';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // Sort tasks by creation date in descending order (newest first)
        const sortedTasks = parsedTasks.sort((a: Task, b: Task) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = async (taskId: string) => {
    try {
      // Find the task to delete
      const taskToDelete = tasks.find(task => task.id === taskId);
      if (!taskToDelete) return;

      // Add deletedAt timestamp
      const deletedTask = {
        ...taskToDelete,
        deletedAt: new Date().toISOString(),
      };

      // Save to deleted tasks
      const storedDeletedTasks = await AsyncStorage.getItem('deletedTasks');
      const deletedTasks = storedDeletedTasks ? JSON.parse(storedDeletedTasks) : [];
      const updatedDeletedTasks = [deletedTask, ...deletedTasks];
      await AsyncStorage.setItem('deletedTasks', JSON.stringify(updatedDeletedTasks));

      // Remove from active tasks
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddTaskPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddTask');
  };

  return (
    <View style={styles.container}>
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks yet</Text>
          <Text style={styles.emptySubText}>Add your first task by tapping the + button</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggleComplete={() => toggleTaskCompletion(item.id)}
              onDelete={() => deleteTask(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <Text style={styles.footerText}>Powered by Dynamic.IO</Text>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddTaskPress}
      />
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
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
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