import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const stackLayout = () => {
  const router = useRouter();

  const shareCalendar = async () => {
    try {
      // Capture the screenshot (this will be implemented in the index.tsx file)
      if (global.captureCalendar) {
        const uri = await global.captureCalendar();
        if (uri) {
          await Sharing.shareAsync(uri);
        }
      } else {
        console.error('captureCalendar function not found');
      }
    } catch (error) {
      console.error('Error sharing calendar:', error);
    }
  };

  return (
    <Stack>
        <Stack.Screen 
          name="index" 
          options={{
            headerShown: true,
            headerRight: () => (
              <TouchableOpacity onPress={shareCalendar} style={{ marginRight: 15 }}>
                <Ionicons name="share-outline" size={24} color="#ff6600" />
              </TouchableOpacity>
            ),
            headerTitle: "Calendar",
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen 
          name="[id]" 
          options={{
            headerTitle: "Game Details",
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#ffffff',
          }}
        />
    </Stack>
  );
};

export default stackLayout;
