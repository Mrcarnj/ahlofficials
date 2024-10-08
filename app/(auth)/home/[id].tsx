import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';

const GamePage = () => {
  const { id } = useLocalSearchParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamAbbreviations, setTeamAbbreviations] = useState({});

  useEffect(() => {
    const fetchGameAndTeams = async () => {
      try {
        const docRef = doc(FIRESTORE_DB, 'schedule', Array.isArray(id) ? id[0] : id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const gameData = docSnap.data();
          
          // Fetch team abbreviations and arena name
          const teamsRef = collection(FIRESTORE_DB, 'teams');
          const teamsQuery = query(teamsRef, where('city', 'in', [gameData.awayTeam, gameData.homeTeam]));
          const teamsSnapshot = await getDocs(teamsQuery);
          
          const abbreviations = {};
          let arenaName = '';
          let timeZone = '';
          teamsSnapshot.forEach((doc) => {
            const teamData = doc.data();
            abbreviations[teamData.city] = teamData.abbreviation;
            if (teamData.city === gameData.homeTeam) {
              arenaName = teamData.arenaName;
              timeZone = teamData.timeZone;
            }
          });

          setGame({ ...gameData, arenaName, timeZone });
          setTeamAbbreviations(abbreviations);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAndTeams();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Game not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
      <Text style={styles.gameDate}>{game.gameDate}</Text>
      <Text style={styles.gameID}>Game# {game.gameID}</Text>
        <Text style={styles.teams}>
          {teamAbbreviations[game.awayTeam] || game.awayTeam} @ {teamAbbreviations[game.homeTeam] || game.homeTeam}
        </Text>
        <Text style={styles.gameTime}>{game.gameTime} {game.timeZone}</Text>
        <Text style={styles.arena}>{game.arenaName}</Text>
      </View>
      <View style={styles.refereesRow}>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.profileImageRef}
          />
          <Text style={styles.refereeText}>{game.referee1}</Text>
        </View>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.profileImageRef}
          />
          <Text style={styles.refereeText}>{game.referee2}</Text>
        </View>
      </View>
      <View style={styles.refereesRow}>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.profileImageLines}
          />
          <Text style={styles.refereeText}>{game.linesperson1}</Text>
        </View>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }}
            style={styles.profileImageLines}
          />
          <Text style={styles.refereeText}>{game.linesperson2}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  teams: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center'
  },
  gameTime: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 5,
    textAlign: 'center'
  },
  gameDate: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  arena: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center'
  },
  gameID: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20
  },
  refereesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  refereeContainer: {
    alignItems: 'center',
  },
  profileImageRef: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ff6600',
    marginBottom: 10,
  },
  profileImageLines: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 10,
  },
  refereeText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default GamePage;
