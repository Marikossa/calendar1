import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import * as Notifications from 'expo-notifications';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const EVENT_TYPE_CONFIG = {
  meeting: { icon: 'briefcase', color: '#9B7EBD', label: 'Meeting' },
  birthday: { icon: 'cake', color: '#FFB6C6', label: 'Birthday' },
  appointment: { icon: 'calendar-check', color: '#A8D5E2', label: 'Appointment' },
  social: { icon: 'people', color: '#E6D5F5', label: 'Social' },
  personal: { icon: 'heart', color: '#FFD6E8', label: 'Personal' },
  other: { icon: 'star', color: '#D4AF37', label: 'Other' },
};

const RECURRENCE_LABELS = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
        const data = await response.json();
        setEvent(data);
      } else {
        Alert.alert('Error', 'Failed to load event');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      
      // Cancel all notifications for this event
      if (event.reminders) {
        for (const reminder of event.reminders) {
          if (reminder.notification_id) {
            await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
          }
        }
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/events/${params.eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Alert.alert('Success', 'Event deleted successfully');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit-event',
      params: { eventId: params.eventId },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9B7EBD" style={styles.loader} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
  const startDate = parseISO(event.start_date);
  const endDate = event.end_date ? parseISO(event.end_date) : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Event Icon & Type */}
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon as any} size={48} color="#FFF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.type}>{config.label}</Text>

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color="#9B7EBD" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#9B7EBD" />
            <Text style={styles.sectionTitle}>Date & Time</Text>
          </View>
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar" size={18} color="#4A2C5C" />
              <Text style={styles.dateTimeText}>{format(startDate, 'EEEE, MMMM d, yyyy')}</Text>
            </View>
            {!event.all_day && (
              <View style={styles.dateTimeRow}>
                <Ionicons name="time" size={18} color="#4A2C5C" />
                <Text style={styles.dateTimeText}>
                  {format(startDate, 'h:mm a')}
                  {endDate && ` - ${format(endDate, 'h:mm a')}`}
                </Text>
              </View>
            )}
            {event.all_day && (
              <View style={styles.allDayBadge}>
                <Text style={styles.allDayText}>All day event</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recurrence */}
        {event.recurrence && event.recurrence.type !== 'none' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="repeat" size={20} color="#9B7EBD" />
              <Text style={styles.sectionTitle}>Recurrence</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {RECURRENCE_LABELS[event.recurrence.type]}
              </Text>
            </View>
          </View>
        )}

        {/* Reminders */}
        {event.reminders && event.reminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color="#9B7EBD" />
              <Text style={styles.sectionTitle}>Reminders</Text>
            </View>
            {event.reminders.map((reminder, index) => {
              const minutes = reminder.minutes_before;
              let label = '';
              if (minutes < 60) {
                label = `${minutes} minutes before`;
              } else if (minutes < 1440) {
                label = `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''} before`;
              } else {
                label = `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) > 1 ? 's' : ''} before`;
              }
              return (
                <View key={index} style={styles.reminderCard}>
                  <Ionicons name="alarm" size={16} color="#9B7EBD" />
                  <Text style={styles.reminderText}>{label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={20} color="#FFF" />
            <Text style={styles.editButtonText}>Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Ionicons name="trash" size={20} color="#FFF" />
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  loader: {
    marginTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 100,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#4A2C5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A2C5C',
    textAlign: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    color: '#9B7EBD',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A2C5C',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#4A2C5C',
    lineHeight: 24,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  dateTimeCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#4A2C5C',
    marginLeft: 12,
  },
  allDayBadge: {
    backgroundColor: '#E6D5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  allDayText: {
    fontSize: 14,
    color: '#9B7EBD',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  infoText: {
    fontSize: 16,
    color: '#4A2C5C',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E6D5F5',
  },
  reminderText: {
    fontSize: 15,
    color: '#4A2C5C',
    marginLeft: 8,
  },
  actions: {
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#9B7EBD',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A2C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
