import { create } from 'zustand';
import { listReminderTasks } from '../db/repositories/care';
import { readSetting, writeSetting } from '../db/repositories/settings';
import { buildCarePlan, reconcilePlan, reminderPrefix, type Reminder } from './plan';
import { supported, hasPermission, requestPermission, scheduler, maxPending } from './platform';
import { listHealthReminders } from '../db/repositories/healthReminders';
import { buildHealthPlan, limitReminderPlan } from './healthPlan';
import { isOwnReminder } from './plan';
import { localDate } from '../lib/dates';

export type ReminderStatus = 'enabled' | 'disabled' | 'denied' | 'unsupported' | 'failed';
type State = { status: ReminderStatus; busy: boolean; renewBy: string | null; limited: boolean };
export const useReminderState = create<State>(() => ({ status: supported ? 'disabled' : 'unsupported', busy: false, renewBy: null, limited: false }));
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(work: () => Promise<T>) {
  const result = queue.then(work);
  queue = result.then(() => undefined, () => undefined);
  return result;
}
export function syncReminders() {
  return serialized(async () => {
    if (!supported) return;
    try {
      const enabled = await readSetting('remindersEnabled') === 'true';
      const permission = await hasPermission();
      let plan: Reminder[] = [], renewBy: string | null = null, limited = false;
      if (enabled && permission) {
        const [tasks, health, pending] = await Promise.all([listReminderTasks(), listHealthReminders(localDate()), scheduler.list()]);
        const healthPlan = buildHealthPlan(health);
        const foreignCount = pending.filter(item => !isOwnReminder(item.id)).length;
        // Keep room under the platform's pending-request ceiling; never silently drop doses.
        const snoozeCount = pending.filter(item => item.id.startsWith(reminderPrefix) && item.id.endsWith('.snooze') && Number(item.fingerprint) > Date.now()).length;
        const bounded = limitReminderPlan([...buildCarePlan(tasks), ...healthPlan.plan], Math.max(0, maxPending - foreignCount - snoozeCount), healthPlan.renewBy);
        plan = bounded.plan; renewBy = bounded.renewBy; limited = bounded.limited;
      }
      await reconcilePlan(scheduler, plan);
      useReminderState.setState({ status: !enabled ? 'disabled' : permission ? 'enabled' : 'denied', renewBy, limited });
    } catch { useReminderState.setState({ status: 'failed' }); }
  });
}
export async function toggleReminders(enable: boolean) {
  if (!supported || useReminderState.getState().busy) return;
  useReminderState.setState({ busy: true });
  try {
    if (enable && !await requestPermission()) { useReminderState.setState({ status: 'denied' }); return; }
    await writeSetting('remindersEnabled', String(enable));
    await syncReminders();
  } catch { useReminderState.setState({ status: 'failed' }); }
  finally { useReminderState.setState({ busy: false }); }
}
export function snoozeReminder(task: { id: number; petId?: number; title: string; time: string }, petName: string) {
  return serialized(async () => {
    if (!supported || await readSetting('remindersEnabled') !== 'true' || !await hasPermission()) throw new Error('Podsetnici nisu uključeni.');
    const timestamp = Date.now() + 15 * 60_000;
    const item: Reminder = { id: `${reminderPrefix}${task.id}.snooze`, title: petName, body: task.title, petId: task.petId, trigger: { kind: 'date', timestamp }, fingerprint: String(timestamp) };
    if ((await scheduler.list()).filter(pending => pending.id !== item.id).length >= maxPending) throw new Error('Nema mesta za dodatni podsetnik.');
    await scheduler.cancel(item.id);
    await scheduler.schedule(item);
  });
}
