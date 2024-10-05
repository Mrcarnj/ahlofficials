import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
//@ts-ignore
import { initializeAuth, getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
    apiKey: "AIzaSyBO5BDt8CmcvYuvLzxN5ExdvtWq1jNL3HU",
    authDomain: "ahlofficials-af508.firebaseapp.com",
    projectId: "ahlofficials-af508",
    storageBucket: "ahlofficials-af508.appspot.com",
    messagingSenderId: "997469697278",
    appId: "1:997469697278:web:40d31322715d2000d121af",
    measurementId: "G-5GBR4TZHEH"
  };

  const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage),
});