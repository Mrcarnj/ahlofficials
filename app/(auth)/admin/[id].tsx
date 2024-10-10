import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useGlobalSearchParams } from 'expo-router'
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, collectionGroup, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import Spinner from 'react-native-loading-spinner-overlay';

const gameID = () => {
  const { id } = useGlobalSearchParams();
  const [allData, setData] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);

  useLayoutEffect(() => {
    const gameDataQuery = query(
      collectionGroup(FIRESTORE_DB, 'schedule'),
      where('id', '==', id)
    );
    const unsubscribe = onSnapshot(gameDataQuery, (snapshot) => {
      const allData = snapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      setData(allData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Spinner visible={loading} />
        <ScrollView>
          {allData.map((data) => (
            <View key={data.id}>
              <View style={styles.centeredContent}>
                <Text style={styles.gameNumber}>Game {data.gameID}</Text>
                <Text style={styles.gameText}>{data.gameDate}</Text>
                <Text style={styles.gameText}>{data.awayTeam} @ {data.homeTeam}</Text>
              </View>
              <Text style={styles.titles}>Officials Crew</Text>
              <View style={styles.refereesRow}>
                <View style={styles.refereeContainer}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/150' }}
                    style={styles.profileImageRef}
                  />
                  <Text style={styles.refereeText}>{data.referee1}</Text>
                </View>
                <View style={styles.refereeContainer}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/150' }}
                    style={styles.profileImageRef}
                  />
                  <Text style={styles.refereeText}>{data.referee2}</Text>
                </View>
              </View>
              <View style={styles.refereesRow}>
                <View style={styles.refereeContainer}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/150' }}
                    style={styles.profileImageLines}
                  />
                  <Text style={styles.refereeText}>{data.linesperson1}</Text>
                </View>
                <View style={styles.refereeContainer}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/150' }}
                    style={styles.profileImageLines}
                  />
                  <Text style={styles.refereeText}>{data.linesperson2}</Text>
                </View>
              </View>
            </View>

          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
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
});

export default gameID
