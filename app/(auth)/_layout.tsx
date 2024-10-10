import { Tabs } from "expo-router"
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../context/AuthContext";
import { LogoutButton } from "../../components/logoutBtn";
import { useEffect } from 'react';

const tabsLayout = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {

    }, [user]);

    return (
        <Tabs screenOptions={({route}) => ({
            tabBarActiveTintColor: "#ff6600",
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
                backgroundColor: 'black',
            },
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
        
                if (route.name === 'home') {
                    iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'calendar') {
                    iconName = focused ? 'calendar' : 'calendar-outline';
                } else if (route.name === 'profile') {
                    iconName = focused ? 'person' : 'person-outline';
                } else if (route.name === 'admin') {
                    iconName = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false,
        })}>
            <Tabs.Screen name="home" options={{
                tabBarLabel: 'Home',
            }}/>
            <Tabs.Screen name="calendar" options={{
                tabBarLabel: 'Calendar',
            }}/>
            <Tabs.Screen name="profile" options={{
                headerRight: () => <LogoutButton />,
                tabBarLabel: 'Profile',
            }} />
            {isAdmin && (
                <Tabs.Screen name="admin" options={{
                    tabBarLabel: 'Admin',
                }} />
            )}
        </Tabs>
    );
};

export default tabsLayout;
