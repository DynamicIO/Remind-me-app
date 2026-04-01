import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Task, CATEGORIES, CATEGORY_COLORS } from '../types';
import { RootStackParamList } from '../../App';

type Priority = 'low' | 'medium' | 'high';

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: string }[] = [
  { value: 'low',    label: 'Low',    icon: 'arrow-down-circle-outline' },
  { value: 'medium', label: 'Medium', icon: 'minus-circle-outline' },
  { value: 'high',   label: 'High',   icon: 'arrow-up-circle-outline' },
];

export default function AddTaskScreen() {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<Priority>('medium');
  const [category,    setCategory]    = useState<string | null>(null);

  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTask'>>();
  const taskId    = route.params?.taskId;
  const isEditing = !!taskId;

  useEffect(() => {
    if (isEditing) {
      navigation.setOptions({ title: 'Edit Task' });
      loadTask();
    }
  }, [isEditing]);

  const loadTask = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const tasks: Task[] = JSON.parse(stored);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setTitle(task.title);
          setDescription(task.description || '');
          setPriority(task.priority);
          setCategory(task.category || null);
        }
      }
    } catch (e) {
      console.error('Error loading task:', e);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const stored = await AsyncStorage.getItem('tasks');
      const tasks: Task[] = stored ? JSON.parse(stored) : [];

      if (isEditing) {
        const updated = tasks.map(t =>
          t.id === taskId
            ? { ...t, title: title.trim(), description: description.trim() || undefined, priority, category: category || undefined }
            : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      } else {
        const newTask: Task = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category: category || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('tasks', JSON.stringify([...tasks, newTask]));
      }
      navigation.goBack();
    } catch (e) {
      console.error('Error saving task:', e);
    }
  };

  const priorityColor = theme.colors.priority[priority];

  const inputTheme = {
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.surfaceVariant,
      onSurface: theme.colors.text,
      onSurfaceVariant: theme.colors.textMuted,
      outline: theme.colors.border,
    },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title input */}
        <View style={styles.section}>
          <TextInput
            label="Task title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
            textColor={theme.colors.text}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
            theme={inputTheme}
            autoFocus={!isEditing}
          />
          <TextInput
            label="Notes (optional)"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.notesInput]}
            mode="outlined"
            multiline
            numberOfLines={3}
            textColor={theme.colors.text}
            outlineColor={theme.colors.border}
            activeOutlineColor={theme.colors.primary}
            theme={inputTheme}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map(opt => {
              const color  = theme.colors.priority[opt.value];
              const active = priority === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priorityCard,
                    active
                      ? { backgroundColor: color + '22', borderColor: color }
                      : { borderColor: theme.colors.border },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority(opt.value);
                  }}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={22}
                    color={active ? color : theme.colors.textMuted}
                  />
                  <Text style={[styles.priorityCardText, { color: active ? color : theme.colors.textMuted }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[styles.priorityActiveDot, { backgroundColor: color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category <Text style={styles.sectionLabelOptional}>(optional)</Text></Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const color  = CATEGORY_COLORS[cat];
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    active
                      ? { backgroundColor: color, borderColor: color }
                      : { borderColor: color + '70' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(prev => prev === cat ? null : cat);
                  }}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: active ? '#0D0D12' : color },
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save button */}
        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={!title.trim()}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.saveButtonContent}
            labelStyle={styles.saveButtonLabel}
          >
            {isEditing ? 'Save Changes' : 'Add Task'}
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
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    paddingLeft: 2,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  notesInput: {
    minHeight: 80,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  priorityCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
  },
  priorityCardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabelOptional: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.textMuted,
    opacity: 0.6,
    textTransform: 'none',
    letterSpacing: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: theme.borderRadius.lg,
  },
  saveButtonContent: {
    paddingVertical: 4,
  },
  saveButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
