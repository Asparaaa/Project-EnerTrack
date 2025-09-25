// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Tabs, router } from 'expo-router'; // Komponen utama untuk membuat layout tab dari Expo Router
import { House, ChartLine, Calculator, ClockCounterClockwise } from 'phosphor-react-native'; // Ikon
import { useAuth } from '@/contexts/authContext'; // Hook untuk mendapatkan data user
import { colors } from '@/constants/theme';
import Typo from '@/components/Typo';
import { verticalScale } from '@/utils/styling';

// --- KOMPONEN LOKAL: IKON PROFIL DI HEADER ---

/**
 * Komponen ini menampilkan ikon profil di pojok kanan atas header.
 * Jika user punya foto profil, tampilkan foto. Jika tidak, tampilkan inisial nama.
 * Jika ditekan, akan mengarahkan ke halaman profil.
 */
const ProfileHeaderIcon = () => {
  const { user } = useAuth();
  // Ambil huruf pertama dari username untuk dijadikan inisial
  const initials = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity onPress={() => router.push('/Profile')} style={styles.headerIconContainer}>
      {/* Cek apakah user punya URL gambar profil */}
      {user?.image ? (
        <Image source={{ uri: user.image }} style={styles.profileImage} />
      ) : (
        // Jika tidak ada gambar, tampilkan lingkaran dengan inisial
        <View style={styles.initialsContainer}>
          <Text>
            <Typo color={colors.white} fontWeight="bold" size={16}>
              {initials}
            </Typo>
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};


// --- KOMPONEN UTAMA: LAYOUT TAB NAVIGATOR ---

/**
 * Ini adalah file layout utama untuk navigasi tab di bagian bawah aplikasi.
 * Semua layar yang ada di dalam <Tabs> akan menjadi bagian dari navigasi ini.
 */
export default function TabLayout() {
  return (
    <Tabs
      // `screenOptions` mengatur tampilan default untuk SEMUA layar di dalam Tabs ini
      screenOptions={{
        // Warna untuk tab yang sedang aktif
        tabBarActiveTintColor: colors.mainBlue,
        // Warna untuk tab yang tidak aktif
        tabBarInactiveTintColor: colors.neutral500,
        // Styling untuk bar navigasi bawah
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral100,
          height: 100, // Tinggi bar
          paddingBottom: 5,
        },
        // Styling untuk label teks di bawah ikon tab
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        // Tampilkan header di bagian atas layar
        headerShown: true,
        // Styling untuk header
        headerStyle: {
          height: verticalScale(100),
          backgroundColor: colors.white,
          elevation: 0, // Hilangkan bayangan di Android
          shadowOpacity: 0, // Hilangkan bayangan di iOS
          borderBottomWidth: 2,
          borderBottomColor: colors.neutral100,
        },
        headerTitleAlign: 'left', // Posisi judul header di kiri
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 24,
        },
        // Menambahkan komponen di sisi kanan header
        // Di sini kita memanggil komponen ProfileHeaderIcon yang sudah dibuat di atas
        headerRight: () => <ProfileHeaderIcon />,
      }}
    >
      {/* --- Mendefinisikan setiap layar/tab --- */}

      {/* Tab 1: Home */}
      <Tabs.Screen
        name="Home" // Nama file harus sesuai: Home.tsx
        options={{
          title: 'Dashboard', // Teks yang muncul di header & tab bar
          tabBarIcon: ({ color }) => ( // Fungsi untuk render ikon
            <View>
              <House size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      
      {/* Tab 2: EnergyAnalytics */}
      <Tabs.Screen
        name="EnergyAnalytics" // Nama file: EnergyAnalytics.tsx
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <View>
              <ChartLine size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      
      {/* Tab 3: Calculate */}
      <Tabs.Screen
        name="Calculate" // Nama file: Calculate.tsx
        options={{
          title: 'Calculate',
          tabBarIcon: ({ color }) => (
            <View>
              <Calculator size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      
      {/* Tab 4: History */}
      <Tabs.Screen
        name="History" // Nama file: History.tsx
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <View>
              <ClockCounterClockwise size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      
      {/* Layar Tersembunyi: Profile */}
      <Tabs.Screen
        name="Profile" // Nama file: Profile.tsx
        options={{
          // `href: null` adalah trik dari Expo Router untuk membuat layar ini
          // bisa diakses lewat navigasi (router.push), TAPI tidak akan muncul
          // sebagai tombol di tab bar bawah.
          href: null,
        }}
      />
    </Tabs>
  );
}

// --- STYLING UNTUK KOMPONEN DI ATAS ---
const styles = StyleSheet.create({
  headerIconContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18, // Membuat gambar jadi lingkaran
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mainBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
