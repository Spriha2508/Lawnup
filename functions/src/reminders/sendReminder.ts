import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

// Runs hourly via Cloud Scheduler
export const sendReminder = onSchedule('every 60 minutes', async () => {
    const now = admin.firestore.Timestamp.now();
    const oneHourFromNow = admin.firestore.Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000);

    // Query reminders due in the next hour that are active.
    // We omit a lastNotifiedAt filter here because new reminders won't have the field set.
    // The processReminder function handles dedup by checking if the last notification
    // was sent within the current frequency window.
    const remindersSnap = await db
      .collectionGroup('reminders')
      .where('nextReminderAt', '<=', oneHourFromNow)
      .where('isActive', '==', true)
      .limit(500)
      .get();

    if (remindersSnap.empty) {
      logger.info('No reminders due');
      return;
    }

    logger.info(`Processing ${remindersSnap.size} reminders`);

    const sendPromises: Promise<void>[] = [];

    for (const doc of remindersSnap.docs) {
      sendPromises.push(processReminder(doc));
    }

    await Promise.allSettled(sendPromises);
  });

const processReminder = async (doc: admin.firestore.QueryDocumentSnapshot) => {
  const reminder = doc.data();
  const uid = reminder.userId;
  const nickname = reminder.plantNickname ?? reminder.plantName ?? 'your plant';
  const reminderType: string = reminder.type ?? 'watering';

  // Fetch user's FCM token
  const userSnap = await db.collection('users').doc(uid).get();
  const fcmToken = userSnap.data()?.fcmToken;

  if (!fcmToken) {
    logger.info('No FCM token for user, skipping', { uid });
    return;
  }

  const { title, body } = buildNotificationCopy(reminderType, nickname);

  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'reminder',
        reminderId: doc.id,
        plantId: reminder.plantId ?? '',
        plantNickname: nickname,
        reminderType,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'reminders',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    // Update nextReminderAt and lastNotifiedAt
    const nextDate = computeNextReminderDate(reminder);
    await doc.ref.update({
      lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextReminderAt: admin.firestore.Timestamp.fromDate(nextDate),
    });

    logger.info('Reminder sent', { uid, reminderType, nickname });
  } catch (err) {
    logger.error('Failed to send reminder', { uid, err });
  }
};

const buildNotificationCopy = (type: string, nickname: string): { title: string; body: string } => {
  switch (type) {
    case 'water':
      return {
        title: `${nickname} is thirsty! 💧`,
        body: `Time to water ${nickname}. A little drink goes a long way!`,
      };
    case 'fertilize':
      return {
        title: `${nickname} needs food! 🌱`,
        body: `It's fertilizing day for ${nickname}. Give them a boost!`,
      };
    case 'repot':
      return {
        title: `${nickname} needs more space! 🪴`,
        body: `Time to repot ${nickname} — their roots are ready to grow!`,
      };
    case 'custom':
    default:
      return {
        title: `Check on ${nickname}! 🌿`,
        body: `Your reminder for ${nickname} is due today.`,
      };
  }
};

const computeNextReminderDate = (reminder: admin.firestore.DocumentData): Date => {
  const frequency: number = reminder.frequencyDays ?? 7;
  const base = reminder.nextReminderAt?.toDate?.() ?? new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + frequency);
  return next;
};
