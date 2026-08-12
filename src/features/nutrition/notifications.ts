import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { PlannedMeal } from './types';
import type { NutritionSettings } from './settings';

const ID_BASE = 810000;
const ID_LIMIT = 811000;
const CHANNEL_ID = 'titan-nutrition';

function todayAt(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
}

function shifted(time: string, minutes: number) {
  const date = todayAt(time);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function isFuture(date: Date) {
  return date.getTime() > Date.now() + 15000;
}

async function clearTitanPending() {
  const pending = await LocalNotifications.getPending();
  const notifications = pending.notifications.filter((item) => item.id >= ID_BASE && item.id < ID_LIMIT).map((item) => ({ id: item.id }));
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}

export async function requestNutritionNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return false;
  const permission = await LocalNotifications.requestPermissions();
  return permission.display === 'granted';
}

export async function disableNutritionNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  await clearTitanPending();
}

export async function syncNutritionNotifications(settings: NutritionSettings, meals: PlannedMeal[]) {
  if (!Capacitor.isNativePlatform()) return { scheduled: 0, native: false };
  await clearTitanPending();
  if (!settings.notificationsEnabled) return { scheduled: 0, native: true };

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') return { scheduled: 0, native: true };

  try {
    await LocalNotifications.createChannel({ id: CHANNEL_ID, name: 'TITAN Nutrition', description: 'Refeições, hidratação e rotina nutricional', importance: 4, visibility: 1, vibration: true });
  } catch { /* canal pode já existir ou não ser necessário */ }

  const notifications: Array<{ id: number; title: string; body: string; schedule: { at: Date }; channelId: string }> = [];
  let id = ID_BASE;

  settings.mealTimes.forEach((time, index) => {
    const meal = meals[index];
    const done = meal?.status === 'completed' || meal?.status === 'skipped';
    const mealName = meal?.name ?? `Refeição ${index + 1}`;
    if (!done && settings.mealNotifications) {
      const at = shifted(time, -10);
      if (isFuture(at)) notifications.push({ id: id++, title: `Próxima refeição • ${mealName}`, body: 'Sua refeição está chegando. Abra o TITAN para conferir o planejado.', schedule: { at }, channelId: CHANNEL_ID });
    }
    if (!done && settings.lateMealNotifications) {
      const at = shifted(time, 30);
      if (isFuture(at)) notifications.push({ id: id++, title: `Refeição pendente • ${mealName}`, body: 'Essa refeição ainda não foi registrada. Registre o consumo ou marque como pulada.', schedule: { at }, channelId: CHANNEL_ID });
    }
  });

  if (settings.waterNotifications) {
    const start = shifted(settings.wakeTime, settings.waterReminderMinutes);
    const end = todayAt(settings.sleepTime);
    const cursor = new Date(start);
    while (cursor < end && id < ID_LIMIT - 20) {
      if (isFuture(cursor)) notifications.push({ id: id++, title: 'Hidratação TITAN', body: 'Como está seu ritmo de água? Registre 300 ml ou 500 ml no TITAN.', schedule: { at: new Date(cursor) }, channelId: CHANNEL_ID });
      cursor.setMinutes(cursor.getMinutes() + settings.waterReminderMinutes);
    }
  }

  if (settings.preWorkoutNotification) {
    const at = shifted(settings.workoutTime, -30);
    if (isFuture(at)) notifications.push({ id: id++, title: 'Pré-treino', body: 'Treino em aproximadamente 30 minutos. Confira sua refeição e hidratação.', schedule: { at }, channelId: CHANNEL_ID });
  }

  if (settings.dayCloseNotification) {
    const at = shifted(settings.sleepTime, -45);
    if (isFuture(at)) notifications.push({ id: id++, title: 'Fechamento do dia', body: 'Confira refeições, hidratação e saldo energético antes de encerrar o dia.', schedule: { at }, channelId: CHANNEL_ID });
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications });
  return { scheduled: notifications.length, native: true };
}
