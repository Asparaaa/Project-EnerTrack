// --- IMPORT BAGIAN-BAGIAN PENTING ---
import { View, TouchableOpacity, Text, Keyboard } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router'; // Hook dari Expo Router untuk navigasi & mendapatkan path URL saat ini
import { House, ChartLine, Calculator, ClockCounterClockwise } from 'phosphor-react-native'; // Ikon
import { colors } from '@/constants/theme'; // Tema warna

/**
 * Komponen BottomNavbar kustom.
 * Ini adalah komponen navigasi bawah yang dibuat manual, bukan bagian dari
 * `Tabs` bawaan Expo Router, sehingga memberikan fleksibilitas styling yang lebih tinggi.
 */
const BottomNavbar = () => {
  const router = useRouter(); // Untuk fungsi pindah halaman
  const pathname = usePathname(); // Untuk mendapatkan path URL yang sedang aktif
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // State untuk melacak status keyboard
  
  // --- SIDE EFFECT UNTUK DETEKSI KEYBOARD ---
  // useEffect ini berfungsi untuk "mendengarkan" kapan keyboard muncul dan kapan disembunyikan.
  useEffect(() => {
    // Listener saat keyboard muncul
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    // Listener saat keyboard disembunyikan
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    // Cleanup function: Hapus listener saat komponen tidak lagi digunakan untuk mencegah memory leak.
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // --- LOGIKA UTAMA: SEMBUNYIKAN NAVBAR SAAT KEYBOARD MUNCUL ---
  // Jika keyboard sedang terlihat, komponen ini tidak akan me-render apa pun (return null).
  // Ini adalah UX (User Experience) yang bagus agar navbar tidak menutupi input field.
  if (isKeyboardVisible) return null;

  // --- DATA UNTUK MENU NAVBAR ---
  // Menggunakan array of objects seperti ini membuat kode lebih rapi dan mudah dikelola.
  // Gampang untuk menambah, mengurangi, atau mengubah item menu di masa depan.
  const menuItems = [
    { label: 'Home', icon: House, path: '/(tabs)/Home' },
    { label: 'Analytics', icon: ChartLine, path: '/(tabs)/EnergyAnalytics' },
    { label: 'Calculate', icon: Calculator, path: '/(tabs)/Calculate' },
    { label: 'History', icon: ClockCounterClockwise, path: '/(tabs)/History' },
  ];
  
  // --- TAMPILAN (RENDER) ---
  return (
    // Kontainer utama untuk navbar
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingVertical: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // Styling untuk bayangan (shadow)
        elevation: 10, // Untuk Android
        shadowColor: '#000', // Untuk iOS
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 4,
        marginBottom: 0,
      }}
    >
      {/* Melakukan looping pada array `menuItems` untuk membuat setiap tombol menu secara dinamis */}
      {menuItems.map((item, index) => {
        // Cek apakah item menu saat ini adalah halaman yang sedang aktif.
        // `pathname` dari expo-router biasanya tidak menyertakan nama grup seperti `/(tabs)`.
        const isActive = pathname === item.path.replace('/(tabs)', '');
        const Icon = item.icon; // Mengambil komponen ikon dari item

        return (
          // Tombol untuk setiap item menu
          <TouchableOpacity
            key={index}
            onPress={() => {
              // Hanya pindah halaman jika tab yang ditekan BUKAN tab yang sedang aktif.
              // Ini untuk mencegah navigasi yang tidak perlu.
              if (!isActive) {
                router.push(item.path as any);
              }
            }}
            style={{
              alignItems: 'center',
              padding: 10,
              borderRadius: 15,
              // Ganti warna background jika tab sedang aktif
              backgroundColor: isActive ? colors.mainBlue : 'transparent',
              marginTop: 5,
            }}
          >
            {/* Kontainer untuk ikon */}
            <View
              style={{
                backgroundColor: isActive ? colors.mainBlue : 'transparent',
                padding: 10,
                borderRadius: 50,
              }}
            >
              {/* Render ikon dengan style yang berbeda jika aktif */}
              <Icon size={28} weight={isActive ? 'fill' : 'regular'} color={isActive ? '#fff' : '#1A1A1A'} />
            </View>
            {/* Teks label di bawah ikon */}
            <Text
              style={{
                marginTop: 4,
                // Ganti warna dan ketebalan font jika aktif
                color: isActive ? '#fff' : '#1A1A1A',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavbar;
