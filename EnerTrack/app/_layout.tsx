
// --- IMPORT BAGIAN-BAGIAN PENTING ---
import { AuthProvider } from "@/contexts/authContext"; // Pembungkus untuk menyediakan data otentikasi (user, login, logout) ke seluruh aplikasi
import { Stack } from "expo-router"; // Komponen navigasi dasar dari Expo Router, digunakan untuk membuat alur layar seperti tumpukan kartu
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Pembungkus wajib agar library gesture (seperti swipe, tap, dll.) berfungsi dengan baik, terutama di Android.

/**
 * Ini adalah Root Layout, atau bisa dibilang "kerangka utama" dari seluruh aplikasi kamu.
 * File `_layout.tsx` di level root (`app/`) akan menjadi file pertama yang dieksekusi untuk mengatur navigasi.
 */
const RootLayout = () => {
    return (
        // 1. GESTURE HANDLER ROOT VIEW
        // Semua komponen aplikasi harus berada di dalam GestureHandlerRootView
        // agar semua interaksi sentuhan (gestures) bisa dikenali dengan benar di seluruh platform.
        <GestureHandlerRootView style={{ flex: 1 }}>
            
            {/* 2. AUTH PROVIDER */}
            {/* Dengan membungkus semua navigasi di dalam AuthProvider, semua halaman
                di dalam aplikasi akan punya akses ke konteks otentikasi.
                Ini memudahkan pengecekan apakah user sudah login atau belum. */}
            <AuthProvider>

                {/* 3. STACK NAVIGATOR UTAMA */}
                {/* <Stack> ini adalah navigator utama aplikasi. Anggap saja ini sebagai
                    pengatur lalu lintas utama yang menentukan grup layar mana yang akan ditampilkan. */}
                <Stack screenOptions={{
                    // Opsi ini berlaku untuk semua layar di dalam Stack ini.
                    // `headerShown: false` berarti secara default, header bawaan dari Stack Navigator ini disembunyikan.
                    // Ini berguna karena kita akan mengatur header sendiri di dalam grup (tabs).
                    headerShown: false
                }}>
                    
                    {/* --- DAFTAR LAYAR/GRUP LAYAR UTAMA --- */}
                    
                    {/* Grup layar untuk otentikasi (login, register, dll.).
                        Expo Router akan mencari folder bernama `(auth)` di dalam `app/`. */}
                    <Stack.Screen name="(auth)" />
                    
                    {/* Grup layar utama aplikasi yang menggunakan Tab Navigator (Home, History, dll.).
                        Expo Router akan mencari folder bernama `(tabs)` di dalam `app/`. */}
                    <Stack.Screen name="(tabs)" />

                    {/* Ini adalah contoh layar tunggal di luar grup.
                        Expo Router akan mencari file bernama `Test.tsx` di dalam `app/`. */}
                    <Stack.Screen name="Test" />
                </Stack>
            </AuthProvider>
        </GestureHandlerRootView>
    );
};

export default RootLayout;
