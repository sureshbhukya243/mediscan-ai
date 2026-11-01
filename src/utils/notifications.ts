import { soundManager } from './audio';
import { ScheduleItem } from '../types/medical';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function sendMedicineNotification(scheduleItem: ScheduleItem) {
  // Always play gentle reminder chime
  soundManager.playChime();

  if ('Notification' in window && Notification.permission === 'granted') {
    const title = `💊 Time for ${scheduleItem.medicineName}`;
    const options: NotificationOptions = {
      body: `Dosage: ${scheduleItem.dosage}\nInstructions: ${scheduleItem.instructions}`,
      icon: '/favicon.ico',
      tag: `med-reminder-${scheduleItem.medicineName}-${scheduleItem.time}`,
      requireInteraction: true,
    };

    try {
      new Notification(title, options);
    } catch (e) {
      console.warn('Desktop notification failed:', e);
    }
  }
}
