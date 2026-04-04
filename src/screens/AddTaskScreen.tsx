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
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';
import { Task, CATEGORIES, CATEGORY_COLORS, formatDueDate } from '../types';
import { RootStackParamList } from '../../App';
import { scheduleTaskReminder, cancelTaskReminder } from '../notifications';

type Priority = 'low' | 'medium' | 'high';

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: string }[] = [
  { value: 'low',    label: 'Low',    icon: 'arrow-down-circle-outline' },
  { value: 'medium', label: 'Medium', icon: 'minus-circle-outline' },
  { value: 'high',   label: 'High',   icon: 'arrow-up-circle-outline' },
];

export default function AddTaskScreen() {
  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [priority,       setPriority]       = useState<Priority>('medium');
  const [category,       setCategory]       = useState<string | null>(null);
  const [dueDate,        setDueDate]        = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode,     setPickerMode]     = useState<'date' | 'time'>('date');

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
          setDueDate(task.dueDate ? new Date(task.dueDate) : null);
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
        const oldTask = tasks.find(t => t.id === taskId);
        if (oldTask?.dueDate) await cancelTaskReminder(taskId!);

        let notificationId: string | undefined;
        if (dueDate) {
          const id = await scheduleTaskReminder(taskId!, title.trim(), dueDate.toISOString());
          notificationId = id ?? undefined;
        }

        const updated = tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category: category || undefined,
                dueDate: dueDate?.toISOString(),
                notificationId,
              }
            : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      } else {
        const newTaskId = Date.now().toString();
        let notificationId: string | undefined;
        if (dueDate) {
          const id = await scheduleTaskReminder(newTaskId, title.trim(), dueDate.toISOString());
          notificationId = id ?? undefined;
        }

        const newTask: Task = {
          id: newTaskId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category: category || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: dueDate?.toISOString(),
          notificationId,
        };
        await AsyncStorage.setItem('tasks', JSON.stringify([...tasks, newTask]));
      }
      navigation.goBack();
    } catch (e) {
      console.error('Error saving task:', e);
    }
  };

  const inputTheme = {
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.surfaceVariant,
      onSurface: theme.colors.text,
      onSurfaceVariant: theme.colors.textMuted,
      outline: theme.colors.border,
    },
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
          <Text style={styles.sectionLabel}>
            Category <Text style={styles.sectionLabelOptional}>(optional)</Text>
          </Text>
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

        {/* Due Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Reminder <Text style={styles.sectionLabelOptional}>(optional)</Text>
          </Text>

          {!dueDate ? (
            <TouchableOpacity
              style={styles.dueDateRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const defaultDate = new Date();
                defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
                setDueDate(defaultDate);
                setPickerMode('date');
                setShowDatePicker(true);
                setShowTimePicker(false);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="bell-plus-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.dueDateText}>Set date & time</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    showDatePicker && pickerMode === 'date' && styles.dateTimeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (showDatePicker && pickerMode === 'date') {
                      setShowDatePicker(false);
                    } else {
                      setPickerMode('date');
                      setShowDatePicker(true);
                      setShowTimePicker(false);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={16}
                    color={showDatePicker && pickerMode === 'date' ? theme.colors.primary : theme.colors.text}
                  />
                  <Text style={[
                    styles.dateTimeButtonText,
                    showDatePicker && pickerMode === 'date' && { color: theme.colors.primary },
                  ]}>
                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    showTimePicker && pickerMode === 'time' && styles.dateTimeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (showTimePicker && pickerMode === 'time') {
                      setShowTimePicker(false);
                    } else {
                      setPickerMode('time');
                      setShowTimePicker(true);
                      setShowDatePicker(false);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={showTimePicker && pickerMode === 'time' ? theme.colors.primary : theme.colors.text}
                  />
                  <Text style={[
                    styles.dateTimeButtonText,
                    showTimePicker && pickerMode === 'time' && { color: theme.colors.primary },
                  ]}>
                    {dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeClear}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDueDate(null);
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {showDatePicker && pickerMode === 'date' && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selected) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                      if (event.type === 'set' && selected) {
                        const merged = new Date(dueDate);
                        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                        setDueDate(merged);
                        setPickerMode('time');
                        setShowTimePicker(true);
                      }
                    } else if (selected) {
                      const merged = new Date(dueDate);
                      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                      setDueDate(merged);
                    }
                  }}
                  minimumDate={today}
                  themeVariant="dark"
                  accentColor={theme.colors.primary}
                  style={styles.datePicker}
                />
              )}

              {showTimePicker && pickerMode === 'time' && (
                <DateTimePicker
                  value={dueDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selected) => {
                    if (Platform.OS === 'android') {
                      setShowTimePicker(false);
                      if (event.type === 'set' && selected) {
                        const merged = new Date(dueDate);
                        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                        setDueDate(merged);
                      }
                    } else if (selected) {
                      const merged = new Date(dueDate);
                      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                      setDueDate(merged);
                    }
                  }}
                  themeVariant="dark"
                  accentColor={theme.colors.primary}
                  style={styles.datePicker}
                />
              )}
            </View>
          )}
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
  sectionLabelOptional: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.textMuted,
    opacity: 0.6,
    textTransform: 'none',
    letterSpacing: 0,
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
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dueDateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dateTimeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryDim,
  },
  dateTimeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dateTimeClear: {
    padding: 6,
  },
  datePicker: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
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
