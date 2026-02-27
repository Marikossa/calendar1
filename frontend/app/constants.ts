// Event type configurations with valid Ionicons names - Pastel Colors
export const EVENT_TYPES = [
  { id: 'meeting', label: 'Meeting', icon: 'briefcase', color: '#C7B8EA' },
  { id: 'birthday', label: 'Birthday', icon: 'cafe', color: '#FFB6D9' },
  { id: 'vacation', label: 'Vacation', icon: 'airplane', color: '#A8D5E2' },
  { id: 'event', label: 'Event', icon: 'calendar-sharp', color: '#D4C5F9' },
  { id: 'red_days', label: 'Red days', icon: 'flag', color: '#FFB5B5' },
];

export const EVENT_TYPE_CONFIG = {
  meeting: { icon: 'briefcase', color: '#C7B8EA', label: 'Meeting' },
  birthday: { icon: 'cafe', color: '#FFB6D9', label: 'Birthday' },
  vacation: { icon: 'airplane', color: '#A8D5E2', label: 'Vacation' },
  event: { icon: 'calendar-sharp', color: '#D4C5F9', label: 'Event' },
  red_days: { icon: 'flag', color: '#FFB5B5', label: 'Red days' },
};

export const RECURRENCE_TYPES = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const RECURRENCE_LABELS = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};
