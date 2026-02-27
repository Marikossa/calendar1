import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E6D5F5',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions');
      }
    };

    requestPermissions();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-event" options={{ presentation: 'modal', headerShown: true, title: 'New Event', headerStyle: { backgroundColor: '#FFF9F5' } }} />
      <Stack.Screen name="event-detail" options={{ headerShown: true, title: 'Event Details', headerStyle: { backgroundColor: '#FFF9F5' } }} />
      <Stack.Screen name="edit-event" options={{ presentation: 'modal', headerShown: true, title: 'Edit Event', headerStyle: { backgroundColor: '#FFF9F5' } }} />
    </Stack>
  );
}
