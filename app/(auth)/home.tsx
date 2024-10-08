import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../config/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, parse, isToday, isFuture, compareAsc } from 'date-fns';

const externalLinks = [
  { title: 'Rulebook', url: 'https://theahl.com/rules' },
  { title: 'Expo Docs', url: 'https://docs.expo.dev/' },
];

export default function HomeScreen() {
  const [user, setUser] = useState(FIREBASE_AUTH.currentUser);
  const [todayEvent, setTodayEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchUserGames = async () => {
      if (user) {
        const userDocRef = collection(FIRESTORE_DB, 'roster');
        const userQuery = query(userDocRef, where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          const fullName = `${userData.firstName} ${userData.lastName}`;
          
          const scheduleRef = collection(FIRESTORE_DB, 'schedule');
          const queries = [
            query(scheduleRef, where('referee1', '==', fullName)),
            query(scheduleRef, where('referee2', '==', fullName)),
            query(scheduleRef, where('linesperson1', '==', fullName)),
            query(scheduleRef, where('linesperson2', '==', fullName))
          ];

          const scheduleSnapshots = await Promise.all(queries.map(q => getDocs(q)));
          const allDocs = scheduleSnapshots.flatMap(snapshot => snapshot.docs);
          
          const events = await Promise.all(allDocs.map(async (doc) => {
            const gameData = doc.data();
            const gameDate = parse(gameData.gameDate, 'MM/dd/yyyy', new Date());
            const formattedDate = format(gameDate, 'MM-dd-yyyy');

            return {
              date: formattedDate,
              description: `${gameData.awayTeam} @ ${gameData.homeTeam}`,
              gameTime: gameData.gameTime,
            };
          }));

          const today = new Date();
          const todayEvent = events.find(event => isToday(parse(event.date, 'MM-dd-yyyy', new Date())));
          const futureEvents = events
            .filter(event => isFuture(parse(event.date, 'MM-dd-yyyy', new Date())))
            .sort((a, b) => compareAsc(parse(a.date, 'MM-dd-yyyy', new Date()), parse(b.date, 'MM-dd-yyyy', new Date())))
            .slice(0, 3);

          setTodayEvent(todayEvent || null);
          setUpcomingEvents(futureEvents);
        }
      }
    };

    fetchUserGames();
  }, [user]);

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
            <Text style={styles.eventDate}>{todayEvent.date}</Text>
            <Text style={styles.eventDescription}>{todayEvent.description}</Text>
            <Text style={styles.eventTime}>{todayEvent.gameTime}</Text>
          </View>
        ) : (
          <Text style={styles.noEventText}>No Game Today</Text>
        )}
        <View style={styles.separator} />
        <Text style={styles.title}>Upcoming Games</Text>
        {upcomingEvents.map((event, index) => (
          <View key={index} style={styles.eventItem}>
            <Text style={styles.eventDate}>{event.date}</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
            <Text style={styles.eventTime}>{event.gameTime}</Text>
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
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 14,
    color: '#888',
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
