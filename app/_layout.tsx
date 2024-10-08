import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppProvider } from "../context/AppContext";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";

const InitialLayout = () => {
    const { user, initialized } = useAuth();
    const router = useRouter();
    const segments = useSegments(); 

    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (user && !inAuthGroup) {
            router.replace('/(auth)/home');
        } else if (!user) {
            router.replace('/public/login');
        }
    }, [initialized, user]);

    return (
        <>
        {initialized ? (<Slot/>) : (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="large" color="#0000ff"/>
        </View>
        )}
        </>
    )
}

const RootLayout = () => {
    return (
        <AuthProvider>
            <AppProvider>
                <InitialLayout />
            </AppProvider>
        </AuthProvider>
    );
};

export default RootLayout;
