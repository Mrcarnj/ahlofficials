import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext';
import { GameData, useAppContext } from '../../../context/AppContext';
import { Link, useRouter } from 'expo-router';
import Spinner from 'react-native-loading-spinner-overlay';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FilterOption = 'Upcoming' | 'Previous 7 Days' | 'All';

const AdminIndex = () => {
    const { user } = useAuth();
    const { userData, fetchAllGamesForAdmin } = useAppContext();
    const router = useRouter();
    const isAdmin = userData?.role === 'admin';
    const [loading, setLoading] = useState<boolean>(false);
    const [games, setGames] = useState<{ [key: string]: GameData }>({});
    const [filterOption, setFilterOption] = useState<FilterOption>('Upcoming');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const loadGames = async () => {
            if (isAdmin) {
                setLoading(true);
                try {
                    const cachedGames = await AsyncStorage.getItem('adminGames');
                    if (cachedGames) {
                        setGames(JSON.parse(cachedGames));
                    }

                    const allGames = await fetchAllGamesForAdmin();
                    setGames(allGames);
                    
                    // Cache the games
                    await AsyncStorage.setItem('adminGames', JSON.stringify(allGames));
                } catch (error) {
                    console.error('Error loading games:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadGames();
    }, [isAdmin, fetchAllGamesForAdmin]);

    const filteredAndSearchedGames = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        return Object.values(games)
            .filter(game => {
                const [month, day, year] = game.gameDate.split('/').map(Number);
                const gameDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                
                switch (filterOption) {
                    case 'Upcoming':
                        return gameDate >= today && gameDate <= twoWeeksFromNow;
                    case 'Previous 7 Days':
                        return gameDate >= sevenDaysAgo && gameDate < today;
                    case 'All':
                    default:
                        return true;
                }
            })
            .filter(game => game.gameID.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const gameNumberA = parseInt(a.gameID.replace(/\D/g, ''), 10);
                const gameNumberB = parseInt(b.gameID.replace(/\D/g, ''), 10);
                return gameNumberA - gameNumberB;
            });
    }, [games, filterOption, searchQuery]);

    const FilterButton = useCallback(({ title, isActive }: { title: FilterOption; isActive: boolean }) => (
        <TouchableOpacity
            style={[styles.filterButton, isActive && styles.activeFilterButton]}
            onPress={() => setFilterOption(title)}
        >
            <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>{title}</Text>
        </TouchableOpacity>
    ), []);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    if (!isAdmin) {
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
                    <FilterButton title="All" isActive={filterOption === 'All'} />
                    <FilterButton title="Upcoming" isActive={filterOption === 'Upcoming'} />
                    <FilterButton title="Previous 7 Days" isActive={filterOption === 'Previous 7 Days'} />
                </View>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    {filteredAndSearchedGames.map((game) => (
                        <Link href={`/admin/${game.id}`} key={game.id} asChild>
                            <TouchableOpacity style={styles.gameCard}>
                                <View style={styles.gameContent}>
                                    <Text style={styles.gameNumber}>Game: {game.gameID} ({game.gameDate})</Text>
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
  scrollViewContent: {
    paddingBottom: 80, // Adjust this value as needed to ensure the last item is fully visible
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

export default AdminIndex;
