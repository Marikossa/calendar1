import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the main calendar tab
  return <Redirect href="/(tabs)" />;
}
