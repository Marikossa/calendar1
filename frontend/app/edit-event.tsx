import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import * as Notifications from 'expo-notifications';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const EVENT_TYPES = [
  { id: 'meeting', label: 'Meeting', icon: 'briefcase', color: '#9B7EBD' },
  { id: 'birthday', label: 'Birthday', icon: 'cake', color: '#FFB6C6' },
  { id: 'appointment', label: 'Appointment', icon: 'calendar-check', color: '#A8D5E2' },
  { id: 'social', label: 'Social', icon: 'people', color: '#E6D5F5' },
  { id: 'personal', label: 'Personal', icon: 'heart', color: '#FFD6E8' },
  { id: 'other', label: 'Other', icon: 'star', color: '#D4AF37' },
];

const RECURRENCE_TYPES = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function EditEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState('meeting');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (params.eventId) {
      loadEvent();
    }
  }, [params.eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${params.eventId}`);

      if (response.ok) {
        const event = await response.json();
        setTitle(event.title);
        setDescription(event.description || '');
        setStartDate(parseISO(event.start_date));
        if (event.end_date) {
          setEndDate(parseISO(event.end_date));
        }
        setAllDay(event.all_day);
        setEventType(event.event_type);
        setRecurrenceType(event.recurrence?.type || 'none');
        setSelectedReminders(event.reminders?.map(r => r.minutes_before) || []);
      } else {
        Alert.alert('Error', 'Failed to load event');
        router.back();
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotifications = async (event, eventId) => {
    const notifications = [];
    
    for (const minutesBefore of selectedReminders) {
      const triggerDate = new Date(event.start_date);
      triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);
      
      if (triggerDate > new Date()) {
        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: event.title,
              body: `Starting in ${minutesBefore} minutes`,
              data: { eventId },
            },
            trigger: triggerDate,
          });
          notifications.push({ minutes_before: minutesBefore, notification_id: notificationId });
        } catch (error) {
          console.error('Error scheduling notification:', error);
        }
      }
    }
    
    return notifications;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      setSaving(true);
      const selectedType = EVENT_TYPES.find((t) => t.id === eventType);

      // First, cancel all existing notifications
      const existingEvent = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${params.eventId}`);
      if (existingEvent.ok) {
        const eventData = await existingEvent.json();
        if (eventData.reminders) {
          for (const reminder of eventData.reminders) {
            if (reminder.notification_id) {
              await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
            }
          }
        }
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        all_day: allDay,
        event_type: eventType,
        color: selectedType.color,
        icon: selectedType.icon,
        recurrence: {
          type: recurrenceType,
          interval: 1,
          end_date: null,
          days_of_week: null,
        },
        reminders: [],
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${params.eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        // Schedule new notifications
        const notifications = await scheduleNotifications(eventData, params.eventId);
        
        // Update event with notification IDs
        if (notifications.length > 0) {
          await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${params.eventId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reminders: notifications }),
          });
        }

        Alert.alert('Success', 'Event updated successfully');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to update event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = (value) => {
    if (selectedReminders.includes(value)) {
      setSelectedReminders(selectedReminders.filter((v) => v !== value));
    } else {
      setSelectedReminders([...selectedReminders, value]);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9B7EBD" style={styles.loader} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#9E9E9E"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details"
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDatePickerMode('date');
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#9B7EBD" />
            <Text style={styles.dateButtonText}>{format(startDate, 'MMMM d, yyyy')}</Text>
          </TouchableOpacity>

          {!allDay && (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDatePickerMode('time');
                setShowTimePicker(true);
              }}
            >
              <Ionicons name="time-outline" size={20} color="#9B7EBD" />
              <Text style={styles.dateButtonText}>{format(startDate, 'h:mm a')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>All day event</Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ false: '#D3D3D3', true: '#E6D5F5' }}
              thumbColor={allDay ? '#9B7EBD' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Event Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.eventTypeGrid}>
            {EVENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.eventTypeButton,
                  eventType === type.id && { backgroundColor: type.color, borderColor: type.color },
                ]}
                onPress={() => setEventType(type.id)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={eventType === type.id ? '#FFF' : type.color}
                />
                <Text
                  style={[
                    styles.eventTypeLabel,
                    eventType === type.id && { color: '#FFF' },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.label}>Recurrence</Text>
          {RECURRENCE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.radioButton}
              onPress={() => setRecurrenceType(type.id)}
            >
              <View style={styles.radioCircle}>
                {recurrenceType === type.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.label}>Reminders</Text>
          {REMINDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.checkboxRow}
              onPress={() => toggleReminder(option.value)}
            >
              <View style={styles.checkbox}>
                {selectedReminders.includes(option.value) && (
                  <Ionicons name="checkmark" size={18} color="#9B7EBD" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date/Time Picker */}
      {(showDatePicker || showTimePicker) && (
        <DateTimePicker
          value={startDate}
          mode={datePickerMode}
          display="default"
          onChange={onDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loader: {
    marginTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A2C5C',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4A2C5C',
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#4A2C5C',
    marginLeft: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#4A2C5C',
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventTypeButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E6D5F5',
  },
  eventTypeLabel: {
    fontSize: 12,
    color: '#4A2C5C',
    marginTop: 6,
    fontWeight: '500',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9B7EBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9B7EBD',
  },
  radioLabel: {
    fontSize: 16,
    color: '#4A2C5C',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9B7EBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#4A2C5C',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#9B7EBD',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4A2C5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
