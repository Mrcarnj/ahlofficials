import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext';
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Link } from 'expo-router';
import Spinner from 'react-native-loading-spinner-overlay';
import { Ionicons } from '@expo/vector-icons';

interface Game {
    id: string;
    gameID: string;
    gameDate: string;
    awayTeam: string;
    homeTeam: string;
    gameTime: string;
}

type FilterOption = 'Upcoming' | 'Previous 7 Days' | 'All';

const index = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState<boolean>(false);
    const [games, setGames] = useState<Game[]>([]);
    const [filterOption, setFilterOption] = useState<FilterOption>('Upcoming');
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    useEffect(() => {
        const gamesCollection = collection(FIRESTORE_DB, 'schedule');
        const q = query(gamesCollection);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const games = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Game, 'id'>)
            }));
            
            // Custom sorting function
            const sortedGames = games.sort((a, b) => {
                const aNum = parseInt(a.gameID.split('-')[1]);
                const bNum = parseInt(b.gameID.split('-')[1]);
                return aNum - bNum;
            });
            
            console.log('Sorted Games snapshot:', sortedGames);
            setGames(sortedGames);
        });
        return () => unsubscribe();
    }, []);

    const filteredAndSearchedGames = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        return games.filter(game => {
            const [month, day, year] = game.gameDate.split('/').map(Number);
            const gameDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
            
            switch (filterOption) {
                case 'Upcoming':
                    return gameDate >= today;
                case 'Previous 7 Days':
                    return gameDate >= sevenDaysAgo && gameDate < today;
                case 'All':
                default:
                    return true;
            }
        }).filter(game => game.gameID.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [games, filterOption, searchQuery]);

    const FilterButton = ({ title, isActive }: { title: FilterOption; isActive: boolean }) => (
        <TouchableOpacity
            style={[styles.filterButton, isActive && styles.activeFilterButton]}
            onPress={() => setFilterOption(title)}
        >
            <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>{title}</Text>
        </TouchableOpacity>
    );

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Spinner visible={loading} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search Game ID"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <View style={styles.filterContainer}>
                    <FilterButton title="Upcoming" isActive={filterOption === 'Upcoming'} />
                    <FilterButton title="Previous 7 Days" isActive={filterOption === 'Previous 7 Days'} />
                    <FilterButton title="All" isActive={filterOption === 'All'} />
                </View>
                <ScrollView>
                    {filteredAndSearchedGames.map((game) => (
                        <Link href={`/admin/${game.id}`} key={game.id} asChild>
                            <TouchableOpacity style={styles.gameCard}>
                                <View style={styles.gameContent}>
                                    <Text style={styles.gameNumber}>Game: {game.gameID} // {game.gameDate}</Text>
                                    <Text style={styles.gameText}>{game.awayTeam} @ {game.homeTeam}</Text>
                                    <Text style={styles.gameText}>{game.gameTime}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#ff6600" style={styles.arrowIcon} />
                            </TouchableOpacity>
                        </Link>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },                                                                                                                                                                                                                                                      
  container: {                                                                                                                                                                                                                                                                               
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 20,                                                                                                                                                                                                                                                             
  },                                                                                                                                                                                                                                                                                         
  text: {                                                                                                                                                                                                                                                                                    
    fontSize: 24,                                                                                                                                                                                                                                                                            
    fontWeight: 'bold',                                                                                                                                                                                                                                                                      
  },
  gameCard:{
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameNumber:{
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6600',
  },
  gameText:{
    fontSize: 14,
    color: '#fff',
  },
  gameContent:{
    flex: 1,
  },
  arrowIcon:{
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
});

export default index
