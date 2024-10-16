import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, FlatList, Alert } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, collectionGroup, onSnapshot, orderBy, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import Spinner from 'react-native-loading-spinner-overlay';
import { logFirestoreRead } from '../../../utils/firestoreLogger';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameID = () => {
  const { user } = useAuth();
  const { fetchGameAndTeams } = useAppContext();
  const { id } = useGlobalSearchParams();
  const router = useRouter();
  const [allData, setData] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rosterData, setRosterData] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [changes, setChanges] = useState<{
    referee1?: string | null;
    referee2?: string | null;
    linesperson1?: string | null;
    linesperson2?: string | null;
    referee1Photo?: string | null;
    referee2Photo?: string | null;
    linesperson1Photo?: string | null;
    linesperson2Photo?: string | null;
  }>({});

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.returnButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useLayoutEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      try {
        const gameId = Array.isArray(id) ? id[0] : id;
        const cachedGame = await AsyncStorage.getItem(`game_${gameId}`);
        
        if (cachedGame) {
          const parsedGame = JSON.parse(cachedGame);
          setData([parsedGame]);
          setLoading(false);
        }

        const gameData = await fetchGameAndTeams(gameId);
        if (gameData) {
          setData([gameData]);
          setTeamLogos({
            [gameData.awayTeam]: gameData.awayTeamLogo || null,
            [gameData.homeTeam]: gameData.homeTeamLogo || null
          });
          setHeadCoaches({
            [gameData.awayTeam]: { 
              name: gameData.awayHeadCoachName || null, 
              picture: gameData.awayHeadCoachPic || null 
            },
            [gameData.homeTeam]: { 
              name: gameData.homeHeadCoachName || null, 
              picture: gameData.homeHeadCoachPic || null 
            }
          });
          await AsyncStorage.setItem(`game_${gameId}`, JSON.stringify(gameData));
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGame();

    const loadRoster = async () => {
      const cachedRoster = await AsyncStorage.getItem('roster');
      if (cachedRoster) {
        setRosterData(JSON.parse(cachedRoster));
      } else {
        const rosterQuery = query(
          collection(FIRESTORE_DB, 'roster'),
          orderBy('lastFirstFullName')
        );
        const snapshot = await getDocs(rosterQuery);
        logFirestoreRead(snapshot.docs.length);
        const rosterData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setRosterData(rosterData);
        await AsyncStorage.setItem('roster', JSON.stringify(rosterData));
      }
    };

    loadRoster();
  }, [id, fetchGameAndTeams]);

  const handleRemoveOfficial = (position: 'referee1' | 'referee2' | 'linesperson1' | 'linesperson2') => {
    const officialName = changes[position] || allData[0][position];
    Alert.alert(
      "Remove Official",
      `Are you sure you want to remove ${officialName} from the game?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Remove",
          onPress: () => setChanges(prev => ({
            ...prev, 
            [position]: null, 
            [`${position}Photo`]: null
          }))
        }
      ]
    );
  };

  const handleAddOfficial = (position) => {
    setSelectedPosition(position);
    setModalVisible(true);
  };

  const handleSelectOfficial = async (official: { id: string; firstName: string; lastName: string }) => {
    const newChanges = { ...changes };
    const officialFullName = `${official.firstName} ${official.lastName}`;
    
    // Check if the official is already assigned to another position
    const existingPosition = Object.entries(newChanges).find(([pos, name]) => 
      name === officialFullName && pos !== selectedPosition
    );

    if (existingPosition) {
      Alert.alert(
        "Official Already Assigned",
        `${officialFullName} is already assigned as ${existingPosition[0]}. Please choose a different official.`
      );
      return;
    }

    // If not already assigned, update the changes
    newChanges[selectedPosition] = officialFullName;

    // Fetch the official's photo URL
    const officialDocRef = doc(FIRESTORE_DB, 'roster', official.id);
    const officialDocSnap = await getDoc(officialDocRef);
    logFirestoreRead();
    if (officialDocSnap.exists()) {
      const officialData = officialDocSnap.data();
      newChanges[`${selectedPosition}Photo`] = officialData.rosterPhoto || null;
    }

    setChanges(newChanges);
    setModalVisible(false);
  };

  const handleSaveChanges = async () => {
    // Check if all positions are filled
    const positions = ['referee1', 'referee2', 'linesperson1', 'linesperson2'];
    const missingPositions = positions.filter(pos => !changes[pos] && !allData[0][pos]);
    
    if (missingPositions.length > 0) {
      Alert.alert(
        "Missing Officials",
        `Please assign officials to all positions before saving.`
      );
      return;
    }

    // Check for duplicate officials
    const officials = positions.map(pos => changes[pos] || allData[0][pos]);
    const uniqueOfficials = new Set(officials);
    if (uniqueOfficials.size !== positions.length) {
      Alert.alert(
        "Duplicate Officials",
        `An official cannot be assigned to multiple positions. Please review your selections.`
      );
      return;
    }

    setLoading(true);
    try {
      const gameRef = doc(FIRESTORE_DB, 'schedule', allData[0].id);
      await updateDoc(gameRef, changes);
      setChanges({});
      // Refresh the data
      const updatedData = {...allData[0], ...changes};
      setData([updatedData]);
      Alert.alert("Success", "Changes saved successfully.");
    } catch (error) {
      console.error("Error updating document: ", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    }
    setLoading(false);
  };

  const renderOfficialItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleSelectOfficial(item)} style={styles.officialItem}>
      <Text style={styles.officialName}>{item.lastFirstFullName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6600"/>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView>
          {allData.map((data) => (
            <View key={data.id}>
              <View style={styles.centeredContent}>
                <Text style={styles.gameNumber}>Game {data.gameID}</Text>
                <Text style={styles.gameText}>{data.gameDate}</Text>
                <View style={styles.teamsContainer}>
                  <Text style={styles.teamAbbr}>{data.awayTeamAbbr}</Text>
                  <Text style={styles.atSymbol}>@</Text>
                  <Text style={styles.teamAbbr}>{data.homeTeamAbbr}</Text>
                </View>
                <Text style={styles.gameText}>{data.awayTeam} @ {data.homeTeam}</Text>
              </View>
              <Text style={styles.titles}>Officials Crew</Text>
              <View style={styles.refereesRow}>
                <View style={styles.refereeContainer}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveOfficial('referee1')}>
                    <Ionicons name="remove-circle" size={24} color="red" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: changes.referee1Photo || data.referee1Photo || 'https://via.placeholder.com/150' }}
                    style={styles.profileImageRef}
                  />
                  {changes.referee1 === null ? (
                    <TouchableOpacity onPress={() => handleAddOfficial('referee1')}>
                      <Text style={styles.addOfficialText}>+ Add Official</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.refereeText}>{changes.referee1 || data.referee1}</Text>
                  )}
                </View>
                <View style={styles.refereeContainer}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveOfficial('referee2')}>
                    <Ionicons name="remove-circle" size={24} color="red" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: changes.referee2Photo || data.referee2Photo || 'https://via.placeholder.com/150' }}
                    style={styles.profileImageRef}
                  />
                  {changes.referee2 === null ? (
                    <TouchableOpacity onPress={() => handleAddOfficial('referee2')}>
                      <Text style={styles.addOfficialText}>+ Add Official</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.refereeText}>{changes.referee2 || data.referee2}</Text>
                  )}
                </View>
              </View>
              <View style={styles.refereesRow}>
                <View style={styles.refereeContainer}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveOfficial('linesperson1')}>
                    <Ionicons name="remove-circle" size={24} color="red" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: changes.linesperson1Photo || data.linesperson1Photo || 'https://via.placeholder.com/150' }}
                    style={styles.profileImageLines}
                  />
                  {changes.linesperson1 === null ? (
                    <TouchableOpacity onPress={() => handleAddOfficial('linesperson1')}>
                      <Text style={styles.addOfficialText}>+ Add Official</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.refereeText}>{changes.linesperson1 || data.linesperson1}</Text>
                  )}
                </View>
                <View style={styles.refereeContainer}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveOfficial('linesperson2')}>
                    <Ionicons name="remove-circle" size={24} color="red" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: changes.linesperson2Photo || data.linesperson2Photo || 'https://via.placeholder.com/150' }}
                    style={styles.profileImageLines}
                  />
                  {changes.linesperson2 === null ? (
                    <TouchableOpacity onPress={() => handleAddOfficial('linesperson2')}>
                      <Text style={styles.addOfficialText}>+ Add Official</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.refereeText}>{changes.linesperson2 || data.linesperson2}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        {Object.keys(changes).length > 0 && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View style={styles.modalView}>
            <FlatList
              data={rosterData}
              renderItem={renderOfficialItem}
              keyExtractor={item => item.id}
              style={{flex: 1}}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    left: -10,
    zIndex: 1,
  },
  addOfficialText: {
    color: '#ff6600',
    fontWeight: 'bold',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#ff6600',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalView: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  officialItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  officialName: {
    fontSize: 16,
  },
  closeButton: {                                                                                                                                                                                                                                                                             
    backgroundColor: '#ff6600',                                                                                                                                                                                                                                                              
    borderRadius: 20,                                                                                                                                                                                                                                                                        
    padding: 10,                                                                                                                                                                                                                                                                             
    elevation: 2,                                                                                                                                                                                                                                                                            
    marginTop: 15,                                                                                                                                                                                                                                                                           
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  searchBar: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  centeredContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamAbbr: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 10,
  },
  atSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flexGrow: 1,
    textAlign: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6600',
  },
  gameText: {
    fontSize: 14,
    color: '#fff',
  },
  gameContent: {
    flex: 1,
    textAlign: 'center',
  },
  arrowIcon: {
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff6600',
  },
  activeFilterButton: {
    backgroundColor: '#ff6600',
  },
  filterButtonText: {
    color: '#ff6600',
    fontWeight: 'bold',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  refereeContainer: {
    alignItems: 'center',
  },
  refereesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  titles: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6600',
    textAlign: 'center',
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: '#ff6600',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameID
