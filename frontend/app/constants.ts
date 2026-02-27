// Event type configurations with valid Ionicons names
export const EVENT_TYPES = [
  { id: 'meeting', label: 'Meeting', icon: 'briefcase', color: '#9B7EBD' },
  { id: 'birthday', label: 'Birthday', icon: 'cafe', color: '#FFB6C6' },
  { id: 'appointment', label: 'Appointment', icon: 'calendar', color: '#A8D5E2' },
  { id: 'social', label: 'Social', icon: 'people', color: '#E6D5F5' },
  { id: 'personal', label: 'Personal', icon: 'heart', color: '#FFD6E8' },
  { id: 'other', label: 'Other', icon: 'star', color: '#D4AF37' },
];

export const EVENT_TYPE_CONFIG = {
  meeting: { icon: 'briefcase', color: '#9B7EBD', label: 'Meeting' },
  birthday: { icon: 'cafe', color: '#FFB6C6', label: 'Birthday' },
  appointment: { icon: 'calendar', color: '#A8D5E2', label: 'Appointment' },
  social: { icon: 'people', color: '#E6D5F5', label: 'Social' },
  personal: { icon: 'heart', color: '#FFD6E8', label: 'Personal' },
  other: { icon: 'star', color: '#D4AF37', label: 'Other' },
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
