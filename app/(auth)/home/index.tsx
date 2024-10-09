import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../../context/AppContext';
import { format, parse, isToday, isFuture, compareAsc } from 'date-fns';
import { useRouter } from 'expo-router';

const externalLinks = [
  { title: 'Incident Report', url: 'https://bit.ly/ahlincidentreport' },
  { title: 'Video Review Report', url: 'https://bit.ly/ahlvideoreview' },
  { title: 'Rulebook', url: 'https://theahl.com/rules' },
  { title: 'AHL Google Drive', url: 'https://bit.ly/AHLOfficialsGoogleDrive24-25' },
];

export default function HomeScreen() {
  const { games, loading } = useAppContext();
  const router = useRouter();

  const todayEvent = games.find(game => isToday(parse(game.gameDate, 'MM/dd/yyyy', new Date())));
  const upcomingEvents = games
    .filter(game => isFuture(parse(game.gameDate, 'MM/dd/yyyy', new Date())))
    .sort((a, b) => compareAsc(parse(a.gameDate, 'MM/dd/yyyy', new Date()), parse(b.gameDate, 'MM/dd/yyyy', new Date())))
    .slice(0, 3);

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Don't know how to open this URL: ${url}`);
    }
  };

  const navigateToGameDetails = (gameId: string) => {
    router.push(`/home/${gameId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <ActivityIndicator size="large" color="#ff6600"/>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Today</Text>
        {todayEvent ? (
          <TouchableOpacity onPress={() => navigateToGameDetails(todayEvent.id)} style={styles.eventItem}>
            <Text style={styles.eventDate}>{format(parse(todayEvent.gameDate, 'MM/dd/yyyy', new Date()), 'MM-dd-yyyy')}</Text>
            <Text style={styles.eventDescription}>{`${todayEvent.awayTeam} @ ${todayEvent.homeTeam}`}</Text>
            <Text style={styles.eventArena}>{todayEvent.arenaName || 'Arena not specified'}</Text>
            <Text style={styles.eventTime}>{`${todayEvent.gameTime} ${todayEvent.timeZone || ''}`}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noEventText}>No Game Today</Text>
        )}
        <View style={styles.separator} />
        <Text style={styles.title}>Upcoming Games</Text>
        {upcomingEvents.map((event, index) => (
          <TouchableOpacity key={index} onPress={() => navigateToGameDetails(event.id)} style={styles.eventItem}>
            <Text style={styles.eventDate}>{format(parse(event.gameDate, 'MM/dd/yyyy', new Date()), 'MM-dd-yyyy')}</Text>
            <Text style={styles.eventDescription}>{`${event.awayTeam} @ ${event.homeTeam}`}</Text>
            <Text style={styles.eventArena}>{event.arenaName || 'Arena not specified'}</Text>
            <Text style={styles.eventTime}>{`${event.gameTime} ${event.timeZone || ''}`}</Text>
          </TouchableOpacity>
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
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 14,
    color: '#888',
  },
  eventArena: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 5,
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
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});
