import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { EVENT_TYPE_CONFIG } from '../constants';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

  // Group events by month
  const groupEventsByMonth = (eventsList) => {
    const grouped = {};
    eventsList.forEach((event) => {
      const monthYear = format(parseISO(event.start_date), 'MMMM yyyy');
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(event);
    });
    return grouped;
  };

  const renderEventItem = (event) => {
    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.meeting;
    const dateLabel = getDateLabel(event.start_date);
    const startTime = event.all_day
      ? 'All day'
      : format(parseISO(event.start_date), 'h:mm a');

    return (
      <TouchableOpacity
        key={`${event._id}-${event.start_date}`}
        style={[styles.eventCard, { borderLeftColor: config.color }]}
        onPress={() => handleEventPress(event)}
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name={config.icon as any} size={28} color={config.color} />
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} color="#8B4789" />
            <Text style={styles.eventDate}>{dateLabel}</Text>
            <Ionicons name="time-outline" size={14} color="#8B4789" style={styles.timeIcon} />
            <Text style={styles.eventTime}>{startTime}</Text>
          </View>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
          {event.recurrence && event.recurrence.type !== 'none' && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={12} color="#8B4789" />
              <Text style={styles.recurringText}>Recurring</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/lady-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4789"
            colors={['#8B4789']}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#8B4789" style={styles.loader} />
        ) : events.length > 0 ? (
          <>
            {Object.entries(groupEventsByMonth(events)).map(([monthYear, monthEvents]) => (
              <View key={monthYear} style={styles.monthSection}>
                <Text style={styles.monthHeader}>{monthYear}</Text>
                {monthEvents.map(renderEventItem)}
              </View>
            ))}
          </>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    color: '#8B4789',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#8B4789',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 182, 217, 0.3)',
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
    color: '#5C3D5E',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#8B4789',
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 12,
  },
  eventTime: {
    fontSize: 14,
    color: '#8B4789',
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#9E7B9E',
    marginTop: 4,
    lineHeight: 18,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 182, 217, 0.5)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 11,
    color: '#8B4789',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B4789',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9E7B9E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D946A6',
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
