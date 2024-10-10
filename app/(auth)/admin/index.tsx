import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext';
import { FIRESTORE_DB } from '../../../config/FirebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link } from 'expo-router';
import Spinner from 'react-native-loading-spinner-overlay';

const index = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState<boolean> (false);
    const [games, setGames] = useState<any []>([]);
    
    useEffect(() => {
        const gamesCollection = collection(FIRESTORE_DB, 'schedule');

        const unsubscribe = onSnapshot(gamesCollection, (snapshot) => {
            const games = snapshot.docs.map((doc) => {
                return {
                    id: doc.id,
                    ...doc.data()};
            });
            console.log('Games snapshot:', games);
            setGames(games);
        });
        return unsubscribe();
    }, []);

  return (
    <View style={styles.container}>
        <Spinner visible={loading}  />
        <ScrollView>
            {games.map((game) => (
                    <TouchableOpacity style={styles.gameCard}>
                        <Text style={styles.gameNumber}>{game.gameDate} // {game.gameID}</Text>
                        <Text style={styles.gameText}>{game.awayTeam} @ {game.homeTeam}</Text>
                        <Text style={styles.gameText}>{game.gameTime}</Text> 
                        </TouchableOpacity>
            ))}
      </ScrollView>
    </View>
  )
};

const styles = StyleSheet.create({                                                                                                                                                                                                                                                           
    container: {                                                                                                                                                                                                                                                                               
      flex: 1,                                                                                                                                                                                                                                                                                 
      justifyContent: 'center',                                                                                                                                                                                                                                                                
      alignItems: 'center',                                                                                                                                                                                                                                                                    
      backgroundColor: '#000000',                                                                                                                                                                                                                                                              
    },                                                                                                                                                                                                                                                                                         
    text: {                                                                                                                                                                                                                                                                                    
      fontSize: 24,                                                                                                                                                                                                                                                                            
      fontWeight: 'bold',                                                                                                                                                                                                                                                                      
    },
    gameCard: {
padding: 10,
marginBottom: 5,
backgroundColor: 'white',
borderRadius: 4,
elevation: 2,
    },
    gameNumber:{
        fontSize: 18,
        fontWeight: 'bold',
    },
    gameText:{
        color: '#000',
        fontSize: 14,
    }
});

export default index