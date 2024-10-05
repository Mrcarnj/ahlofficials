import { signOut } from "firebase/auth"
import { FIREBASE_AUTH } from "../config/FirebaseConfig"
import { Pressable } from "react-native"
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export const LogoutButton = () => {
    const doLogout = () => {
        signOut(FIREBASE_AUTH)
};

return (
    <Pressable onPress={doLogout} style={{marginRight: 12}}>
        <Ionicons name= "log-out-outline" size={24} />
        </Pressable>

);
};