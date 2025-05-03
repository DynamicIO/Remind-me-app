import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Task } from '../types';
import { RootStackParamList } from '../../App';

type Priority = 'low' | 'medium' | 'high';

export default function AddTaskScreen() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const navigation = useNavigation();

  const handleAddTask = async () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingTasks = await AsyncStorage.getItem('tasks');
      const tasks = existingTasks ? JSON.parse(existingTasks) : [];
      const updatedTasks = [...tasks, newTask];
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <TextInput
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
            theme={{
              colors: {
                primary: theme.colors.primary,
                background: theme.colors.surface,
                text: theme.colors.text,
                placeholder: theme.colors.text,
                onSurface: theme.colors.text,
              },
            }}
            textColor={theme.colors.text}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <View style={styles.priorityContainer}>
            <SegmentedButtons
              value={priority}
              onValueChange={(value: Priority) => setPriority(value)}
              buttons={[
                {
                  value: 'low',
                  label: 'Low',
                  style: {
                    backgroundColor: priority === 'low' ? theme.colors.priority.low : 'transparent',
                  },
                },
                {
                  value: 'medium',
                  label: 'Medium',
                  style: {
                    backgroundColor: priority === 'medium' ? theme.colors.priority.medium : 'transparent',
                  },
                },
                {
                  value: 'high',
                  label: 'High',
                  style: {
                    backgroundColor: priority === 'high' ? theme.colors.priority.high : 'transparent',
                  },
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleAddTask}
            style={styles.button}
            disabled={!title.trim()}
          >
            Add Task
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing.md,
    flex: 1,
  },
  input: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  priorityContainer: {
    marginBottom: theme.spacing.xl,
  },
  segmentedButtons: {
    marginTop: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
}); 