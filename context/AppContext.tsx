import React, { createContext, useContext, useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/FirebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AppContextType {
  user: User | null;
  userFullName: string;
  userPhoneNumber: string;
  games: any[];
  gameCount: number;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(FIREBASE_AUTH.currentUser);
  const [userFullName, setUserFullName] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [games, setGames] = useState([]);
  const [gameCount, setGameCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: User) => {
    setLoading(true);
    try {
      const userDocRef = collection(FIRESTORE_DB, 'roster');
      const userQuery = query(userDocRef, where('uid', '==', user.uid));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const fullName = `${userData.firstName} ${userData.lastName}`;
        setUserFullName(fullName);
        setUserPhoneNumber(userData.phoneNumber || '');
        
        const scheduleRef = collection(FIRESTORE_DB, 'schedule');
        const queries = [
          query(scheduleRef, where('referee1', '==', fullName)),
          query(scheduleRef, where('referee2', '==', fullName)),
          query(scheduleRef, where('linesperson1', '==', fullName)),
          query(scheduleRef, where('linesperson2', '==', fullName))
        ];

        const scheduleSnapshots = await Promise.all(queries.map(q => getDocs(q)));
        const allDocs = scheduleSnapshots.flatMap(snapshot => snapshot.docs);
        
        const fetchedGames = await Promise.all(allDocs.map(async (doc) => {
          const gameData = doc.data();
          const teamsRef = collection(FIRESTORE_DB, 'teams');
          
          const homeTeamDoc = await getDocs(query(teamsRef, where('city', '==', gameData.homeTeam)));
          const homeTeamData = homeTeamDoc.docs[0]?.data() || {};
          const homeTeamAbbr = homeTeamData.abbreviation || '';
          const arenaName = homeTeamData.arenaName || '';
          const timeZone = homeTeamData.timeZone || '';
          
          const awayTeamDoc = await getDocs(query(teamsRef, where('city', '==', gameData.awayTeam)));
          const awayTeamAbbr = awayTeamDoc.docs[0]?.data()?.abbreviation || '';

          return {
            ...gameData,
            homeTeamAbbr,
            awayTeamAbbr,
            arenaName,
            timeZone,
          };
        }));

        setGames(fetchedGames);
        setGameCount(fetchedGames.length);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserFullName('');
        setGames([]);
        setGameCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ user, userFullName, userPhoneNumber, games, gameCount, loading, refreshUserData }}>
      {children}
    </AppContext.Provider>
  );
};
