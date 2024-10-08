import { View, StyleSheet, TextInput, Button } from 'react-native'
import React, { useState } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../config/FirebaseConfig';
import { useAppContext } from '../../context/AppContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, refreshUserData } = useAppContext();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      await refreshUserData();
    } catch (error) {
      console.log("ERROR: ", error)
      alert(error.message);
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

export default Login;
