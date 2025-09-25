// History.tsx

// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Keyboard, // Untuk mendeteksi kapan keyboard muncul/hilang
  Alert,
  RefreshControl, // Untuk fitur pull-to-refresh
} from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native'; // Ikon
import { Chip } from 'react-native-paper'; // Komponen Chip untuk filter
import { colors } from '@/constants/theme';
import ActionModal from '@/components/ActionModal'; // Modal custom untuk aksi (edit/delete)
import HistoryCard from '@/components/card/HistoryCard'; // Card untuk menampilkan item riwayat
import { useAuth } from '@/contexts/authContext'; // Hook untuk otentikasi & akses API
import { HistoryItem, CategoryType } from '@/types'; // Tipe data
import { useApplianceService } from '@/src/services/applianceService'; // Hook service untuk operasi data

// --- KOMPONEN UTAMA HALAMAN HISTORY ---
const History: React.FC = () => {
  // --- STATE MANAGEMENT ---
  // State untuk filter & UI
  const [selectedCategory, setSelectedCategory] = useState<string>('All'); // Kategori yang sedang aktif
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]); // Daftar nama alat yang dipilih (sebagai chip)
  const [query, setQuery] = useState<string>(''); // Teks yang diketik di search bar
  const [showDropdown, setShowDropdown] = useState<boolean>(false); // Status tampil/tidaknya dropdown autocomplete
  const [modalVisible, setModalVisible] = useState<boolean>(false); // Status tampil/tidaknya modal aksi
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null); // Item riwayat yang dipilih untuk di-edit/delete
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false); // Status apakah keyboard sedang muncul
  const [currentPage, setCurrentPage] = useState<number>(1); // Halaman pagination yang sedang aktif
  const [refreshing, setRefreshing] = useState<boolean>(false); // Status untuk pull-to-refresh

  // State untuk data riwayat
  const [allHistoryData, setAllHistoryData] = useState<HistoryItem[]>([]); // Menyimpan semua data riwayat dari API
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true); // Status loading saat mengambil data
  const [historyError, setHistoryError] = useState<string | null>(null); // Menyimpan pesan error jika gagal fetch

  // Mengambil fungsi dari context dan service
  const { getDeviceHistory } = useAuth();
  const { deleteAppliance: serviceDeleteAppliance } = useApplianceService();

  // --- KONSTANTA & KONFIGURASI ---
  const itemsPerPage = 5; // Jumlah item yang ditampilkan per halaman
  const categories = ['All', 'Entertainment', 'Cooling', 'Health', 'Lighting', 'Kitchen']; // Daftar kategori (bisa juga dari API)

  /**
   * Fungsi untuk mengambil data riwayat dari API.
   * Mengatur state loading, data, dan error.
   */
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const result = await getDeviceHistory();
      if (result.success && result.data) {
        setAllHistoryData(result.data); // Simpan data jika berhasil
      } else {
        setHistoryError(result.message || "Failed to load history.");
        setAllHistoryData([]);
      }
    } catch (error: any) {
      setHistoryError(error.message || "An error occurred while loading history.");
      setAllHistoryData([]);
    } finally {
      setLoadingHistory(false); // Hentikan loading
      setRefreshing(false); // Hentikan status refresh
    }
  };

  /**
   * Fungsi yang dipanggil saat user melakukan pull-to-refresh.
   * Dibuat dengan useCallback agar tidak dibuat ulang di setiap render.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  // --- SIDE EFFECTS HOOK (useEffect) ---
  // Hook ini berjalan sekali saat komponen pertama kali dimuat.
  useEffect(() => {
    // Menambahkan listener untuk memantau status keyboard
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setShowDropdown(false); // Sembunyikan dropdown saat keyboard hilang
    });

    // Panggil fungsi fetch data untuk pertama kali
    fetchHistory();

    // Cleanup function: hapus listener saat komponen di-unmount untuk mencegah memory leak
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // --- BAGIAN DATA COMPUTED (DERIVED STATE) ---
  // Data ini dihitung ulang setiap kali state filter atau data utama berubah.

  // 1. Membuat daftar nama alat yang unik dari semua data riwayat
  const uniqueApplianceNamesFromHistory = Array.from(new Set(allHistoryData.map(item => item.appliance)));

  // 2. Menyaring daftar nama alat unik untuk ditampilkan di dropdown autocomplete
  const filteredDropdownResults = uniqueApplianceNamesFromHistory.filter(applianceName =>
    applianceName.toLowerCase().includes(query.toLowerCase()) && // Sesuai dengan query pencarian
    !selectedAppliances.includes(applianceName) // Belum dipilih sebagai chip
  );

  // 3. Menyaring data riwayat utama berdasarkan semua filter yang aktif (kategori, chip, query)
  const filteredHistoryData = allHistoryData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category.name === selectedCategory;
    const matchesSelectedAppliance = selectedAppliances.length === 0 || selectedAppliances.includes(item.appliance);
    // Jika ada chip dipilih, pencarian query diabaikan. Jika tidak, pencarian query diterapkan.
    const matchesQuery = selectedAppliances.length > 0 ? true : item.appliance.toLowerCase().includes(query.toLowerCase());

    return matchesCategory && matchesSelectedAppliance && matchesQuery;
  });

  // 4. Menghitung total halaman dan memotong data yang sudah difilter untuk halaman saat ini (pagination)
  const totalPages = Math.ceil(filteredHistoryData.length / itemsPerPage);
  const paginatedData = filteredHistoryData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- BAGIAN EVENT HANDLERS ---
  // Fungsi-fungsi yang menangani interaksi dari user.

  // Dipanggil saat kategori diubah
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Selalu kembali ke halaman 1 saat filter berubah
  };

  // Dipanggil saat tombol 'x' pada chip ditekan
  const handleRemoveChip = (item: string) => {
    setSelectedAppliances(prev => prev.filter(i => i !== item));
    setCurrentPage(1);
  };

  // Dipanggil saat item di dropdown autocomplete dipilih
  const handleSelectApplianceFromDropdown = (applianceName: string) => {
    if (!selectedAppliances.includes(applianceName)) {
      setSelectedAppliances(prev => [...prev, applianceName]); // Tambahkan ke daftar chip
    }
    setQuery(''); // Kosongkan input pencarian
    setShowDropdown(false); // Sembunyikan dropdown
    setCurrentPage(1);
  };

  // Dipanggil setiap kali teks di search bar berubah
  const handleQueryChange = (text: string) => {
    setQuery(text);
    // Tampilkan dropdown jika ada teks dan belum ada chip yang cocok
    if (text.length > 0 && !selectedAppliances.find(sa => sa.toLowerCase().includes(text.toLowerCase()))) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
    setCurrentPage(1);
  };

  // Dipanggil saat search bar disentuh (fokus)
  const handleSearchFocus = () => {
    if (query.length > 0 && filteredDropdownResults.length > 0) {
      setShowDropdown(true);
    }
  };

  // Membuka modal aksi
  const handleOpenModal = (item: HistoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Menutup modal aksi
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  // Aksi Edit (saat ini hanya menampilkan log)
  const handleEdit = () => {
    if (selectedItem) {
      console.log('Edit item:', selectedItem);
      Alert.alert("Info", "Fitur Edit belum diimplementasikan sepenuhnya.");
    }
    handleCloseModal();
  };

  // Aksi Hapus
  const handleDelete = async () => {
    if (!selectedItem) {
      handleCloseModal();
      return;
    }
    // Tampilkan dialog konfirmasi sebelum menghapus
    Alert.alert(
      "Delete Confirmation",
      `Are you sure you want to delete the history for "${selectedItem.appliance}"?`,
      [
        { text: "Cancel", onPress: handleCloseModal, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const applianceIdToDelete = parseInt(selectedItem.id, 10);
              if (isNaN(applianceIdToDelete)) {
                Alert.alert("Error", "Invalid item ID.");
                handleCloseModal(); return;
              }
              setLoadingHistory(true);
              const result = await serviceDeleteAppliance(applianceIdToDelete);
              setLoadingHistory(false);
              if (result.success) {
                Alert.alert("Success", result.message || "Item successfully deleted.");
                fetchHistory(); // Muat ulang data setelah berhasil hapus
              } else {
                Alert.alert("Failed", result.message || "Failed to delete item.");
              }
            } catch (error: any) {
              setLoadingHistory(false);
              Alert.alert("Error", error.message || "An error occurred.");
            } finally {
              handleCloseModal();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // --- FUNGSI-FUNGSI PAGINATION ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // --- BAGIAN RENDER FUNCTIONS ---
  // Fungsi-fungsi ini bertanggung jawab untuk me-render bagian-bagian kecil dari UI.

  // Me-render tombol-tombol nomor halaman
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <TouchableOpacity
          key={i}
          style={[styles.pageNumber, i === currentPage && styles.activePageNumber]}
          onPress={() => handlePageChange(i)}
        >
          <Text style={[styles.pageNumberText, i === currentPage && styles.activePageNumberText]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return pageNumbers;
  };

  // Me-render satu item di FlatList
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <HistoryCard item={item} onOpenModal={handleOpenModal} />
  );

  // Me-render satu tombol filter kategori
  const renderCategoryPill = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[styles.categoryPill, selectedCategory === category && styles.selectedCategoryPill]}
      onPress={() => handleCategoryChange(category)}
    >
      <Text style={[styles.categoryPillText, selectedCategory === category && styles.selectedCategoryPillText]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  // --- TAMPILAN UTAMA (RETURN JSX) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calculation History</Text>
        <Text style={styles.subtitle}>View your past calculations</Text>
      </View>

      {/* Kontainer Pencarian dan Filter Chip */}
      <View style={styles.searchContainer}>
        {/* Menampilkan chip jika ada alat yang dipilih */}
        {selectedAppliances.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {selectedAppliances.map(item => (
              <Chip key={item} onClose={() => handleRemoveChip(item)} style={styles.chip} textStyle={styles.chipText}>
                {item}
              </Chip>
            ))}
          </ScrollView>
        )}
        {/* Input pencarian dengan autocomplete */}
        <View style={styles.autocompleteContainer}>
          <View style={styles.searchInputContainer}>
            <MagnifyingGlass size={20} color={colors.textDarkGrey} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search appliance name..."
              placeholderTextColor={colors.textDarkGrey}
              onFocus={handleSearchFocus}
            />
          </View>
          {/* Menampilkan dropdown jika `showDropdown` true */}
          {showDropdown && filteredDropdownResults.length > 0 && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScrollView} keyboardShouldPersistTaps="handled">
                {filteredDropdownResults.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => handleSelectApplianceFromDropdown(item)}>
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Kontainer Kategori */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map(category => renderCategoryPill(category))}
        </ScrollView>
      </View>

      {/* Daftar Riwayat */}
      <FlatList
        data={paginatedData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          (loadingHistory || historyError || paginatedData.length === 0) && styles.emptyListContainer
        ]}
        // Fitur pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
          />
        }
        keyboardShouldPersistTaps="handled" // Agar bisa tap dropdown saat keyboard aktif
        keyboardDismissMode="on-drag" // Keyboard hilang saat list di-scroll
        // Komponen yang ditampilkan jika daftar kosong
        ListEmptyComponent={() => (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              {loadingHistory
                ? "Loading history..."
                : historyError
                  ? `Error: ${historyError}`
                  : "No history found for this filter."}
            </Text>
          </View>
        )}
      />

      {/* Kontrol Pagination */}
      {/* Hanya tampil jika keyboard tidak aktif, ada lebih dari 1 halaman, dan ada data */}
      {!keyboardVisible && totalPages > 1 && paginatedData.length > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity style={styles.paginationButton} onPress={handlePreviousPage} disabled={currentPage === 1}>
            <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonDisabled]}>Previous</Text>
          </TouchableOpacity>
          <View style={styles.pageNumbers}>{renderPageNumbers()}</View>
          <TouchableOpacity style={styles.paginationButton} onPress={handleNextPage} disabled={currentPage === totalPages}>
            <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonDisabled]}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Modal Aksi (Edit/Delete) */}
      <ActionModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
};

// --- STYLING KOMPONEN ---
const styles = StyleSheet.create({
  // ... (semua style kamu ada di sini)
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 6,
    backgroundColor: '#e3f2fd',
  },
  chipText: {
    color: '#1976d2',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 49,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderTopWidth: 0,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 2,
    elevation: 3,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingTop: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedCategoryPill: {
    backgroundColor: colors.mainBlue,
    borderColor: colors.mainBlue,
  },
  categoryPillText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryPillText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80, // Beri ruang untuk pagination
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 1,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  paginationButtonText: {
    color: colors.mainBlue,
    fontWeight: '500',
    fontSize: 15,
  },
  paginationButtonDisabled: {
    color: '#adb5bd',
  },
  pageNumbers: {
    flexDirection: 'row',
  },
  pageNumber: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activePageNumber: {
    backgroundColor: colors.mainBlue,
    borderColor: colors.mainBlue,
  },
  pageNumberText: {
    color: colors.mainBlue,
    fontSize: 15,
  },
  activePageNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default History;
