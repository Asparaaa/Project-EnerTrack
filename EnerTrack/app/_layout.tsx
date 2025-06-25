// Lokasi: app/_layout.tsx (File yang pertama kamu kirim)

import { AuthProvider } from "@/contexts/authContext";
import { Stack } from "expo-router";
import React from "react";
// 1. IMPORT GestureHandlerRootView
import { GestureHandlerRootView } from "react-native-gesture-handler";

const RootLayout = () => {
    return (
        // 2. BUNGKUS SEMUANYA DENGAN GestureHandlerRootView
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <Stack screenOptions={{ 
                    headerShown: false 
                }}>
                    <Stack.Screen name="(auth)" /> 
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="Test" />
                </Stack>
            </AuthProvider>
        </GestureHandlerRootView>
    );
};

export default RootLayout;