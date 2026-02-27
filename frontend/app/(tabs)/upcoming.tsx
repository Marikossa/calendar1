import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const EVENT_TYPE_CONFIG = {
  meeting: { icon: 'briefcase', color: '#9B7EBD' },
  birthday: { icon: 'cake', color: '#FFB6C6' },
  appointment: { icon: 'calendar-check', color: '#A8D5E2' },
  social: { icon: 'people', color: '#E6D5F5' },
  personal: { icon: 'heart', color: '#FFD6E8' },
  other: { icon: 'star', color: '#D4AF37' },
};

export default function UpcomingScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/events?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        // Sort by date
        const sorted = data.sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        setEvents(sorted);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUpcomingEvents();
  };

  const handleEventPress = (event) => {
    router.push({
      pathname: '/event-detail',
      params: { eventId: event._id },
    });
  };

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'EEEE, MMM d');
  };

  const renderEventItem = (event) => {
    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
    const dateLabel = getDateLabel(event.start_date);
    const startTime = event.all_day
      ? 'All day'
      : format(parseISO(event.start_date), 'h:mm a');

    return (
      <TouchableOpacity
        key={event._id}
        style={[styles.eventCard, { borderLeftColor: config.color }]}
        onPress={() => handleEventPress(event)}
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name={config.icon as any} size={28} color={config.color} />
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} color="#9B7EBD" />
            <Text style={styles.eventDate}>{dateLabel}</Text>
            <Ionicons name="time-outline" size={14} color="#9B7EBD" style={styles.timeIcon} />
            <Text style={styles.eventTime}>{startTime}</Text>
          </View>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
          {event.recurrence && event.recurrence.type !== 'none' && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={12} color="#9B7EBD" />
              <Text style={styles.recurringText}>Recurring</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Decorative Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <Text style={styles.headerSubtitle}>Your schedule awaits</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9B7EBD"
            colors={['#9B7EBD']}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#9B7EBD" style={styles.loader} />
        ) : events.length > 0 ? (
          events.map(renderEventItem)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D3D3D3" />
            <Text style={styles.emptyStateTitle}>No upcoming events</Text>
            <Text style={styles.emptyStateText}>Your calendar is clear</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-event')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFE5EC',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A2C5C',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9B7EBD',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#4A2C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A2C5C',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#9B7EBD',
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 12,
  },
  eventTime: {
    fontSize: 14,
    color: '#9B7EBD',
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
    lineHeight: 18,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E6D5F5',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 11,
    color: '#9B7EBD',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A2C5C',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B7EBD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
    marginTop: 60,
  },
});
