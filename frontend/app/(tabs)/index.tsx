import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share, RefreshControl, ImageBackground, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { EVENT_TYPE_CONFIG } from '../constants';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  // Reload events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  useEffect(() => {
    loadEventsForDay(selectedDate);
    createMarkedDates(events);
  }, [selectedDate, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/events?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const createMarkedDates = (eventsList) => {
    const marked = {};

    eventsList.forEach((event) => {
      const startDate = parseISO(event.start_date.split('T')[0]);
      const endDate = event.end_date ? parseISO(event.end_date.split('T')[0]) : startDate;
      
      // Mark all days in the event range
      const daysDiff = differenceInDays(endDate, startDate);
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        if (!marked[currentDate]) {
          marked[currentDate] = { dots: [], marked: true };
        }
        marked[currentDate].dots.push({
          color: EVENT_TYPE_CONFIG[event.event_type]?.color || '#4A2C5C',
        });
      }
    });

    // Add selection
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#FFB6D9';
    } else {
      marked[selectedDate] = { selected: true, selectedColor: '#FFB6D9' };
    }

    setMarkedDates(marked);
  };

  const loadEventsForDay = (date) => {
    const selectedDay = parseISO(date);
    const dayEvents = events.filter((event) => {
      const eventStart = parseISO(event.start_date.split('T')[0]);
      const eventEnd = event.end_date ? parseISO(event.end_date.split('T')[0]) : eventStart;
      
      // Check if selected day falls within event date range
      return selectedDay >= eventStart && selectedDay <= eventEnd;
    });
    setSelectedDayEvents(dayEvents);
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleEventPress = (event) => {
    router.push({
      pathname: '/event-detail',
      params: { eventId: event._id },
    });
  };

  const handleShareEvent = async (event) => {
    try {
      const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
      const startTime = event.all_day
        ? 'All day'
        : format(new Date(event.start_date), 'h:mm a');
      const date = format(new Date(event.start_date), 'EEEE, MMMM d, yyyy');

      const message = `📅 ${config.label}: ${event.title}\n📆 ${date}\n⏰ ${startTime}${event.description ? `\n\n${event.description}` : ''}`;

      await Share.share({
        message,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const renderEventItem = (event) => {
    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
    const startTime = event.all_day
      ? 'All day'
      : format(new Date(event.start_date), 'h:mm a');

    return (
      <TouchableOpacity
        key={event._id}
        style={[styles.eventCard, { borderLeftColor: config.color }]}
        onPress={() => handleEventPress(event)}
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>{startTime}</Text>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={1}>
              {event.description}
            </Text>
          )}
          {event.guests && event.guests.length > 0 && (
            <View style={styles.guestsRow}>
              <Ionicons name="people-outline" size={12} color="#9B7EBD" />
              <Text style={styles.guestsText}>{event.guests.length} guest{event.guests.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShareEvent(event)}
        >
          <Ionicons name="share-outline" size={20} color="#9B7EBD" />
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Lady's Calendar</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4789"
            colors={['#8B4789']}
          />
        }
      >
        {/* Year Selector */}
        <View style={styles.yearSelectorContainer}>
          <TouchableOpacity
            style={styles.yearButton}
            onPress={() => setShowYearPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8B4789" />
            <Text style={styles.yearButtonText}>
              {format(new Date(currentMonth), 'yyyy')}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8B4789" />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={currentMonth}
            onDayPress={handleDayPress}
            onMonthChange={(month) => setCurrentMonth(month.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              calendarBackground: 'rgba(255, 255, 255, 0.95)',
              textSectionTitleColor: '#8B4789',
              selectedDayBackgroundColor: '#FFB6D9',
              selectedDayTextColor: '#8B4789',
              todayTextColor: '#D946A6',
              dayTextColor: '#5C3D5E',
              textDisabledColor: '#D3B5D3',
              dotColor: '#D946A6',
              selectedDotColor: '#8B4789',
              arrowColor: '#8B4789',
              monthTextColor: '#8B4789',
              indicatorColor: '#D946A6',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {/* Events for Selected Day */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {format(new Date(selectedDate), 'EEEE, MMMM d')}
            </Text>
            <Text style={styles.eventsCount}>
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#9B7EBD" style={styles.loader} />
          ) : selectedDayEvents.length > 0 ? (
            selectedDayEvents.map(renderEventItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D3D3D3" />
              <Text style={styles.emptyStateText}>No events for this day</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-event')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.yearPickerModal}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <ScrollView style={styles.yearList}>
              {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    year === parseInt(format(new Date(currentMonth), 'yyyy')) && styles.yearItemSelected,
                  ]}
                  onPress={() => {
                    const newDate = format(new Date(year, new Date(currentMonth).getMonth(), 1), 'yyyy-MM-dd');
                    setCurrentMonth(newDate);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.yearItemText,
                      year === parseInt(format(new Date(currentMonth), 'yyyy')) && styles.yearItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontFamily: 'Georgia', // Elegant serif as fallback for script
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
  calendarContainer: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#8B4789',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsSection: {
    padding: 16,
    paddingBottom: 100,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    borderRadius: 12,
  },
  eventsSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B4789',
  },
  eventsCount: {
    fontSize: 14,
    color: '#D946A6',
    fontStyle: 'italic',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 182, 217, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C3D5E',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#8B4789',
  },
  eventDescription: {
    fontSize: 12,
    color: '#9E7B9E',
    marginTop: 4,
  },
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  guestsText: {
    fontSize: 12,
    color: '#D946A6',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9E7B9E',
    marginTop: 16,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D946A6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B4789',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  yearSelectorContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#8B4789',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  yearButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4789',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '80%',
    maxHeight: '70%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8B4789',
    textAlign: 'center',
    marginBottom: 20,
  },
  yearList: {
    maxHeight: 300,
  },
  yearItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  yearItemSelected: {
    backgroundColor: '#E6D5F5',
  },
  yearItemText: {
    fontSize: 18,
    color: '#5C3D5E',
    textAlign: 'center',
  },
  yearItemTextSelected: {
    color: '#8B4789',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#D946A6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
