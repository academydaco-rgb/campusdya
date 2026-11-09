// Recordatorios de clase (opt-in por dispositivo, guardado en localStorage).
const KEY = "classReminders";

export function getReminders(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function isReminderOn(id: string): boolean {
  return getReminders().includes(id);
}
export function toggleReminder(id: string): boolean {
  const cur = new Set(getReminders());
  let on: boolean;
  if (cur.has(id)) { cur.delete(id); on = false; } else { cur.add(id); on = true; }
  try { localStorage.setItem(KEY, JSON.stringify([...cur])); } catch {}
  try { window.dispatchEvent(new Event("class-reminders-changed")); } catch {}
  return on;
}
