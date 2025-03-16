import { differenceInMinutes } from 'date-fns';
import type { Task } from '../types/app';

// Keep track of notifications that have been sent
const sentNotifications = new Set<string>();

let notificationPermission: NotificationPermission | null = null;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (notificationPermission === null) {
    notificationPermission = await Notification.requestPermission();
  }

  return notificationPermission === 'granted';
}

function getNotificationKey(taskId: string, minutesUntilDue: number): string {
  return `${taskId}-${minutesUntilDue}`;
}

export function checkTaskNotifications(tasks: Task[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Clean up old notification records
  sentNotifications.clear();

  tasks.forEach(task => {
    if (!task.completed && task.due_date) {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const minutesUntilDue = differenceInMinutes(dueDate, now);

      // Notification thresholds (in minutes)
      const thresholds = [60, 30, 15, 5, 1];
      
      // Find the next applicable threshold
      const nextThreshold = thresholds.find(t => minutesUntilDue > 0 && minutesUntilDue <= t);
      
      if (nextThreshold) {
        const notificationKey = getNotificationKey(task.id, nextThreshold);
        
        // Only send if we haven't sent this notification yet
        if (!sentNotifications.has(notificationKey)) {
          sentNotifications.add(notificationKey);
          
          let timeText = `${minutesUntilDue} minutes`;
          if (minutesUntilDue === 1) timeText = '1 minute';
          else if (minutesUntilDue === 60) timeText = '1 hour';
          else if (minutesUntilDue < 1) timeText = 'less than a minute';
          
          const notification = new Notification(`Task Due ${timeText === '1 hour' ? 'in an Hour' : 'Soon'}`, {
            body: `"${task.title}" is due in ${timeText}`,
            icon: '/vite.svg',
            tag: notificationKey,
            requireInteraction: true, // Keep notification visible until user interacts with it
          });

          notification.onclick = () => {
            window.focus();
          };
        }
      }
    }
  });
}