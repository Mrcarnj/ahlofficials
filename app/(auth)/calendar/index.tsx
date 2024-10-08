import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ViewStyle, TextStyle, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parse } from 'date-fns';
import { useAppContext } from '../../../context/AppContext';
import { useRouter } from 'expo-router';

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
  const { games, loading } = useAppContext();
  const router = useRouter();

  const markedDates = games.reduce((acc, game) => {
    const formattedDate = format(parse(game.gameDate, 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd');
    acc[formattedDate] = {
      selected: true,
      text: `${game.awayTeamAbbr}\n@\n${game.homeTeamAbbr}`,
      gameTime: game.gameTime,
      documentId: game.id, // Assuming each game object has an 'id' field
    };
    return acc;
  }, {});

  const onDayPress = (day: DateData) => {
    const selectedDate = day.dateString;
    const selectedGame = markedDates[selectedDate];
    if (selectedGame && selectedGame.documentId) {
      router.push(`/calendar/${selectedGame.documentId}`);
    }
  };

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
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
          onDayPress={onDayPress}
          dayComponent={({date, state, marking}: {date?: DateData; state?: string; marking?: CustomMarking}) => {
            const isDisabled = state === 'disabled';
            const isToday = state === 'today';
            return (
              <TouchableOpacity
                onPress={() => date && onDayPress(date)}
                style={[
                  styles.dayContainer,
                  marking?.selected && styles.selectedDayContainer,
                  isToday && styles.todayContainer
                ]}
              >
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
              </TouchableOpacity>
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
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
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
};
