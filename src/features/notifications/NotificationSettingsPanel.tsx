import { useEffect, useMemo, useState } from 'react';
import type { TitanPlan } from '../plan/types';
import { loadWorkoutHistory } from '../history/storage';
import { buildSmartReminders, currentSmartAlerts } from './engine';
import { disableNativeNotifications, getNotificationPermissionState, notificationCapability, requestNotificationPermission, syncSmartNotifications, type NotificationPermissionState } from './native';
import { loadNotificationPreferences, saveNotificationPreferences, type NotificationPreferences } from './preferences';
import '../../styles/notifications-v057.css';

export function NotificationSettingsPanel({ plan }: { plan: TitanPlan | null }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadNotificationPreferences());
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const capability = notificationCapability();

  useEffect(() => {
    let active = true;
    void getNotificationPermissionState().then((value) => { if (active) setPermission(value); });
    return () => { active = false; };
  }, []);

  const context = useMemo(() => ({ plan, workoutHistory: loadWorkoutHistory(), preferences }), [plan, preferences]);
  const previews = useMemo(() => [...currentSmartAlerts(context), ...buildSmartReminders(context)].slice(0, 6), [context]);

  async function update(next: NotificationPreferences) {
    setPreferences(next);
    saveNotificationPreferences(next);
    setMessage('');
    if (!next.enabled) {
      await disableNativeNotifications();
      setScheduled(0);
      return;
    }
    if (capability === 'native' && permission === 'granted') {
      const result = await syncSmartNotifications(plan);
      setScheduled(result.scheduled);
    }
  }

  async function enableAndroid() {
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);
    if (nextPermission !== 'granted') {
      setMessage('Permissão de notificações não concedida.');
      return;
    }
    const next = { ...preferences, enabled: true };
    setPreferences(next);
    saveNotificationPreferences(next);
    const result = await syncSmartNotifications(plan);
    setScheduled(result.scheduled);
    setMessage(`${result.scheduled} lembrete${result.scheduled === 1 ? '' : 's'} agendado${result.scheduled === 1 ? '' : 's'} no aparelho.`);
  }

  async function resync() {
    const result = await syncSmartNotifications(plan);
    setPermission(result.permission);
    setScheduled(result.scheduled);
    setMessage(result.permission === 'granted' ? `${result.scheduled} lembrete${result.scheduled === 1 ? '' : 's'} atualizado${result.scheduled === 1 ? '' : 's'}.` : 'As notificações do Android precisam de permissão para serem agendadas.');
  }

  return <section className="settings-card notification-settings-v057" aria-label="Notificações inteligentes">
    <div className="notification-settings-head"><div><span className="info-label">Notificações inteligentes</span><strong>Lembretes TITAN</strong><small>Usam os horários de musculação e cardio do projeto ativo.</small></div><span className={`notification-status ${preferences.enabled ? 'active' : ''}`}>{statusLabel(capability, permission, preferences.enabled)}</span></div>

    <label className="notification-master-toggle"><input type="checkbox" checked={preferences.enabled} onChange={(event) => void update({ ...preferences, enabled: event.target.checked })} /><span><strong>Ativar lembretes inteligentes</strong><small>{capability === 'native' ? 'No Android, os lembretes podem aparecer mesmo com o app fechado após a permissão ser concedida.' : 'No navegador/PWA, os alertas dependem do aplicativo estar em uso.'}</small></span></label>

    <div className="notification-options">
      <Toggle label="Musculação" detail={`${preferences.workoutLeadMinutes} min antes do horário real do treino.`} checked={preferences.workout} onChange={(value) => void update({ ...preferences, workout: value })} />
      <Toggle label="Cardio" detail={`${preferences.cardioLeadMinutes} min antes do horário da sessão programada.`} checked={preferences.cardio} onChange={(value) => void update({ ...preferences, cardio: value })} />
    </div>

    <div className="notification-lead-grid notification-lead-grid-two">
      <LeadSelect label="Avisar treino antes" value={preferences.workoutLeadMinutes} onChange={(value) => void update({ ...preferences, workoutLeadMinutes: value })} />
      <LeadSelect label="Avisar cardio antes" value={preferences.cardioLeadMinutes} onChange={(value) => void update({ ...preferences, cardioLeadMinutes: value })} />
    </div>

    {capability === 'native' && permission !== 'granted' && <button type="button" className="primary-action" onClick={() => void enableAndroid()}>Permitir notificações no Android</button>}
    {capability === 'native' && permission === 'granted' && <button type="button" className="secondary-action" onClick={() => void resync()}>Sincronizar lembretes agora</button>}
    {scheduled !== null && capability === 'native' && permission === 'granted' && <small className="notification-scheduled-count">{scheduled} lembrete{scheduled === 1 ? '' : 's'} futuro{scheduled === 1 ? '' : 's'} agendado{scheduled === 1 ? '' : 's'}.</small>}
    {message && <p className="notification-message" role="status">{message}</p>}

    <div className="notification-preview"><div><span className="info-label">Próximos alertas</span><strong>{previews.length ? `${previews.length} em destaque` : 'Nenhum alerta pendente'}</strong></div>{previews.length > 0 && <div className="notification-preview-list">{previews.map((item) => <article key={`${item.key}:${item.at.toISOString()}`}><span>{formatReminderTime(item.at)}</span><div><strong>{item.title}</strong><small>{item.body}</small></div></article>)}</div>}</div>

    <small className="notification-platform-note">O Android agenda notificações locais no aparelho, sem servidor. O horário pode sofrer pequenos ajustes do próprio sistema para economia de bateria.</small>
  </section>;
}

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong><small>{detail}</small></span></label>;
}

function LeadSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(Number(event.target.value))}>{[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>;
}

function statusLabel(capability: 'native' | 'web', permission: NotificationPermissionState, enabled: boolean) {
  if (!enabled) return 'DESATIVADO';
  if (capability === 'web') return 'NO APP';
  if (permission === 'granted') return 'ANDROID ATIVO';
  return 'SEM PERMISSÃO';
}

function formatReminderTime(date: Date) {
  const today = new Date();
  const sameDay = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay) return `Hoje ${time}`;
  return `${new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' }).format(date)} ${time}`;
}
