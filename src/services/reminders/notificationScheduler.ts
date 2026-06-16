// Phase 8 — Local notification scheduling infrastructure.
// Uses expo-notifications for local (on-device) scheduling.
// No server push required — entirely client-side.

import * as Notifications from 'expo-notifications';
import type { UserPlantDoc } from '../../types/firestore.types';
import { getWaterInfo, generateWateringMessage } from './reminderService';
import { useNotificationPrefsStore } from '../../features/profile/store/notificationPrefsStore';
import type { WeatherData } from '../weather/weatherService';

export type LocalReminderType =
  | 'water'
  | 'fertilize'
  | 'disease_followup'
  | 'heat_alert'
  | 'humidity_alert';

export interface ReminderPayload {
  type: LocalReminderType;
  plantId: string;
  plantNickname: string;
  message: string;
  scheduledFor: Date;
  weatherTriggered?: boolean;
}

const ID_PREFIX = 'lawnup_';

// Configure foreground notification behaviour once at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── Permission ─────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Test reminder ────────────────────────────────────────────────────────────

export type TestReminderResult = 'scheduled' | 'no_permission' | 'error';

/**
 * Fire a one-off local notification a few seconds out so the user can confirm
 * notifications actually arrive on their device (a "does this work?" check).
 * Requests permission if not already granted.
 */
export async function sendTestReminder(delaySeconds = 5): Promise<TestReminderResult> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return 'no_permission';

    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_PREFIX}test`,
      content: {
        title: '🌿 LawnUp reminder test',
        body: 'Nice — reminders are working. This is how watering reminders will arrive.',
        data: { type: 'test' } as Record<string, unknown>,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, delaySeconds),
      },
    });
    return 'scheduled';
  } catch {
    return 'error';
  }
}

// ── Scheduling ─────────────────────────────────────────────────────────────────

export async function scheduleWateringReminder(
  plant: UserPlantDoc,
  weather?: WeatherData | null,
): Promise<string | null> {
  try {
    const permitted = await hasNotificationPermission();
    if (!permitted) return null;

    // Honour the global "Watering reminders" preference (Settings master switch).
    if (!useNotificationPrefsStore.getState().water) return null;

    // Rain today → skip watering reminder
    if (weather?.isRaining) return null;

    const waterInfo = getWaterInfo(plant);
    if (waterInfo.status === 'ok' && waterInfo.daysUntil > 3) return null;

    // Determine fire time: next water date or 5 min from now if overdue
    let triggerDate = new Date(
      plant.lastWateredAt.toDate().getTime() +
        plant.wateringFrequencyDays * 86_400_000,
    );
    if (triggerDate <= new Date()) {
      triggerDate = new Date(Date.now() + 5 * 60_000);
    }

    const message = generateWateringMessage(plant, weather);
    const id = `${ID_PREFIX}water_${plant.plantId}`;

    await cancelReminderById(id);

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: plant.nickname,
        body: message,
        data: { plantId: plant.plantId, type: 'water' } as Record<string, unknown>,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return id;
  } catch {
    return null;
  }
}

// ── Cancellation ────────────────────────────────────────────────────────────────

export async function cancelReminderById(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function cancelPlantReminders(plantId: string): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const plantNotifs = all.filter(n => n.identifier.includes(plantId));
    await Promise.all(plantNotifs.map(n => cancelReminderById(n.identifier)));
  } catch {}
}

// ── Query ───────────────────────────────────────────────────────────────────────

export async function getPendingReminders(): Promise<ReminderPayload[]> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all
      .filter(n => n.identifier.startsWith(ID_PREFIX))
      .map(n => {
        const data = (n.content.data ?? {}) as Record<string, string>;
        const triggerMs = (n.trigger as { value?: number })?.value ?? Date.now();
        return {
          type: (data.type ?? 'water') as LocalReminderType,
          plantId: data.plantId ?? '',
          plantNickname: n.content.title ?? '',
          message: n.content.body ?? '',
          scheduledFor: new Date(triggerMs),
        };
      });
  } catch {
    return [];
  }
}

// ── Apply (enable / disable) — one place for the toggle logic ───────────────────

export interface ApplyReminderResult {
  ok: boolean;            // true if the desired state was achieved
  needsPermission?: boolean; // true if enabling failed for lack of notif permission
}

/**
 * Enable or disable the watering reminder for a plant. Centralises the
 * permission + schedule/cancel dance so screens just update their own state.
 */
export async function applyPlantReminder(
  plant: UserPlantDoc,
  enabled: boolean,
  weather?: WeatherData | null,
): Promise<ApplyReminderResult> {
  if (!enabled) {
    await cancelPlantReminders(plant.plantId);
    return { ok: true };
  }
  const granted = await requestNotificationPermission();
  if (!granted) return { ok: false, needsPermission: true };
  await scheduleWateringReminder(plant, weather);
  return { ok: true };
}

export async function isReminderScheduled(plantId: string): Promise<boolean> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.some(n => n.identifier.includes(plantId));
  } catch {
    return false;
  }
}
