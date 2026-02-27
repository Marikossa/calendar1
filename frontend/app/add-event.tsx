import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { EVENT_TYPES, RECURRENCE_TYPES, REMINDER_OPTIONS } from './constants';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState('meeting');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [selectedReminders, setSelectedReminders] = useState([15]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(1); // Duration in days for Red days

  // Update end date when event type changes to red_days or duration changes
  useEffect(() => {
    if (eventType === 'red_days') {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + duration - 1);
      setEndDate(newEndDate);
    }
  }, [eventType, duration, startDate]);

  const scheduleNotifications = async (event, eventId) => {
    const notifications = [];
    
    for (const minutesBefore of selectedReminders) {
      const triggerDate = new Date(event.start_date);
      triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);
      
      // Only schedule if in the future
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

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        
        // Schedule notifications
        const notifications = await scheduleNotifications(eventData, createdEvent._id);
        
        // Update event with notification IDs
        if (notifications.length > 0) {
          await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${createdEvent._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reminders: notifications }),
          });
        }

        Alert.alert('Success', 'Event created successfully');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create event');
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

        {/* Duration for Red Days */}
        {eventType === 'red_days' && (
          <View style={styles.section}>
            <Text style={styles.label}>Duration (Days)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(Math.max(1, duration - 1))}
              >
                <Ionicons name="remove-circle" size={32} color="#FFB5B5" />
              </TouchableOpacity>
              <Text style={styles.durationText}>{duration} {duration === 1 ? 'day' : 'days'}</Text>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(duration + 1)}
              >
                <Ionicons name="add-circle" size={32} color="#FFB5B5" />
              </TouchableOpacity>
            </View>
            <Text style={styles.durationHint}>
              From {format(startDate, 'MMM d')} to {format(endDate, 'MMM d, yyyy')}
            </Text>
          </View>
        )}

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
              <Text style={styles.saveButtonText}>Save Event</Text>
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
