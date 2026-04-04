import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: true,
      },
    });

    return status === 'granted';
  } catch (e) {
    console.warn('Notification permission error:', e);
    return false;
  }
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: string,
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notifications not permitted — skipping reminder');
      return null;
    }

    const date = new Date(dueDate);
    const secondsFromNow = Math.floor((date.getTime() - Date.now()) / 1000);
    if (secondsFromNow <= 10) return null;

    const id = await Notifications.scheduleNotificationAsync({
      identifier: `task-${taskId}`,
      content: {
        title: 'Task reminder',
        body: title,
        data: { taskId },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });

    console.log(`Notification scheduled: "${title}" in ${secondsFromNow}s (id: ${id})`);
    return id;
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
    return null;
  }
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`);
  } catch {
    // ignore
  }
}
