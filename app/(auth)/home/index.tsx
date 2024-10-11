import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../../context/AppContext';
import { format, parse, isToday, isFuture, compareAsc, addDays, differenceInDays } from 'date-fns';
import { useRouter } from 'expo-router';

const externalLinks = [
  { title: 'Incident Report', url: 'https://bit.ly/ahlincidentreport' },
  { title: 'Video Review Report', url: 'https://bit.ly/ahlvideoreview' },
  { title: 'Rulebook', url: 'https://theahl.com/rules' },
  { title: 'AHL Google Drive', url: 'https://bit.ly/AHLOfficialsGoogleDrive24-25' },
];

export default function HomeScreen() {
  const { games, loading, refreshUserData } = useAppContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  }, [refreshUserData]);

  const getNextExpenseReportDue = () => {
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
  };

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
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6600']} // customize the loading spinner color
            tintColor="#ff6600" // for iOS
          />
        }
      >
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
        {upcomingEvents.map((event, index) => (
          <TouchableOpacity key={index} onPress={() => navigateToGameDetails(event.id)} style={styles.eventItem}>
            <View style={styles.eventContent}>
              <Text style={styles.eventDate}>{format(parse(event.gameDate, 'MM/dd/yyyy', new Date()), 'MM-dd-yyyy')}</Text>
              <Text style={styles.eventDescription}>{`${event.awayTeam} @ ${event.homeTeam}`}</Text>
              <Text style={styles.eventArena}>{event.arenaName || 'Arena not specified'} // {`${event.gameTime} ${event.timeZone || ''}`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ff6600" style={styles.arrowIcon} />
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
