import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



type RootStackParamList = {
    eventDetails: { date: string; event: { description: string } };
  };
  
  type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'eventDetails'>;


const screenWidth = Dimensions.get('window').width;
const calendarWidth = screenWidth * 0.98; // 98% of screen width

export const mockEvents = {
    '2024-09-15': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 1' },
  '2024-09-20': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 2' },
  '2024-09-25': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 3' },
  '2024-10-05': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 4' },
  '2024-10-10': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 5' },
  '2024-10-15': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 6' },
};

export default function CalendarScreen() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const navigation = useNavigation<CalendarScreenNavigationProp>();
  
    const onMonthChange = (month: DateData) => {
      setCurrentMonth(new Date(month.timestamp));
    };
  
    const onDayPress = (day: DateData) => {
      const selectedDate = day.dateString;
      const event = mockEvents[selectedDate as keyof typeof mockEvents];
      if (event) {
        navigation.navigate('eventDetails', { date: selectedDate, event });
      }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <Calendar
        current={format(currentMonth, 'yyy-MM-dd')}
        onMonthChange={onMonthChange}
        onDayPress={onDayPress}
        monthFormat={'MMMM yyyy'}
        enableSwipeMonths={true}
        hideExtraDays={false}
        firstDay={0}
        showFiveWeeks={true}
        style={styles.calendar}
        markingType={'custom'}
        markedDates={mockEvents}
        theme={calendarTheme as any}
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
      height: (calendarWidth * 1.4) / 6, // Adjusted for taller days
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      borderWidth: 0.5,
      borderColor: '#333333',
      paddingTop: 5,
      paddingLeft: 5,
    },
    text: {
      fontSize: 16,
      fontWeight: '300',
      color: '#ffffff',
      backgroundColor: 'transparent',
    },
    today: {
      borderColor: '#ffffff',
      borderWidth: 2,
    },
    todayText: {
      fontWeight: 'bold',
    },
  },
};
