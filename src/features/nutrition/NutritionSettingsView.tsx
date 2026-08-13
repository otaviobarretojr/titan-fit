import { useState } from 'react';
import { loadDailyMeals } from './storage';
import { disableNutritionNotifications, requestNutritionNotificationPermission, syncNutritionNotifications } from './notifications';
import { loadNutritionSettings, saveNutritionSettings, type NutritionSettings } from './settings';
import { setHydrationGoal } from './hydration';

function NumberField({ label, value, unit, step = 10, onChange }: { label: string; value: number; unit: string; step?: number; onChange: (value: number) => void }) {
  return <label className="nutrition-setting-field"><span>{label}</span><div><input type="number" inputMode="decimal" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/><small>{unit}</small></div></label>;
}

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="nutrition-setting-toggle"><div><strong>{label}</strong><small>{detail}</small></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i/></label>;
}

export function NutritionSettingsView({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<NutritionSettings>(() => loadNutritionSettings());
  const [message, setMessage] = useState('');
  const update = <K extends keyof NutritionSettings>(key: K, value: NutritionSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  async function save() {
    const saved = saveNutritionSettings(settings);
    setSettings(saved);
    setHydrationGoal(saved.hydrationGoalMl);
    if (saved.notificationsEnabled) {
      const allowed = await requestNutritionNotificationPermission();
      if (!allowed) {
        const disabled = saveNutritionSettings({ ...saved, notificationsEnabled: false });
        setSettings(disabled);
        return setMessage('Notificações não foram autorizadas pelo Android.');
      }
      const result = await syncNutritionNotifications(saved, await loadDailyMeals());
      setMessage(`Configurações salvas • ${result.scheduled} lembretes programados para hoje.`);
    } else {
      await disableNutritionNotifications();
      setMessage('Configurações salvas. Notificações desativadas.');
    }
  }

  function changeMealTime(index: number, value: string) {
    const mealTimes = [...settings.mealTimes];
    mealTimes[index] = value;
    update('mealTimes', mealTimes);
  }

  return <main className="nutrition-app nutrition-shell-page nutrition-settings-page">
    <header className="nutrition-shell-header"><button className="nutrition-back" onClick={onBack}>←</button><span className="nutrition-eyebrow">PERSONALIZAÇÃO</span><h1>Metas e notificações</h1><p>Altere os números e horários sem depender de uma nova versão do aplicativo.</p></header>

    <section className="nutrition-settings-card"><h2>Metas do dia</h2><div className="nutrition-settings-grid"><NumberField label="Meta alimentar" value={settings.calorieTarget} unit="kcal" step={50} onChange={(value) => update('calorieTarget', value)}/><NumberField label="Proteína" value={settings.proteinTarget} unit="g" step={5} onChange={(value) => update('proteinTarget', value)}/><NumberField label="Déficit mínimo" value={settings.balanceMin} unit="kcal" step={50} onChange={(value) => update('balanceMin', value)}/><NumberField label="Déficit máximo" value={settings.balanceMax} unit="kcal" step={50} onChange={(value) => update('balanceMax', value)}/><NumberField label="Meta de água" value={settings.hydrationGoalMl} unit="ml" step={250} onChange={(value) => update('hydrationGoalMl', value)}/></div><small className="nutrition-settings-note">A faixa energética é interpretada como saldo consumido − gasto. Ex.: −300 kcal = gasto 300 kcal maior que o consumo.</small></section>

    <section className="nutrition-settings-card"><h2>Rotina</h2><div className="nutrition-time-grid"><label><span>Acordar</span><input type="time" value={settings.wakeTime} onChange={(event) => update('wakeTime', event.target.value)}/></label><label><span>Treino</span><input type="time" value={settings.workoutTime} onChange={(event) => update('workoutTime', event.target.value)}/></label><label><span>Dormir</span><input type="time" value={settings.sleepTime} onChange={(event) => update('sleepTime', event.target.value)}/></label></div><h3>Horários das refeições</h3><div className="nutrition-meal-time-grid">{settings.mealTimes.map((time, index) => <label key={index}><span>Refeição {index + 1}</span><input type="time" value={time} onChange={(event) => changeMealTime(index, event.target.value)}/></label>)}</div></section>

    <section className="nutrition-settings-card"><h2>Notificações</h2><Toggle label="Ativar notificações" detail="Permite ao TITAN programar lembretes locais no Android." checked={settings.notificationsEnabled} onChange={(value) => update('notificationsEnabled', value)}/>{settings.notificationsEnabled && <div className="nutrition-toggle-stack"><Toggle label="Próxima refeição" detail="Lembrete 10 minutos antes." checked={settings.mealNotifications} onChange={(value) => update('mealNotifications', value)}/><Toggle label="Refeição pendente" detail="Avisa 30 minutos depois se ainda não estiver registrada." checked={settings.lateMealNotifications} onChange={(value) => update('lateMealNotifications', value)}/><Toggle label="Água" detail={`Lembrete a cada ${settings.waterReminderMinutes} minutos.`} checked={settings.waterNotifications} onChange={(value) => update('waterNotifications', value)}/><Toggle label="Pré-treino" detail="Avisa 30 minutos antes do treino." checked={settings.preWorkoutNotification} onChange={(value) => update('preWorkoutNotification', value)}/><Toggle label="Fechamento do dia" detail="Revisão final antes de dormir." checked={settings.dayCloseNotification} onChange={(value) => update('dayCloseNotification', value)}/><label className="nutrition-setting-field"><span>Intervalo da água</span><div><select value={settings.waterReminderMinutes} onChange={(event) => update('waterReminderMinutes', Number(event.target.value))}><option value={60}>1 hora</option><option value={90}>1h30</option><option value={120}>2 horas</option><option value={180}>3 horas</option></select></div></label></div>}</section>

    <div className="nutrition-settings-save"><button className="nutrition-primary" onClick={() => void save()}>Salvar e aplicar</button>{message && <small>{message}</small>}</div>
  </main>;
}
