import { Stack } from "expo-router";

const stackLayout = () => {
  return (
    <Stack>
        <Stack.Screen options={{
            headerShown: false,
        }}name="index" />
        <Stack.Screen name="[id]" />
    </Stack>
  );
};

export default stackLayout;