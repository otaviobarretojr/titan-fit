import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { TitanPlan } from '../plan/types';
import { loadWorkoutHistory } from '../history/storage';
import { loadNutritionExecutions } from '../nutrition/execution';
import { loadActiveNutritionPlan } from '../nutrition/storage';
import { buildSmartReminders } from './engine';
import { loadNotificationPreferences } from './preferences';

const SCHEDULED_IDS_KEY = 'titan-fit:scheduled-notification-ids:v1';
const MAX_SCHEDULED = 48;

export type NotificationCapability = 'native' | 'web';
export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export function notificationCapability(): NotificationCapability {
  return Capacitor.isNativePlatform() ? 'native' : 'web';
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (!Capacitor.isNativePlatform()) return 'unsupported';
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return 'granted';
    if (status.display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!Capacitor.isNativePlatform()) return 'unsupported';
  try {
    const status = await LocalNotifications.requestPermissions();
    if (status.display === 'granted') return 'granted';
    if (status.display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

export async function syncSmartNotifications(activePlan: TitanPlan | null) {
  if (!Capacitor.isNativePlatform()) return { scheduled: 0, supported: false, permission: 'unsupported' as NotificationPermissionState };
  const preferences = loadNotificationPreferences();
  const permission = await getNotificationPermissionState();
  await cancelPreviouslyScheduled();
  if (!preferences.enabled || permission !== 'granted') return { scheduled: 0, supported: true, permission };

  const reminders = buildSmartReminders({
    plan: activePlan,
    nutritionPlan: loadActiveNutritionPlan(),
    nutritionExecutions: loadNutritionExecutions(),
    workoutHistory: loadWorkoutHistory(),
    preferences,
  }).slice(0, MAX_SCHEDULED);

  if (reminders.length) {
    await LocalNotifications.schedule({
      notifications: reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        schedule: { at: reminder.at, allowWhileIdle: true },
        extra: { titanKey: reminder.key, kind: reminder.kind },
      })),
    });
  }
  saveScheduledIds(reminders.map((item) => item.id));
  return { scheduled: reminders.length, supported: true, permission };
}

export async function disableNativeNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  await cancelPreviouslyScheduled();
}

async function cancelPreviouslyScheduled() {
  const ids = loadScheduledIds();
  if (ids.length) {
    try {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch {
      // Uma limpeza incompleta não deve impedir o próximo agendamento.
    }
  }
  saveScheduledIds([]);
}

function loadScheduledIds(): number[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value) && value > 0) : [];
  } catch {
    return [];
  }
}

function saveScheduledIds(ids: number[]) {
  localStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}
