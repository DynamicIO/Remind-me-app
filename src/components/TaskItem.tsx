import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox, IconButton } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return theme.colors.priority.high;
      case 'medium':
        return theme.colors.priority.medium;
      case 'low':
        return theme.colors.priority.low;
      default:
        return theme.colors.primary;
    }
  };

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleComplete();
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderLeftColor: getPriorityColor() }
      ]}
      onPress={handleToggleComplete}
    >
      <View style={styles.content}>
        <Checkbox
          status={task.completed ? 'checked' : 'unchecked'}
          onPress={handleToggleComplete}
          color={theme.colors.primary}
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              task.completed && styles.completedText
            ]}
          >
            {task.title}
          </Text>
          <Text style={styles.priority}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </Text>
        </View>
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          size={20}
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  title: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  priority: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.7,
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
}); 