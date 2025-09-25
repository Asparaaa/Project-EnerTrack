
// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router"; // Hook dari Expo Router untuk fungsi navigasi (pindah halaman)
import ScreenWrapper from "@/components/ScreenWrapper"; // Komponen custom untuk pembungkus layar
import Typo from "@/components/Typo"; // Komponen custom untuk teks
import { colors, spacingY } from "@/constants/theme"; // Import warna dan spasi dari tema

/**
 * Ini adalah komponen untuk halaman 'index' atau halaman root dari aplikasi.
 * Berdasarkan struktur Expo Router, file `app/index.tsx` adalah layar pertama
 * yang akan coba ditampilkan saat aplikasi dibuka.
 * Biasanya, layar ini berfungsi sebagai layar loading awal sebelum diarahkan
 * ke halaman login atau halaman utama (dashboard).
 */
const index = () => {
  // Inisialisasi fungsi router untuk navigasi
  const router = useRouter();

  // --- BLOK KODE YANG DI-NONAKTIFKAN ---
  // Awalnya, sepertinya ada logika untuk menunggu 2 detik di layar ini,
  // lalu otomatis pindah ke halaman "/Welcome".
  //
  // Kemungkinan besar, logika ini sekarang sudah dipindahkan ke tempat lain,
  // misalnya di dalam `AuthProvider`, yang akan mengecek status login user
  // dan mengarahkannya ke halaman yang sesuai (Login atau Home).
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     router.push("/Welcome");
  //   }, 2000);

  //   return () => clearTimeout(timeout);
  // }, []);

  // --- TAMPILAN (RENDER) ---
  // Menampilkan UI untuk layar loading.
  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.container}>
        {/* Menampilkan nama aplikasi */}
        <Typo size={32} fontWeight="700" color={colors.mainBlue}>
          EnerTrack
        </Typo>
        {/* Menampilkan tagline aplikasi */}
        <Typo size={16} color={colors.textDarkGrey} style={{ marginTop: spacingY._10 }}>
          Smart Energy Usage App
        </Typo>
        {/* Menampilkan indikator loading (spinner) */}
        <ActivityIndicator size="large" color={colors.mainBlue} style={{ marginTop: spacingY._20 }} />
      </View>
    </ScreenWrapper>
  );
};

export default index;

// --- STYLING KOMPONEN ---
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.mainWhite,
  },
  container: {
    flex: 1, // Memastikan kontainer mengisi seluruh layar
    justifyContent: "center", // Konten di tengah secara vertikal
    alignItems: "center", // Konten di tengah secara horizontal
  },
});
