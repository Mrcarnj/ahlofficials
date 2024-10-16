import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isToday, isFuture, compareAsc, addDays, differenceInDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { getFirestoreReadCount } from '../../../utils/firestoreLogger';
import { GameData, useAppContext } from '../../../context/AppContext';

const externalLinks = [
  { title: 'Incident Report', url: 'https://bit.ly/ahlincidentreport' },
  { title: 'Video Review Report', url: 'https://bit.ly/ahlvideoreview' },
  { title: 'Rulebook', url: 'https://theahl.com/rules' },
  { title: 'AHL Google Drive', url: 'https://bit.ly/AHLOfficialsGoogleDrive24-25' },
];

export default function HomeScreen() {
  const { games, loading, userData } = useAppContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    console.log('Games from context:', games);
    console.log('Number of games:', Object.keys(games).length);
  }, [games]);

  useEffect(() => {
    const fetchReadCount = async () => {
      const count = await getFirestoreReadCount();
      setReadCount(count);
    };
    fetchReadCount();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Implement refresh functionality in AppContext
    const newCount = await getFirestoreReadCount();
    setReadCount(newCount);
    setRefreshing(false);
  }, []);

  const getNextExpenseReportDue = useCallback(() => {
    const startDate = new Date(2024, 9, 21); // October 21, 2024
    const endDate = new Date(2025, 5, 30); // June 30, 2025
    const today = new Date();
    let nextDueDate = startDate;

    while (nextDueDate <= endDate) {
      if (nextDueDate >= today) {
        const daysUntilDue = differenceInDays(addDays(nextDueDate, 1), today);
        const rangeEndDate = new Date(nextDueDate);
        const rangeStartDate = new Date(rangeEndDate);
        rangeStartDate.setDate(rangeStartDate.getDate() - 14);

        const dateRange = `${format(rangeStartDate, 'MMMM d')} - ${format(addDays(rangeEndDate, -1), 'MMMM d')}`;

        if (daysUntilDue === 0) {
          return { text: "TODAY by 12pm EST", isToday: true, dateRange };
        } else if (daysUntilDue === 1) {
          return { text: "TOMORROW", isTomorrow: true, dateRange };
        } else {
          return { text: `${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`, isToday: false, isTomorrow: false, dateRange };
        }
      }
      nextDueDate = addDays(nextDueDate, 14); // Add two weeks
    }

    return { text: "No more expense reports due", isToday: false, isTomorrow: false, dateRange: "" };
  }, []);

  const userGames = useMemo(() => {
    if (!userData) return [];
    return Object.values(games).filter(game => 
      game.referee1 === userData.lastFirstFullName ||
      game.referee2 === userData.lastFirstFullName ||
      game.linesperson1 === userData.lastFirstFullName ||
      game.linesperson2 === userData.lastFirstFullName
    );
  }, [games, userData]);

  const todayEvent = useMemo(() => 
    userGames.find(game => isToday(parse(game.gameDate, 'MM/dd/yyyy', new Date()))),
    [userGames]
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return userGames
      .filter(game => {
        const gameDate = parse(game.gameDate, 'MM/dd/yyyy', new Date());
        return gameDate > today;
      })
      .sort((a, b) => compareAsc(parse(a.gameDate, 'MM/dd/yyyy', new Date()), parse(b.gameDate, 'MM/dd/yyyy', new Date())))
      .slice(0, 3);
  }, [userGames]);

  const openLink = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Don't know how to open this URL: ${url}`);
    }
  }, []);

  const navigateToGameDetails = useCallback((gameId: string) => {
    router.push(`/home/${gameId}`);
  }, [router]);

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
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6600']}
            tintColor="#ff6600"
          />
        }
      >
        <Text style={styles.title}>Today</Text>
        {todayEvent ? (
          <TouchableOpacity onPress={() => navigateToGameDetails(todayEvent.id)} style={styles.eventItem}>
            <View style={styles.eventContent}>
              <Text style={styles.eventDate}>{format(parse(todayEvent.gameDate, 'MM/dd/yyyy', new Date()), 'MM-dd-yyyy')}</Text>
              <Text style={styles.eventDescription}>{`${todayEvent.awayTeam} @ ${todayEvent.homeTeam}`}</Text>
              <Text style={styles.eventArena}>{todayEvent.homeTeamData?.arenaName || 'Arena not specified'} // {`${todayEvent.gameTime} ${todayEvent.homeTeamData?.timeZone || ''}`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ff6600" style={styles.arrowIcon} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.noEventText}>No Game Today</Text>
        )}
        <View style={styles.separator} />
        <View style={styles.expenseReportContainer}>
          <Text style={styles.reportTitle}>Expense Report Due: </Text>
          {(() => {
            const { text, isToday, isTomorrow, dateRange } = getNextExpenseReportDue();
            return (
              <>
                <Text style={[
                  styles.expenseReportText, 
                  isToday && styles.expenseReportToday,
                  isTomorrow && styles.expenseReportTomorrow
                ]}>
                  {text}
                </Text>
              </>
            );
          })()}
        </View>
        {(() => {
          const { dateRange } = getNextExpenseReportDue();
          return dateRange ? (
            <Text style={styles.dateRangeText}>
              Date Range Due: {dateRange}
            </Text>
          ) : null;
        })()}
        <View style={styles.separator} />
        <Text style={styles.title}>Upcoming Games</Text>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event, index) => (
            <TouchableOpacity key={index} onPress={() => navigateToGameDetails(event.id)} style={styles.eventItem}>
              <View style={styles.eventContent}>
                <Text style={styles.eventDate}>{format(parse(event.gameDate, 'MM/dd/yyyy', new Date()), 'MM-dd-yyyy')}</Text>
                <Text style={styles.eventDescription}>{`${event.awayTeam} @ ${event.homeTeam}`}</Text>
                <Text style={styles.eventArena}>{event.homeTeamData?.arenaName || 'Arena not specified'} // {`${event.gameTime} ${event.homeTeamData?.timeZone || ''}`}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ff6600" style={styles.arrowIcon} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noEventText}>No upcoming games</Text>
        )}
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
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  readCountText: {
    color: '#ff6600',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
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
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  expenseReportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventContent: {
    flex: 1,
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
  arrowIcon: {
    marginLeft: 10,
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
  expenseReportText: {
    fontSize: 18,
    color: '#ff6600',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 5,
  },
  expenseReportToday: {
    fontWeight: 'bold',
    color: '#ff0000',
  },
  expenseReportTomorrow: {
    fontWeight: 'bold',
    color: '#ffa500',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});
