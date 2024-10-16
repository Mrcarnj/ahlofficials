import React, { createContext, useContext, useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/FirebaseConfig';
import { collection, query, where, getDocs, getDoc, doc, documentId, QueryDocumentSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// Define types for our data structures
interface RosterData {
  email: string;
  firstName: string;
  lastName: string;
  lastFirstFullName: string;
  phoneNumber: string;
  uid: string;
  rosterPhoto: string;
}

interface TeamData {
  abbreviation: string;
  arenaAddress: string;
  arenaName: string;
  assistantCoach1: string;
  assistantCoach2: string;
  city: string;
  equipmentManagerName: string;
  equipmentManagerPhone: string;
  headCoachName: string;
  headCoachPic: string;
  id: string;
  logo: string;
  timeZone: string;
}

interface ScheduleData {
  awayTeam: string;
  gameDate: string;
  gameID: string;
  gameTime: string;
  homeTeam: string;
  id: string;
  linesperson1: string;
  linesperson2: string;
  referee1: string;
  referee2: string;
}

export interface GameData extends ScheduleData {
  awayTeamData: TeamData;
  homeTeamData: TeamData;
  officials: {
    referee1: RosterData;
    referee2: RosterData;
    linesperson1: RosterData;
    linesperson2: RosterData;
  };
}

interface AppContextType {
  userData: RosterData | null;
  games: { [key: string]: GameData };
  loading: boolean;
}

const AppContext = createContext<AppContextType>({
  userData: null,
  games: {},
  loading: true,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<RosterData | null>(null);
  const [games, setGames] = useState<{ [key: string]: GameData }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user?.email) {
        setLoading(true);
        try {
          // Fetch user's roster data
          const userRosterData = await fetchUserRosterData(user.email);
          setUserData(userRosterData);

          if (userRosterData) {
            // Fetch schedule data for the user
            const scheduleData = await fetchScheduleData(userRosterData.lastFirstFullName);
            
            // Fetch additional data for all games in batch
            const gamesData = await fetchAllGamesData(scheduleData);
            setGames(gamesData);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  // Fetch user's roster data
  const fetchUserRosterData = async (email: string): Promise<RosterData | null> => {
    const rosterRef = collection(FIRESTORE_DB, 'roster');
    const q = query(rosterRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as RosterData;
      return { ...userData, uid: querySnapshot.docs[0].id };
    }
    return null;
  };

  // Fetch schedule data for the user
  const fetchScheduleData = async (lastFirstFullName: string): Promise<ScheduleData[]> => {
    console.log('Fetching schedule data for:', lastFirstFullName);
    const scheduleRef = collection(FIRESTORE_DB, 'schedule');
    const officialRoles = ['referee1', 'referee2', 'linesperson1', 'linesperson2'];
    
    // Create queries for each role
    const queries = officialRoles.map(role => 
      query(scheduleRef, where(role, '==', lastFirstFullName))
    );

    // Execute all queries
    const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));

    // Combine and deduplicate results
    const uniqueResults = new Map();
    querySnapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        if (!uniqueResults.has(doc.id)) {
          uniqueResults.set(doc.id, { ...doc.data(), id: doc.id });
        }
      });
    });

    const results = Array.from(uniqueResults.values()) as ScheduleData[];
    console.log('Schedule query result count:', results.length);

    return results;
  };

  // Fetch additional data for all games in batch
  const fetchAllGamesData = async (scheduleData: ScheduleData[]): Promise<{ [key: string]: GameData }> => {
    try {
      console.log('Schedule data:', scheduleData);

      const teamCities = new Set(scheduleData.flatMap(schedule => [schedule.awayTeam, schedule.homeTeam]));
      const officialNames = new Set(scheduleData.flatMap(schedule => [schedule.referee1, schedule.referee2, schedule.linesperson1, schedule.linesperson2]));

      console.log('Team cities:', Array.from(teamCities));
      console.log('Official names:', Array.from(officialNames));

      const [teamsData, officialsData] = await Promise.all([
        fetchTeamsData(Array.from(teamCities)),
        fetchOfficialsData(Array.from(officialNames))
      ]);

      console.log('Teams data:', teamsData);
      console.log('Officials data:', officialsData);

      const gamesData: { [key: string]: GameData } = {};
      for (const schedule of scheduleData) {
        gamesData[schedule.id] = {
          ...schedule,
          awayTeamData: teamsData[schedule.awayTeam],
          homeTeamData: teamsData[schedule.homeTeam],
          officials: {
            referee1: officialsData[schedule.referee1],
            referee2: officialsData[schedule.referee2],
            linesperson1: officialsData[schedule.linesperson1],
            linesperson2: officialsData[schedule.linesperson2]
          }
        };
      }

      console.log('Games data:', gamesData);
      return gamesData;
    } catch (error) {
      console.error('Error in fetchAllGamesData:', error);
      throw error;
    }
  };

  // Fetch team data for multiple cities in batch
  const fetchTeamsData = async (cities: string[]): Promise<{ [key: string]: TeamData }> => {
    const teamsData: { [key: string]: TeamData } = {};
    if (cities.length === 0) return teamsData;

    const teamsRef = collection(FIRESTORE_DB, 'teams');
    const q = query(teamsRef, where('city', 'in', cities));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as TeamData;
      teamsData[data.city] = { ...data, id: doc.id };
    });

    console.log('Fetched teams data:', teamsData); // Add this line for debugging
    return teamsData;
  };

  // Fetch officials' data in batch
  const fetchOfficialsData = async (officialNames: string[]): Promise<{ [key: string]: RosterData }> => {
    const officialsData: { [key: string]: RosterData } = {};
    if (officialNames.length === 0) return officialsData;

    const rosterRef = collection(FIRESTORE_DB, 'roster');
    const q = query(rosterRef, where('lastFirstFullName', 'in', officialNames));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      const data = doc.data() as RosterData;
      officialsData[data.lastFirstFullName] = { 
        ...data, 
        uid: doc.id,
        rosterPhoto: data.rosterPhoto || '' // Ensure rosterPhoto is always defined
      };
    });

    console.log('Fetched officials data:', officialsData);
    return officialsData;
  };

  return (
    <AppContext.Provider value={{ userData, games, loading }}>
      {children}
    </AppContext.Provider>
  );
};

