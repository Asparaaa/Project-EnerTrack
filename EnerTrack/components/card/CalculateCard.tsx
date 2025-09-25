// Mengimpor library dan komponen yang dibutuhkan
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
// Ini sepertinya konstanta tema desain dari proyekmu, untuk warna, radius, dan jarak.
import { colors, radius, spacingY } from '@/constants/theme';
// Komponen kustom untuk menampilkan teks, biar stylingnya konsisten.
import Typo from '@/components/Typo';
// Fungsi bantuan untuk membuat ukuran (font, padding, dll) jadi responsif di berbagai layar.
import { moderateScale } from '@/utils/styling';

// Mendefinisikan 'aturan main' atau properti (props) untuk komponen Card.
// Artinya, komponen Card WAJIB menerima 'children' (komponen lain di dalamnya)
// dan BOLEH menerima 'style' untuk kustomisasi tambahan.
interface CardProps {
  children: React.ReactNode;
  style?: object;
}

// Mendefinisikan props untuk komponen StatCard.
interface StatCardProps {
  label: string;      // Teks label utama (misal: "Total Konsumsi")
  value: string;      // Nilai utamanya (misal: "250 kWh")
  subLabel?: string;  // Teks kecil di bawah nilai (opsional)
  icon: React.JSX.Element; // Komponen ikon yang akan ditampilkan
}

// ## Komponen Utama: CalculateCard
// Ini adalah komponen dasar yang berfungsi sebagai 'kartu' atau 'wadah'.
// Desainnya seperti kartu pada umumnya: punya background, sudut melengkung, dan bayangan.
const CalculateCard = ({ children, style }: CardProps) => {
  return (
    // View ini mengambil style dasar dari styles.card dan bisa ditimpa/ditambah dengan prop 'style'.
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

// ## Komponen Bagian Dalam: StatCard
// Komponen ini khusus untuk menampilkan satu baris data statistik.
// Layoutnya sudah diatur: ikon di sebelah kiri, dan tumpukan teks di sebelah kanan.
const StatCard = ({ label, value, subLabel, icon }: StatCardProps) => {
  return (
    <View style={styles.statContainer}>
      {/* Wadah untuk ikon */}
      <View style={styles.iconContainer}>
        {icon}
      </View>
      {/* Wadah untuk semua teks */}
      <View style={styles.textContainer}>
        <Typo size={14} color={colors.neutral600} style={styles.label}>
          {label}
        </Typo>
        <Typo size={18} fontWeight="600" style={styles.value}>
          {value}
        </Typo>
        {/* subLabel hanya akan ditampilkan jika nilainya ada (tidak null atau undefined) */}
        {subLabel && (
          <Typo size={12} color={colors.neutral500} style={styles.subLabel}>
            {subLabel}
          </Typo>
        )}
      </View>
    </View>
  );
};

// ## Pola Komponen Majemuk (Compound Component)
// Nah, baris ini yang membuat strukturnya jadi elegan.
// Kita "menempelkan" komponen StatCard ke dalam komponen CalculateCard sebagai sebuah properti bernama 'Stat'.
// Ini memungkinkan kita memanggilnya dengan cara yang sangat rapi dan deskriptif,
// contohnya: <CalculateCard><CalculateCard.Stat ... /></CalculateCard>
CalculateCard.Stat = StatCard;

// ## Definisi Gaya (Styling)
// Di sini semua gaya visual untuk komponen di atas didefinisikan.
// Menggunakan StyleSheet.create lebih efisien daripada menulis style langsung di komponen (inline style).
const styles = StyleSheet.create({
  // Style untuk 'kartu' utama
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._15, // Sudut melengkung
    padding: 20,
    // Efek bayangan untuk iOS
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Efek bayangan untuk Android
    elevation: 3,
  },
  // Style untuk satu baris statistik di dalam kartu
  statContainer: {
    flexDirection: 'row', // Membuat ikon dan teks berjajar ke samping
    alignItems: 'center', // Membuat ikon dan teks sejajar di tengah secara vertikal
    marginBottom: spacingY._12,
    paddingVertical: spacingY._8,
    borderBottomWidth: 1, // Garis pemisah tipis di bawah setiap baris
    borderBottomColor: colors.neutral100,
  },
  // Style untuk wadah ikon (lingkaran abu-abu)
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20), // Membuatnya jadi lingkaran sempurna
    backgroundColor: colors.neutral50,
    justifyContent: 'center', // Ikon di tengah (vertikal)
    alignItems: 'center',    // Ikon di tengah (horizontal)
    marginRight: 12,
  },
  // Style untuk wadah teks, `flex: 1` agar memenuhi sisa ruang
  textContainer: {
    flex: 1,
  },
  label: {
    marginBottom: 2,
  },
  value: {
    marginBottom: 2,
  },
  subLabel: {},
});

// Mengekspor komponen CalculateCard (yang sudah "mengandung" StatCard)
// agar bisa digunakan di file atau halaman lain.
export default CalculateCard;
