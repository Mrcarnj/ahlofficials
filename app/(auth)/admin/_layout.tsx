import { Stack } from "expo-router";

const stackLayout = () => {
  return (
    <Stack>
        <Stack.Screen 
          name="index" 
          options={{
            headerShown: true,
            headerTitle: "Admin",
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
