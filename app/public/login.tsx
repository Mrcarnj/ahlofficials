import { View, Text, StyleSheet, Pressable, TextInput, Button } from 'react-native'
import React, {useState} from 'react';
import { Link } from 'expo-router';
import Spinner from 'react-native-loading-spinner-overlay';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../config/FirebaseConfig';



const login = () => {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);

const handleLogin = async () => {
    try {
        setLoading(true);
        const user = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
        console.log("*** LOG *** file: login.tsx ~ user:", user)
    } catch (error) {
        console.log("ERROR: ", error)
        alert(error.message);
    } finally {
        setLoading(false);
    }
};

  return (
    <View style={styles.container}>
        <Spinner visible={loading} />
    <TextInput
        style={styles.inputField}
        placeholder="Email"
        value={email}
        onChangeText={setEmail} />
    <TextInput 
        secureTextEntry
        style={styles.inputField}
        placeholder="Password"
        value={password}
        onChangeText={setPassword} />

      <Button title='Login' onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    inputField: {
        marginVertical: 4,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 4,
        borderColor: '#ccc',
        borderWidth: 1,
        height: 50,
        },
    button: {
        backgroundColor: '#ff6600',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
  });

export default login