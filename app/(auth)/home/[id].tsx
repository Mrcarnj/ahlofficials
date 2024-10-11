import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

const generateUrl = (gameID, isGamesheet = false) => {
  let numericId;

  if (gameID.startsWith('EX-')) {
    const exNum = parseInt(gameID.split('-')[1]);
    numericId = 1027636 + exNum;
  } else {
    numericId = 1027660 + parseInt(gameID);
  }

  if (isGamesheet) {
    return `https://lscluster.hockeytech.com/game_reports/official-game-report.php?lang_id=1&client_code=ahl&game_id=${numericId}`;
  } else {
    return `https://theahl.com/stats/game-center/${numericId}`;
  }
};

const GamePage = () => {
  const { id } = useLocalSearchParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamLogos, setTeamLogos] = useState({});
  const [headCoaches, setHeadCoaches] = useState({});

  const handlePhonePress = (phoneNumber) => {
    Alert.alert(
      "Contact Equipment Manager",
      "Choose an action",
      [
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        },
        {
          text: "Message",
          onPress: () => Linking.openURL(`sms:${phoneNumber}?body=`)
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleArenaPress = (arenaAddress) => {
    const encodedAddress = encodeURIComponent(arenaAddress);
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
    });
    Linking.openURL(url);
  };

  useEffect(() => {
    const fetchGameAndTeams = async () => {
      try {
        const docRef = doc(FIRESTORE_DB, 'schedule', Array.isArray(id) ? id[0] : id);
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
            console.log(`Referee1 (${gameData.referee1}) matched to documentID: ${referee1Data.id}`);
            console.log(`Referee1 rosterPhoto: ${referee1Data.rosterPhoto}`);
            gameData.referee1Photo = referee1Data.rosterPhoto;
          } else {
            console.log(`No match found for Referee1 (${gameData.referee1})`);
          }

          const referee2Data = await matchReferee(gameData.referee2);
          if (referee2Data) {
            console.log(`Referee2 (${gameData.referee2}) matched to documentID: ${referee2Data.id}`);
            console.log(`Referee2 rosterPhoto: ${referee2Data.rosterPhoto}`);
            gameData.referee2Photo = referee2Data.rosterPhoto;
          } else {
            console.log(`No match found for Referee2 (${gameData.referee2})`);
          }

          const linesperson1Data = await matchReferee(gameData.linesperson1);
          if (linesperson1Data) {
            console.log(`Linesperson1 (${gameData.linesperson1}) matched to documentID: ${linesperson1Data.id}`);
            console.log(`Linesperson1 rosterPhoto: ${linesperson1Data.rosterPhoto}`);
            gameData.linesperson1Photo = linesperson1Data.rosterPhoto;
          } else {
            console.log(`No match found for Linesperson1 (${gameData.linesperson1})`);
          }

          const linesperson2Data = await matchReferee(gameData.linesperson2);
          if (linesperson2Data) {
            console.log(`Linesperson2 (${gameData.linesperson2}) matched to documentID: ${linesperson2Data.id}`);
            console.log(`Linesperson2 rosterPhoto: ${linesperson2Data.rosterPhoto}`);
            gameData.linesperson2Photo = linesperson2Data.rosterPhoto;
          } else {
            console.log(`No match found for Linesperson2 (${gameData.linesperson2})`);
          }

          setGame({ 
            ...gameData, 
            arenaName, 
            arenaAddress,
            timeZone, 
            homeEquiptmentManager,
            homeEquiptmentManagerPhone,
            awayEquiptmentManager,
            awayEquiptmentManagerPhone,
            referee1Photo: gameData.referee1Photo,
            referee2Photo: gameData.referee2Photo,
            linesperson1Photo: gameData.linesperson1Photo,
            linesperson2Photo: gameData.linesperson2Photo
          });
          setTeamLogos(logos);
          setHeadCoaches(coaches);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.gameDate}>{game.gameDate}</Text>
        <Text style={styles.gameID}>Game# {game.gameID}</Text>
        <View style={styles.teamsContainer}>
          <Image source={{ uri: teamLogos[game.awayTeam] }} style={styles.teamLogo} />
          <Text style={styles.atSymbol}>@</Text>
          <Image source={{ uri: teamLogos[game.homeTeam] }} style={styles.teamLogo} />
        </View>
        <Text style={styles.gameTime}>{game.gameTime} {game.timeZone || ''}</Text>
        <TouchableOpacity onPress={() => handleArenaPress(game.arenaAddress)}>
          <Text style={styles.arena}>{game.arenaName || 'Arena not specified'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => Linking.openURL(generateUrl(game.gameID))}
        >
          <View style={styles.iconContainer}>
            <FontAwesome5 name="hockey-puck" size={24} color="#ffffff" />
          </View>
          <Text style={styles.buttonText}>Game Center</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => Linking.openURL(generateUrl(game.gameID, true))}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="newspaper-outline" size={24} color="#ffffff" />
          </View>
          <Text style={styles.buttonText}>Gamesheet</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>Note: Gamesheet not available until after completion of the game.</Text>
      <View style={styles.separator} />
      <Text style={styles.titles}>Officials Crew</Text>
      <View style={styles.refereesRow}>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: game.referee1Photo || 'https://via.placeholder.com/150' }}
            style={styles.profileImageRef}
          />
          <Text style={styles.refereeText}>{game.referee1}</Text>
        </View>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: game.referee2Photo || 'https://via.placeholder.com/150' }}
            style={styles.profileImageRef}
          />
          <Text style={styles.refereeText}>{game.referee2}</Text>
        </View>
      </View>
      <View style={styles.refereesRow}>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: game.linesperson1Photo || 'https://via.placeholder.com/150' }}
            style={styles.profileImageLines}
          />
          <Text style={styles.refereeText}>{game.linesperson1}</Text>
        </View>
        <View style={styles.refereeContainer}>
          <Image
            source={{ uri: game.linesperson2Photo || 'https://via.placeholder.com/150' }}
            style={styles.profileImageLines}
          />
          <Text style={styles.refereeText}>{game.linesperson2}</Text>
        </View>
      </View>
      <View style={styles.separator} />
      <Text style={styles.titles}>Head Coaches</Text>
      <View style={styles.headCoachesRow}>
        <View style={styles.headCoachContainer}>
          <Image
            source={{ uri: game.awayHeadCoachPic || headCoaches[game.awayTeam]?.picture || 'https://via.placeholder.com/150' }}
            style={styles.headCoachPic}
          />
          <Text style={styles.headCoachText}>{headCoaches[game.awayTeam]?.name || 'N/A'}</Text>
        </View>
        <View style={styles.headCoachContainer}>
          <Image
            source={{ uri: game.homeHeadCoachPic || headCoaches[game.homeTeam]?.picture || 'https://via.placeholder.com/150' }}
            style={styles.headCoachPic}
          />
          <Text style={styles.headCoachText}>{headCoaches[game.homeTeam]?.name || 'N/A'}</Text>
        </View>
      </View>
      <Text style={styles.titles}>Equipment Managers</Text>
      <View style={styles.equipmentManagersRow}>
        <View style={styles.equipmentManagerContainer}>
          <Text style={styles.equipmentManagerName}>{game.awayEquiptmentManager || 'N/A'}</Text>
          <TouchableOpacity onPress={() => handlePhonePress(game.awayEquiptmentManagerPhone)}>
            <Text style={styles.equipmentManagerPhone}>{game.awayEquiptmentManagerPhone || 'N/A'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.equipmentManagerContainer}>
          <Text style={styles.equipmentManagerName}>{game.homeEquiptmentManager || 'N/A'}</Text>
          <TouchableOpacity onPress={() => handlePhonePress(game.homeEquiptmentManagerPhone)}>
            <Text style={styles.equipmentManagerPhone}>{game.homeEquiptmentManagerPhone || 'N/A'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20, // Add extra padding at the bottom
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#ffffff",                                                                                                                                                                                                                                                                     
     shadowOffset: {                                                                                                                                                                                                                                                                          
       width: -7,                                                                                                                                                                                                                                                                              
       height: -7,                                                                                                                                                                                                                                                                             
     },                                                                                                                                                                                                                                                                                       
     shadowOpacity: 0.7,                                                                                                                                                                                                                                                                     
     shadowRadius: 3.84,                                                                                                                                                                                                                                                                      
     elevation: 5,
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '100%',
    backgroundColor: '#333',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginHorizontal: 20,
  },
  atSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: 10,
  },
  gameTime: {
    fontSize: 18,
    color: '#000000',
    marginTop: -10,
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
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
  gameID: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  refereesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  headCoachesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  headCoachContainer: {
    alignItems: 'center',
  },
  headCoachPic: {
    width: 100,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 10,
    marginTop: 10,
  },
  headCoachText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  equipmentManagersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  equipmentManagerContainer: {
    alignItems: 'center',
  },
  equipmentManagerName: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  equipmentManagerPhone: {
    fontSize: 14,
    color: '#4287f5',
    textAlign: 'center',
    textDecorationLine: 'underline',
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
  refereeId: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  titles: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  circleButton: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#ff6600',
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
});

export default GamePage;
