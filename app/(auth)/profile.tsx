import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../config/FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '../../context/AppContext';
import { logFirestoreRead } from '../../utils/firestoreLogger';

export default function ProfileScreen() {
  const { userData, games, loading } = useAppContext();
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState(userData?.phoneNumber || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const gameCount = Object.keys(games).length;

  const handleUpdate = useCallback(async () => {
    if (userData) {
      const userDocRef = doc(FIRESTORE_DB, 'roster', userData.uid);
      try {
        await updateDoc(userDocRef, {
          email: email,
          phoneNumber: phone,
        });
        logFirestoreRead();
        setIsEditingEmail(false);
        setIsEditingPhone(false);
        Alert.alert('Success', 'Profile updated successfully');
        // Note: We're not calling refreshUserData() here as it's no longer available in the new context
      } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
      }
    }
  }, [userData, email, phone]);

  const renderEditableField = useCallback((value, setValue, isEditing, setIsEditing, label, keyboardType) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.valueContainer}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType={keyboardType}
            placeholderTextColor="#888"
            autoFocus
          />
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Icon name={isEditing ? "checkmark-outline" : "pencil-outline"} size={24} color="#ff6600" />
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  if (loading || !userData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <ActivityIndicator size="large" color="#0000ff"/>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Image
          source={{ uri: userData.rosterPhoto || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{userData.firstName} {userData.lastName}</Text>
        <Text style={styles.gameCount}>Game Count: {gameCount}</Text>
        <View style={styles.infoSection}>
          {renderEditableField(email, setEmail, isEditingEmail, setIsEditingEmail, "Email", "email-address")}
          {renderEditableField(phone, setPhone, isEditingPhone, setIsEditingPhone, "Phone", "phone-pad")}
          <TouchableOpacity style={styles.linkButton} onPress={handleUpdate}>
            <Text style={styles.link}>Update Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => FIREBASE_AUTH.signOut()}>
            <Text style={styles.link}>Sign out</Text> 
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  readCountText: {
    color: '#ff6600',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#ff6600',
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameCount: {
    fontSize: 18,
    color: '#ff6600',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoSection: {
    width: '100%',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: 5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ff6600',
    paddingVertical: 5,
  },
  editButton: {
    padding: 5,
  },
  linkButton: {
    backgroundColor: '#ff6600',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  link: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});
