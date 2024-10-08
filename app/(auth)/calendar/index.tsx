import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parse } from 'date-fns';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;
const calendarWidth = screenWidth * 0.98; // 98% of screen width


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
          console.log('User fullName:', fullName); // Add this line to log the fullName
          
          const scheduleRef = collection(FIRESTORE_DB, 'schedule');                                                                                                                                                                                                                          
           const scheduleQuery = query(                                                                                                                                                                                                                                                       
             scheduleRef,                                                                                                                                                                                                                                                                     
             where('referee1', '==', fullName)                                                                                                                                                                                                                                                
           );                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                              
           const scheduleSnapshot = await getDocs(scheduleQuery);                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                              
           console.log('Number of matching documents:', scheduleSnapshot.size);                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                              
           const newMarkedDates = {};                                                                                                                                                                                                                                                         
           scheduleSnapshot.forEach((doc) => {                                                                                                                                                                                                                                                
             const gameData = doc.data();                                                                                                                                                                                                                                                     
             console.log('Game data:', gameData);                                                                                                                                                                                                                                             
             if (                                                                                                                                                                                                                                                                             
               gameData.referee1 === fullName ||                                                                                                                                                                                                                                              
               gameData.referee2 === fullName ||                                                                                                                                                                                                                                              
               gameData.linesperson1 === fullName ||                                                                                                                                                                                                                                          
               gameData.linesperson2 === fullName                                                                                                                                                                                                                                             
             ) {                                                                                                                                                                                                                                                                              
               const gameDate = parse(gameData.gameDate, 'MM/dd/yyyy', new Date());                                                                                                                                                                                                           
               const formattedDate = format(gameDate, 'yyyy-MM-dd');                                                                                                                                                                                                                          
               newMarkedDates[formattedDate] = {                                                                                                                                                                                                                                              
                 customStyles: { container: { backgroundColor: '#ff6600' } }                                                                                                                                                                                                                  
               };                                                                                                                                                                                                                                                                             
             }                                                                                                                                                                                                                                                                                
           }); 
          
          console.log('Marked dates:', newMarkedDates); // Log the final marked dates
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
