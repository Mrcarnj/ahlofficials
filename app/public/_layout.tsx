import { Stack } from 'expo-router';

const publicLayout = () => {
    return (
        <Stack>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        </Stack>
    );
    }