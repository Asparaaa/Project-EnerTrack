// Fixed Dropdown.tsx - Mengatasi error "Text strings must be rendered within a <Text> component"

// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { moderateScale } from '@/utils/styling';
import { colors } from '@/constants/theme';
import { CaretDown } from 'phosphor-react-native';

// --- DEFINISI TIPE DATA (INTERFACE) ---
// Mendefinisikan struktur data untuk setiap item di dalam dropdown
interface DropdownDataItem {
  id: number | string;
  name: string;
}

// Mendefinisikan properti (props) apa saja yang bisa diterima oleh komponen Dropdown
interface DropdownProps {
  label: string; // Teks label di atas dropdown
  data: DropdownDataItem[]; // Array data yang akan ditampilkan sebagai pilihan
  selectedValue: string | null; // Nilai yang sedang terpilih
  placeholder: string; // Teks yang ditampilkan jika belum ada nilai yang dipilih
  onSelect: (value: string | null, id: number | string | null) => void; // Fungsi yang dipanggil saat item dipilih
  disabled?: boolean; // Opsional: untuk menonaktifkan dropdown
  searchable?: boolean; // Opsional: untuk mengaktifkan fitur pencarian
}

/**
 * Komponen Dropdown kustom yang bisa dipakai ulang (reusable).
 * Dilengkapi dengan fitur opsional untuk mencari (searchable).
 */
const Dropdown = ({ label, data, selectedValue, placeholder, onSelect, disabled = false, searchable = false }: DropdownProps) => {
  // --- STATE MANAGEMENT ---
  const [open, setOpen] = React.useState(false); // State untuk mengontrol apakah daftar pilihan terbuka atau tertutup
  const [query, setQuery] = React.useState(''); // State untuk menyimpan teks yang diketik di kolom pencarian

  /**
   * Fungsi yang dipanggil saat salah satu item di daftar pilihan ditekan.
   * @param item Objek data dari item yang dipilih.
   */
  const handleSelect = (item: DropdownDataItem) => {
    onSelect(item.name, item.id); // Kirim nilai dan id yang dipilih ke komponen induk
    setOpen(false); // Tutup daftar pilihan
    setQuery(''); // Reset teks pencarian
  };

  /**
   * Menggunakan `useMemo` untuk optimasi performa.
   * Logika filter ini hanya akan dijalankan kembali jika `data`, `query`, atau `searchable` berubah.
   * Ini mencegah proses filter yang tidak perlu di setiap render.
   */
  const filteredData = React.useMemo(() => {
    // Jika tidak ada fitur search atau query kosong, tampilkan semua data
    if (!searchable || !query) {
      return data;
    }
    // Jika ada query, filter data berdasarkan nama item
    return data.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [data, query, searchable]);

  // --- TAMPILAN (RENDER) ---
  return (
    <View style={styles.container}>
      {/* Label di atas dropdown */}
      <Text style={styles.label}>{label}</Text>
      
      {/* Bagian utama dropdown yang bisa ditekan */}
      <Pressable
        style={[styles.dropdown, disabled && styles.disabled]}
        onPress={() => {
          if (!disabled) {
            setOpen(!open); // Buka/tutup daftar pilihan
            if (!open) setQuery(''); // Reset pencarian saat dropdown dibuka
          }
        }}
        disabled={disabled}
      >
        {/* Teks yang menampilkan nilai terpilih atau placeholder */}
        <Text style={[styles.text, !selectedValue && styles.placeholder, disabled && styles.disabledText]}>
          {selectedValue || placeholder}
        </Text>
        <CaretDown size={moderateScale(20)} color={disabled ? colors.neutral300 : colors.neutral500} />
      </Pressable>

      {/* Daftar Pilihan (hanya ditampilkan jika `open` true dan tidak `disabled`) */}
      {open && !disabled && (
        <View style={styles.dropdownContent}>
          {/* Input pencarian (hanya ditampilkan jika `searchable` true) */}
          {searchable && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.neutral400}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
              // `onSubmitEditing` memungkinkan user memilih item pertama dengan menekan tombol 'search' di keyboard
              onSubmitEditing={() => {
                if (filteredData.length > 0) {
                  handleSelect(filteredData[0]);
                }
              }}
            />
          )}
          {/* Daftar item yang bisa di-scroll */}
          <ScrollView
            style={styles.list}
            nestedScrollEnabled // Berguna jika dropdown berada di dalam ScrollView lain
            keyboardShouldPersistTaps="handled" // PENTING: Memungkinkan tap pada item tanpa keyboard menutup duluan
          >
            {/* Cek apakah ada hasil dari filter */}
            {filteredData.length > 0 ? (
              // Jika ada, tampilkan semua item hasil filter
              filteredData.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  style={styles.listItem}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </Pressable>
              ))
            ) : (
              // Jika tidak ada hasil, tampilkan pesan
              <View style={styles.listItem}>
                <Text style={[styles.listItemText, styles.noResultsText]}>No results found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// --- STYLING KOMPONEN ---
const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(8),
  },
  label: {
    marginBottom: moderateScale(6),
    color: colors.neutral700,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: colors.white,
  },
  text: {
    fontSize: moderateScale(14),
    color: colors.neutral900,
    flex: 1, // Mencegah teks panjang mendorong ikon keluar dari view
  },
  placeholder: {
    color: colors.neutral400,
  },
  dropdownContent: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: moderateScale(8),
    marginTop: moderateScale(4),
    backgroundColor: colors.white,
    overflow: 'hidden',
    elevation: 3, // Bayangan untuk Android
    shadowColor: '#000', // Bayangan untuk iOS
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(14),
    color: colors.neutral900,
  },
  list: {
    maxHeight: moderateScale(150), // Batasi tinggi maksimum daftar agar tidak terlalu panjang
  },
  listItem: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  listItemText: {
    fontSize: moderateScale(14),
    color: colors.neutral900,
  },
  noResultsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: colors.neutral500,
  },
  disabled: {
    backgroundColor: colors.neutral100,
    borderColor: colors.neutral200,
  },
  disabledText: {
    color: colors.neutral400,
  },
});

export default Dropdown;
