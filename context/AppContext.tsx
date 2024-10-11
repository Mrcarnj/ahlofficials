import React, { createContext, useContext, useState, useEffect } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/FirebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AppUser extends User {
  role?: string;
}

interface AppContextType {
  user: AppUser | null;
  userFullName: string;
  userPhoneNumber: string;
  userRole: string;
  games: any[];
  gameCount: number;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  fetchGameAndTeams: (gameId: string) => Promise<any>;
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
  const [user, setUser] = useState<AppUser | null>(FIREBASE_AUTH.currentUser);
  const [userFullName, setUserFullName] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [userRole, setUserRole] = useState('');
  const [games, setGames] = useState([]);
  const [gameCount, setGameCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: AppUser) => {
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
        setUserRole(userData.role || 'user');
        user.role = userData.role || 'user';
        
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
          const arenaAddress = homeTeamData.arenaAddress || '';
          const timeZone = homeTeamData.timeZone || '';
          const homeHeadCoachPic = homeTeamData.headCoachPic || '';
          const homeEquiptmentManager = homeTeamData.equipmentManagerName || '';
          const homeEquiptmentManagerPhone = homeTeamData.equipmentManagerPhone || '';
          
          const awayTeamDoc = await getDocs(query(teamsRef, where('city', '==', gameData.awayTeam)));
          const awayTeamData = awayTeamDoc.docs[0]?.data() || {};
          const awayTeamAbbr = awayTeamData.abbreviation || '';
          const awayHeadCoachPic = awayTeamData.headCoachPic || '';
          const awayEquiptmentManager = awayTeamData.equipmentManagerName || '';
          const awayEquiptmentManagerPhone = awayTeamData.equipmentManagerPhone || '';

          return {
            ...gameData,
            homeTeamAbbr,
            awayTeamAbbr,
            arenaName,
            arenaAddress,
            timeZone,
            homeHeadCoachPic,
            awayHeadCoachPic,
            homeEquiptmentManager,
            homeEquiptmentManagerPhone,
            awayEquiptmentManager,
            awayEquiptmentManagerPhone
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

  const fetchGameAndTeams = async (gameId: string) => {
    try {
      const docRef = doc(FIRESTORE_DB, 'schedule', gameId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const gameData = docSnap.data();

        // Fetch team logos, arena name, and equipment manager info
        const teamsRef = collection(FIRESTORE_DB, 'teams');
        const teamsQuery = query(teamsRef, where('city', 'in', [gameData.awayTeam, gameData.homeTeam]));
        const teamsSnapshot = await getDocs(teamsQuery);

        const logos = {};
        const coaches = {};
        let arenaName = '';
        let arenaAddress = '';
        let timeZone = '';
        let homeEquiptmentManager = '';
        let homeEquiptmentManagerPhone = '';
        let awayEquiptmentManager = '';
        let awayEquiptmentManagerPhone = '';

        teamsSnapshot.forEach((doc) => {
          const teamData = doc.data();
          logos[teamData.city] = teamData.logo;
          coaches[teamData.city] = {
            name: teamData.headCoachName,
            picture: teamData.headCoachPic
          };
          if (teamData.city === gameData.homeTeam) {
            arenaName = teamData.arenaName;
            arenaAddress = teamData.arenaAddress;
            timeZone = teamData.timeZone;
            homeEquiptmentManager = teamData.equipmentManagerName || '';
            homeEquiptmentManagerPhone = teamData.equipmentManagerPhone || '';
          } else if (teamData.city === gameData.awayTeam) {
            awayEquiptmentManager = teamData.equipmentManagerName || '';
            awayEquiptmentManagerPhone = teamData.equipmentManagerPhone || '';
          }
        });

        // Fetch roster data
        const rosterRef = collection(FIRESTORE_DB, 'roster');
        const rosterSnapshot = await getDocs(rosterRef);
        const rosterData = rosterSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as { firstName: string; lastName: string })
        }));

        // Match referees with roster data
        const matchReferee = async (refereeName) => {
          const [firstName, lastName] = refereeName.split(' ');
          const matchedRef = rosterData.find(ref => 
            ref.firstName.toLowerCase() === firstName.toLowerCase() && 
            ref.lastName.toLowerCase() === lastName.toLowerCase()
          );
          if (matchedRef) {
            const rosterDocRef = doc(FIRESTORE_DB, 'roster', matchedRef.id);
            const rosterDocSnap = await getDoc(rosterDocRef);
            if (rosterDocSnap.exists()) {
              const rosterData = rosterDocSnap.data();
              return { id: matchedRef.id, rosterPhoto: rosterData.rosterPhoto };
            }
          }
          return null;
        };

        const referee1Data = await matchReferee(gameData.referee1);
        if (referee1Data) {
          gameData.referee1Photo = referee1Data.rosterPhoto;
        }

        const referee2Data = await matchReferee(gameData.referee2);
        if (referee2Data) {
          gameData.referee2Photo = referee2Data.rosterPhoto;
        }

        const linesperson1Data = await matchReferee(gameData.linesperson1);
        if (linesperson1Data) {
          gameData.linesperson1Photo = linesperson1Data.rosterPhoto;
        }

        const linesperson2Data = await matchReferee(gameData.linesperson2);
        if (linesperson2Data) {
          gameData.linesperson2Photo = linesperson2Data.rosterPhoto;
        }

        return { 
          ...gameData, 
          arenaName, 
          arenaAddress,
          timeZone, 
          homeEquiptmentManager,
          homeEquiptmentManagerPhone,
          awayEquiptmentManager,
          awayEquiptmentManagerPhone,
          teamLogos: logos,
          headCoaches: coaches,
          referee1Photo: gameData.referee1Photo,
          referee2Photo: gameData.referee2Photo,
          linesperson1Photo: gameData.linesperson1Photo,
          linesperson2Photo: gameData.linesperson2Photo
        };
      } else {
        console.log('No such document!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const appUser: AppUser = { ...firebaseUser };
        setUser(appUser);
        await fetchUserData(appUser);
      } else {
        setUser(null);
        setUserFullName('');
        setUserRole('');
        setGames([]);
        setGameCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ 
      user, 
      userFullName, 
      userPhoneNumber, 
      userRole, 
      games, 
      gameCount, 
      loading, 
      refreshUserData,
      fetchGameAndTeams 
    }}>
      {children}
    </AppContext.Provider>
  );
};
