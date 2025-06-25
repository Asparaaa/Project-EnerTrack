// History.tsx
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
  Keyboard,
  Alert,
  RefreshControl,
} from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';
import { Chip } from 'react-native-paper'; // Pastikan react-native-paper terinstal
import { colors } from '@/constants/theme'; // Sesuaikan path jika perlu
import ActionModal from '@/components/ActionModal'; // Sesuaikan path jika perlu
import HistoryCard from '@/components/card/HistoryCard'; // Sesuaikan path jika perlu
import { useAuth } from '@/contexts/authContext'; // Sesuaikan path jika perlu
import { HistoryItem, CategoryType } from '@/types'; // Sesuaikan path jika perlu
import { useApplianceService } from '@/src/services/applianceService'; // Sesuaikan path jika perlu

const History: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]); // Mengganti nama 'selected' menjadi 'selectedAppliances' agar lebih jelas
  const [query, setQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [allHistoryData, setAllHistoryData] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { getDeviceHistory } = useAuth();
  const { deleteAppliance: serviceDeleteAppliance } = useApplianceService();

  const itemsPerPage = 5;
  // Daftar kategori - ini bisa juga diambil dari backend jika dinamis
  const categories = ['All', 'Entertainment', 'Cooling', 'Health', 'Lighting', 'Kitchen',];


  const fetchHistory = async () => {
    try {
    setLoadingHistory(true);
    setHistoryError(null);
    const result = await getDeviceHistory();
    if (result.success && result.data) {
      setAllHistoryData(result.data);
    } else {
        setHistoryError(result.message || "Failed to load history.");
        setAllHistoryData([]);
      }
    } catch (error: any) {
      setHistoryError(error.message || "An error occurred while loading history.");
      setAllHistoryData([]);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setShowDropdown(false);
    });

    fetchHistory();

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);


  // --- START BAGIAN DATA COMPUTED ---
  const uniqueApplianceNamesFromHistory = Array.from(new Set(allHistoryData.map(item => item.appliance)));

  const filteredDropdownResults = uniqueApplianceNamesFromHistory.filter(applianceName =>
    applianceName.toLowerCase().includes(query.toLowerCase()) &&
    !selectedAppliances.includes(applianceName)
  );

  const filteredHistoryData = allHistoryData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category.name === selectedCategory;
    const matchesSelectedAppliance = selectedAppliances.length === 0 || selectedAppliances.includes(item.appliance);
    // Tambahkan filter berdasarkan query pencarian nama appliance jika query tidak kosong dan tidak ada chip appliance yang dipilih
    const matchesQuery = selectedAppliances.length > 0 ? true : item.appliance.toLowerCase().includes(query.toLowerCase());

    return matchesCategory && matchesSelectedAppliance && matchesQuery;
  });

  const totalPages = Math.ceil(filteredHistoryData.length / itemsPerPage);
  const paginatedData = filteredHistoryData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // --- END BAGIAN DATA COMPUTED ---


  // --- START EVENT HANDLERS ---
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset ke halaman pertama saat filter kategori berubah
  };

  const handleRemoveChip = (item: string) => {
    setSelectedAppliances(prev => prev.filter(i => i !== item));
    setCurrentPage(1);
  };

  const handleSelectApplianceFromDropdown = (applianceName: string) => {
    if (!selectedAppliances.includes(applianceName)) {
      setSelectedAppliances(prev => [...prev, applianceName]);
    }
    setQuery(''); // Kosongkan query setelah memilih dari dropdown
    setShowDropdown(false);
    setCurrentPage(1);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.length > 0 && !selectedAppliances.find(sa => sa.toLowerCase().includes(text.toLowerCase()))) {
        setShowDropdown(true);
    } else {
        setShowDropdown(false);
    }
    setCurrentPage(1); // Reset ke halaman pertama saat query pencarian berubah
  };

  const handleSearchFocus = () => {
    if (query.length > 0 && filteredDropdownResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleOpenModal = (item: HistoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    if (selectedItem) {
      console.log('Edit item:', selectedItem);
      Alert.alert("Info", "Edit function is not fully implemented yet. Navigation to edit page will be added here.");
      // Contoh navigasi: navigation.navigate('EditApplianceScreen', { applianceId: parseInt(selectedItem.id, 10) });
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!selectedItem) {
      handleCloseModal();
      return;
    }
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
                return 1;
              }
              setLoadingHistory(true);
              const result = await serviceDeleteAppliance(applianceIdToDelete);
              setLoadingHistory(false);
              if (result.success) {
                Alert.alert("Success", result.message || "Item successfully deleted.");
                fetchHistory(); // Reload data
              } else {
                Alert.alert("Failed", result.message || "Failed to delete item.");
              }
            } catch (error: any) {
              setLoadingHistory(false);
              console.error("Error deleting item:", error);
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
  // --- END EVENT HANDLERS ---


  // --- START RENDER FUNCTIONS ---
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
          onPress={() => handlePageChange(i)} // Menggunakan handlePageChange
        >
          <Text style={[styles.pageNumberText, i === currentPage && styles.activePageNumberText]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return pageNumbers;
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <HistoryCard item={item} onOpenModal={handleOpenModal} />
  );

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
  // --- END RENDER FUNCTIONS ---

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.header}>
        <Text style={styles.title}>Calculation History</Text>
        <Text style={styles.subtitle}>View your past calculations</Text>
      </View>

      <View style={styles.searchContainer}>
        {selectedAppliances.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {selectedAppliances.map(item => (
              <Chip key={item} onClose={() => handleRemoveChip(item)} style={styles.chip} textStyle={styles.chipText}>
                {item}
              </Chip>
            ))}
          </ScrollView>
        )}
        <View style={styles.autocompleteContainer}>
          <View style={styles.searchInputContainer}>
            <MagnifyingGlass size={20} color={colors.textDarkGrey} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search appliance name..." placeholderTextColor={colors.textDarkGrey}
              onFocus={handleSearchFocus}
            />
          </View>
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

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map(category => renderCategoryPill(category))}
        </ScrollView>
      </View>

        <FlatList
          data={paginatedData}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          (loadingHistory || historyError || paginatedData.length === 0) && styles.emptyListContainer
        ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
            onRefresh={onRefresh}
              colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
            />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
      <ActionModal 
        visible={modalVisible} 
        onClose={handleCloseModal} 
        onDelete={handleDelete} 
      />
    </SafeAreaView>
  );
};

// --- STYLES --- (Pastikan styles Anda sudah lengkap dan benar)
const styles = StyleSheet.create({
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
    // paddingLeft: 4, // Tidak perlu jika chip punya margin sendiri
  },
  chip: {
    marginRight: 6,
    backgroundColor: '#e3f2fd',
  },
  chipText: {
    color: '#1976d2',
    // fontWeight: 'bold', // Bisa ditambahkan jika ingin
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
    paddingBottom: 80,
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