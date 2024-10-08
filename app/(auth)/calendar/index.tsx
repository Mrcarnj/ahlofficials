import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parse } from 'date-fns';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;
const calendarWidth = screenWidth * 0.98; // 98% of screen width

type CustomMarking = {
  gameTime?: React.JSX.Element;
  customStyles?: {
    container?: ViewStyle;
    text?: TextStyle;
  };
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  text?: string;
};

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState({});
  const [user, setUser] = useState(FIREBASE_AUTH.currentUser);

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
          
          const newMarkedDates = {};
          const teamsRef = collection(FIRESTORE_DB, 'teams');

          for (const doc of allDocs) {
            const gameData = doc.data();
            const gameDate = parse(gameData.gameDate, 'MM/dd/yyyy', new Date());
            const formattedDate = format(gameDate, 'yyyy-MM-dd');
            const gameTime = gameData.gameTime;

            // Fetch home team abbreviation
            const homeTeamDoc = await getDocs(query(teamsRef, where('city', '==', gameData.homeTeam)));
            const homeTeamAbbr = homeTeamDoc.docs[0]?.data().abbreviation || '';

            // Fetch away team abbreviation
            const awayTeamDoc = await getDocs(query(teamsRef, where('city', '==', gameData.awayTeam)));
            const awayTeamAbbr = awayTeamDoc.docs[0]?.data().abbreviation || '';

            console.log(`Debug - Date: ${formattedDate}`);
            console.log(`Debug - Home Team City: ${gameData.homeTeam}, Abbreviation: ${homeTeamAbbr}`);
            console.log(`Debug - Away Team City: ${gameData.awayTeam}, Abbreviation: ${awayTeamAbbr}`);

            newMarkedDates[formattedDate] = {
              selected: true,
              text: `${awayTeamAbbr}\n@\n${homeTeamAbbr}`,
              gameTime: gameTime,
            };
          }
          
          setMarkedDates(newMarkedDates);
        }
      }
    };

    fetchUserGames();
  }, [user]);

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Calendar
          current={format(currentMonth, 'yyyy-MM-dd')}
          onMonthChange={onMonthChange}
          monthFormat={'MMMM yyyy'}
          enableSwipeMonths={true}
          hideExtraDays={false}
          firstDay={0}
          showFiveWeeks={true}
          style={styles.calendar}
          markingType={'custom'}
          markedDates={markedDates}
          theme={calendarTheme as any}
          dayComponent={({date, state, marking}: {date?: DateData; state?: string; marking?: CustomMarking}) => {
            const isDisabled = state === 'disabled';
            const isToday = state === 'today';
            return (
              <View style={[
                styles.dayContainer,
                marking?.selected && styles.selectedDayContainer,
                isToday && styles.todayContainer
              ]}>
                <Text style={[
                  styles.dayText,
                  isDisabled && styles.disabledDayText
                ]}>
                  {date?.day}
                </Text>
                {marking?.text && (
                  <>
                    <Text style={styles.gameInfo}>{marking.text}</Text>
                    {marking.gameTime && (
                      <Text style={styles.gameTime}>{marking.gameTime}</Text>
                    )}
                  </>
                )}
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    width: screenWidth,
    borderWidth: 0,
  },
  dayContainer: {
    width: calendarWidth / 7,
    height: (calendarWidth * 1.4) / 6,
    justifyContent: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#333333',
    padding: 2,
  },
  selectedDayContainer: {
    backgroundColor: '#ff6600',
    borderRadius: 5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  gameInfo: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 3,
  },
  gameTime: {
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 12,
  },
  disabledDayText: {
    color: '#444444',
  },
  todayContainer: {
    borderColor: '#ffffff',
    borderWidth: 2,
  },
});

const calendarTheme = {
  backgroundColor: '#000000',
  calendarBackground: '#000000',
  textSectionTitleColor: '#ffffff',
  selectedDayBackgroundColor: '#ff6600',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#ff6600',
  dayTextColor: '#ffffff',
  textDisabledColor: '#444444',
  arrowColor: '#ff6600',
  monthTextColor: '#ffffff',
  indicatorColor: '#ff6600',
  textDayFontWeight: '300',
  textMonthFontWeight: 'bold',
  textDayHeaderFontWeight: '300',
  textDayFontSize: 16,
  textMonthFontSize: 20,
  textDayHeaderFontSize: 14,
  'stylesheet.calendar.main': {
    week: {
      marginTop: 0,
      marginBottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  },
  'stylesheet.calendar.header': {
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 10,
      paddingRight: 10,
      marginTop: 6,
      alignItems: 'center',
    },
  },
  'stylesheet.day.basic': {
    base: {
      width: calendarWidth / 7,
      height: (calendarWidth * 1.4) / 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: '#333333',
    },
    text: {
      fontSize: 16,
      fontWeight: '300',
      color: '#ffffff',
      backgroundColor: 'transparent',
      textAlign: 'center',
    },
    today: {
      borderColor: '#ffffff',
      borderWidth: 1,
    },
    todayText: {
      fontWeight: 'bold',
      color: '#ffffff',
    },
    disabledText: {
      color: '#444444',
    },
  },
};
