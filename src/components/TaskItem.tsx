import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Task, CATEGORY_COLORS } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
  drag?: () => void;
  isActive?: boolean;
  onEdit?: () => void;
}

export default function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  drag,
  isActive,
  onEdit,
}: TaskItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':   return theme.colors.priority.high;
      case 'medium': return theme.colors.priority.medium;
      case 'low':    return theme.colors.priority.low;
      default:       return theme.colors.primary;
    }
  };

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onToggleComplete();
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    onDelete();
  };

  const renderLeftActions = () => (
    <TouchableOpacity
      style={[styles.swipePanel, styles.donePanel]}
      onPress={handleToggleComplete}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons
        name={task.completed ? 'undo-variant' : 'check-bold'}
        size={22}
        color="#fff"
      />
      <Text style={styles.swipePanelText}>{task.completed ? 'Undo' : 'Done'}</Text>
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.swipePanel, styles.deletePanel]}
      onPress={handleDelete}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
      <Text style={styles.swipePanelText}>Delete</Text>
    </TouchableOpacity>
  );

  const priorityColor = getPriorityColor();
  const categoryColor = task.category ? (CATEGORY_COLORS[task.category] ?? theme.colors.textMuted) : null;

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={drag ? renderLeftActions : undefined}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
      overshootLeft={false}
      overshootRight={false}
    >
      <View style={[styles.card, isActive && styles.cardActive]}>
        {/* Priority accent bar */}
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

        <TouchableOpacity
          style={styles.content}
          onPress={handleToggleComplete}
          activeOpacity={0.75}
        >
          {drag && (
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              style={styles.dragHandle}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons
                name="drag-vertical"
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          )}

          {/* Circular checkbox */}
          <TouchableOpacity style={styles.checkboxWrap} onPress={handleToggleComplete}>
            <View
              style={[
                styles.checkbox,
                { borderColor: priorityColor },
                task.completed && { backgroundColor: priorityColor },
              ]}
            >
              {task.completed && (
                <MaterialCommunityIcons name="check" size={13} color="#0D0D12" />
              )}
            </View>
          </TouchableOpacity>

          {/* Text block */}
          <View style={styles.textBlock}>
            <Text
              style={[styles.title, task.completed && styles.titleDone]}
              numberOfLines={1}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {task.description}
              </Text>
            ) : null}

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: priorityColor + '22' }]}>
                <Text style={[styles.badgeText, { color: priorityColor }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>

              {categoryColor && task.category ? (
                <View style={[styles.badge, { backgroundColor: categoryColor + '22' }]}>
                  <Text style={[styles.badgeText, { color: categoryColor }]}>
                    {task.category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {drag && onEdit ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={17}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 10,
    ...theme.shadow.sm,
  },
  cardActive: {
    ...theme.shadow.lg,
    opacity: 0.9,
  },
  priorityBar: {
    width: 4,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 10,
    paddingLeft: 6,
  },
  dragHandle: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxWrap: {
    padding: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.4,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 6,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  editBtn: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipePanel: {
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    marginBottom: 10,
    gap: 4,
  },
  donePanel: {
    backgroundColor: '#2E7D4F',
    marginRight: 6,
  },
  deletePanel: {
    backgroundColor: '#B71C1C',
    marginLeft: 6,
  },
  swipePanelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
