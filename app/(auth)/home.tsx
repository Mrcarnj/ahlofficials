import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockEvents } from './calendar';

const getTodayEvent = () => {
  const today = new Date().toISOString().split('T')[0];
  return mockEvents[today as keyof typeof mockEvents] || null;
};

const getUpcomingEvents = () => {
  const today = new Date();
  const upcomingEvents = Object.entries(mockEvents)
    .filter(([date]) => new Date(date) > today)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(0, 3);
  return upcomingEvents;
};

const externalLinks = [
  { title: 'Rulebook', url: 'https://theahl.com/rules' },
  { title: 'Expo Docs', url: 'https://docs.expo.dev/' },
];

export default function HomeScreen() {
  const todayEvent = getTodayEvent();
  const upcomingEvents = getUpcomingEvents();

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Today</Text>
      {todayEvent ? (
        <View style={styles.eventItem}>
          <Text style={styles.eventDate}>{new Date().toISOString().split('T')[0]}</Text>
          <Text style={styles.eventDescription}>{todayEvent.description}</Text>
        </View>
      ) : (
        <Text style={styles.noEventText}>No Game Today</Text>
      )}
      <View style={styles.separator} />
      <Text style={styles.title}>Upcoming Games</Text>
      {upcomingEvents.map(([date, event]) => (
        <View key={date} style={styles.eventItem}>
          <Text style={styles.eventDate}>{date}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>
      ))}
      <View style={styles.separator} />
      <Text style={styles.title}>External Links</Text>
      {externalLinks.map((link, index) => (
        <TouchableOpacity key={index} onPress={() => openLink(link.url)} style={styles.linkButton}>
          <Text style={styles.link}>{link.title}</Text>
        </TouchableOpacity>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  eventItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  eventDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 16,
    color: '#fff',
  },
  separator: {
    marginVertical: 25,
    height: 1,
    width: '100%',
    backgroundColor: '#333',
  },
  linkButton: {
    backgroundColor: '#ff6600',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  link: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  noEventText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
  },
});