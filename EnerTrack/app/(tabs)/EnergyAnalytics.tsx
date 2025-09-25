// --- IMPORT BAGIAN-BAGIAN PENTING ---
// Import library inti dari React dan React Native
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
// Import komponen chart dari library react-native-gifted-charts
import { BarChart, PieChart } from 'react-native-gifted-charts';

// Import context untuk otentikasi dan fungsi API
import { useAuth } from '@/contexts/authContext';
// Import komponen-komponen custom
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
// Import tipe data (interfaces)
import { ChartDataPoint, CategoryChartData } from '@/types';
import { moderateScale, scale } from '@/utils/styling';
// Import hook dari expo-router untuk navigasi dan side-effects
import { useFocusEffect, router } from 'expo-router';

// Mengambil lebar layar untuk menentukan lebar chart secara dinamis
const { width } = Dimensions.get('window');
const chartWidth = width - (spacingX._20 * 2); // Lebar chart = lebar layar dikurangi padding kiri-kanan

// --- FUNGSI BANTU (HELPER FUNCTION) ---
/**
 * Fungsi untuk mendapatkan tanggal hari Senin dari minggu saat ini berdasarkan tanggal yang diberikan.
 * Berguna untuk menampilkan rentang tanggal di header chart mingguan.
 * @param d Tanggal saat ini (new Date())
 * @returns Objek Date yang sudah di-set ke hari Senin jam 00:00.
 */
const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Minggu, 1 = Senin, dst.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Hitung selisih hari ke Senin
  date.setDate(diff);
  date.setHours(0, 0, 0, 0); // Reset jam ke awal hari
  return date;
};

// --- KOMPONEN UTAMA HALAMAN ANALYTICS ---
const EnergyAnalytics = () => {
  // Mengambil fungsi-fungsi untuk fetch data statistik dari AuthContext
  const { getWeeklyStatistics, getMonthlyStatistics, getCategoryStatistics } = useAuth();

  // --- STATE MANAGEMENT ---
  // State untuk menyimpan data mentah dari API sebelum diolah untuk chart
  const [rawWeeklyData, setRawWeeklyData] = useState<ChartDataPoint[]>([]);
  const [rawMonthlyData, setRawMonthlyData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<CategoryChartData[]>([]);

  // State untuk status UI (loading, refresh, dll)
  const [loadingCharts, setLoadingCharts] = useState(true); // Status loading saat pertama kali buka halaman
  const [refreshing, setRefreshing] = useState(false); // Status untuk pull-to-refresh
  const [currentWeekDisplay, setCurrentWeekDisplay] = useState(''); // Teks rentang tanggal minggu ini
  const [lastRefresh, setLastRefresh] = useState<string>(''); // Teks waktu terakhir refresh

  /**
   * Fungsi utama untuk mengambil semua data yang dibutuhkan untuk chart dari API.
   * Menggunakan useCallback agar fungsi ini tidak dibuat ulang di setiap render.
   * @param isManualRefresh Menandakan apakah fungsi ini dipanggil oleh pull-to-refresh atau bukan.
   */
  const fetchChartData = useCallback(async (isManualRefresh = false) => {
    // Set status loading yang sesuai
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoadingCharts(true);
    }

    try {
      const currentTime = new Date();
      const formattedDate = currentTime.toISOString().split('T')[0]; // Format tanggal YYYY-MM-DD

      // Mengambil data mingguan, bulanan, dan kategori secara bersamaan (paralel) untuk efisiensi
      const [weeklyRes, monthlyRes, categoryRes] = await Promise.all([
        getWeeklyStatistics(formattedDate),
        getMonthlyStatistics(),
        getCategoryStatistics(),
      ]);

      // --- PENGOLAHAN DATA MINGGUAN ---
      if (weeklyRes.success && weeklyRes.data) {
        // Membersihkan dan memformat data mingguan agar sesuai dengan format chart
        const validWeeklyData = weeklyRes.data.map((item: any, index: number) => ({
          label: item.label || item.day || `Day ${index + 1}`,
          value: parseFloat(item.value || item.kwh || item.consumption || 0),
          frontColor: item.frontColor || '#3B82F6'
        }));
        setRawWeeklyData(validWeeklyData);
      } else {
        setRawWeeklyData([]);
      }

      // --- PENGOLAHAN DATA BULANAN ---
      if (monthlyRes.success && monthlyRes.data) {
        // Membersihkan, memformat, dan memfilter data bulanan
        const validMonthlyData = monthlyRes.data
          .map((item: any, index: number) => ({
            label: item.label || item.month || `Month ${index + 1}`,
            value: parseFloat(item.value || item.kwh || item.consumption || 0),
            frontColor: item.frontColor || '#48C353'
          }))
          .filter(item => {
            // Filter anomali data, misalnya label 'W5' (minggu ke-5) yang tidak seharusnya ada di data bulanan per minggu
            const label = item.label.toUpperCase();
            if (label.startsWith('W')) {
              const weekNumber = parseInt(label.substring(1), 10);
              return !isNaN(weekNumber) && weekNumber >= 1 && weekNumber <= 4;
            }
            return true;
          });
        setRawMonthlyData(validMonthlyData);
      } else {
        setRawMonthlyData([]);
      }

      // --- PENGOLAHAN DATA KATEGORI (UNTUK PIE CHART) ---
      if (categoryRes.success && categoryRes.data) {
        // Fungsi helper untuk menentukan warna pie chart berdasarkan nama kategori
        const getPieColor = (name: string) => {
          switch (name) {
            case 'Entertainment': return colors.catBlue;
            case 'Cooling': return colors.catGreen;
            case 'Kitchen': return colors.catPurple;
            case 'Lighting': return colors.catYellow;
            case 'Health': return colors.catRed;
            case 'Heating': return colors.catOrange;
            default: return `#${Math.floor(Math.random() * 16777215).toString(16)}`; // Warna random jika kategori tidak dikenal
          }
        };
        // Memformat data kategori
        const validCategoryData = categoryRes.data.map((item: any, index: number) => {
          const name = item.name || item.category || `Category ${index + 1}`;
          return {
            name,
            total_power: parseFloat(item.total_power || item.power || item.kwh || 0),
            percentage: parseFloat(item.percentage || 0),
            color: getPieColor(name)
          };
        });
        setPieChartData(validCategoryData);
      } else {
        setPieChartData([]);
      }

      // Set waktu terakhir refresh
      setLastRefresh(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    } catch (error: any) {
      console.error("❌ Error loading chart data:", error);
      Alert.alert('Error', error.message || 'An error occurred while loading chart data.');
    } finally {
      // Hentikan semua status loading setelah selesai (baik sukses maupun gagal)
      setLoadingCharts(false);
      setRefreshing(false);
    }
  }, [getWeeklyStatistics, getMonthlyStatistics, getCategoryStatistics]);

  /**
   * Handler untuk pull-to-refresh.
   */
  const handleManualRefresh = useCallback(() => {
    fetchChartData(true);
  }, [fetchChartData]);

  // --- SIDE EFFECTS HOOKS ---
  // useFocusEffect akan menjalankan fungsinya setiap kali layar ini mendapatkan fokus (dibuka oleh user).
  // Ini memastikan data selalu yang terbaru saat user kembali ke halaman ini.
  useFocusEffect(
    useCallback(() => {
      fetchChartData(false); // Panggil fetch data saat layar fokus
    }, [fetchChartData])
  );

  // useEffect ini hanya berjalan sekali saat komponen pertama kali dimuat.
  // Tujuannya untuk mengatur teks rentang tanggal (misal: "Sep 23 - Sep 29, 2025").
  useEffect(() => {
    const today = new Date();
    const mondayOfCurrentWeek = getMonday(today);
    const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
    sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);

    const displayText = `${mondayOfCurrentWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${sundayOfCurrentWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    setCurrentWeekDisplay(displayText);
  }, []);

  // --- KALKULASI & LOGIKA TAMPILAN ---
  // Menghitung total kWh mingguan dari data yang sudah di-fetch
  const totalWeeklyKwh = rawWeeklyData.reduce((sum, item) => sum + (item.value || 0), 0);
  // Kondisi untuk menampilkan pesan "No Data" di chart mingguan
  const showNoDataForWeeklyChart = !rawWeeklyData || rawWeeklyData.length === 0 || totalWeeklyKwh === 0;

  // Menghitung total kWh bulanan
  const totalMonthlyKwh = rawMonthlyData.reduce((sum, item) => sum + (item.value || 0), 0);
  // Kondisi untuk menampilkan pesan "No Data" di chart bulanan
  const showNoDataForMonthlyChart = !rawMonthlyData || rawMonthlyData.length === 0 || totalMonthlyKwh === 0;

  /**
   * Fungsi untuk menghitung nilai maksimum yang akan ditampilkan di sumbu Y chart.
   * Dibuat agar skala chart terlihat bagus dan tidak terlalu mepet.
   * @param data Array data chart.
   * @param defaultMax Nilai default jika tidak ada data.
   * @param stepMultiple Pembulatan ke kelipatan angka ini (misal: 5).
   * @returns Nilai maksimum untuk properti `maxValue` chart.
   */
  const getMaxChartValue = (data: ChartDataPoint[], defaultMax: number, stepMultiple: number = 5): number => {
    if (!data || data.length === 0) return defaultMax;
    const maxValue = Math.max(...data.map(item => item.value || 0));
    if (maxValue === 0) return defaultMax;
    // Hitung nilai max dengan buffer 30%, lalu bulatkan ke atas ke kelipatan `stepMultiple`
    const calculatedMax = Math.ceil(maxValue * 1.3 / stepMultiple) * stepMultiple;
    return Math.max(calculatedMax, stepMultiple); // Pastikan nilai minimum adalah `stepMultiple`
  };

  // Menentukan nilai maksimum untuk setiap chart secara dinamis
  const weeklyChartMaxValue = getMaxChartValue(rawWeeklyData, 10);
  const monthlyCostMaxValue = getMaxChartValue(rawMonthlyData.map(d => ({ ...d, value: (d.value || 0) * 1500 })), 50000, 5000);
  const monthlyCostNoOfSections = Math.max(1, monthlyCostMaxValue / 5000); // Menentukan jumlah garis horizontal di chart
  const totalKwhFromCategories = pieChartData.reduce((acc, item) => acc + item.total_power, 0);

  // --- TAMPILAN (RENDER) ---
  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Konfigurasi untuk pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
          />
        }
      >
        {/* Tampilkan loading indicator besar saat pertama kali memuat data */}
        {loadingCharts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.mainBlue} />
            <Typo style={styles.loadingText}>Loading data...</Typo>
          </View>
        ) : (
          // Jika tidak loading, tampilkan konten utama
          <View style={styles.contentContainer}>
            {/* Info waktu terakhir refresh */}
            <View style={styles.refreshInfoContainer}>
              <Typo size={12} color={colors.neutral500}>
                Last refresh: {lastRefresh}
              </Typo>
            </View>

            {/* --- CARD 1: KONSUMSI ENERGI MINGGUAN (BAR CHART) --- */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Typo size={16} fontWeight="600" color={colors.mirage}>Energy Consumption (kWh)</Typo>
                <Typo size={14} fontWeight="500" color={colors.textDarkGrey} style={{ marginTop: 4 }}>
                  {currentWeekDisplay}
                </Typo>
                <Typo size={18} fontWeight="bold" color={colors.mirage} style={{ marginTop: 2 }}>
                  This Week Total: {totalWeeklyKwh.toFixed(2)} kWh
                </Typo>
              </View>

              {/* Tampilkan pesan 'No Data' atau chart-nya */}
              {showNoDataForWeeklyChart ? (
                <View style={styles.noDataContainer}>
                  <Typo style={styles.noDataText}>
                    No consumption data available for this week. Start adding your energy consumption data!
                  </Typo>
                  <TouchableOpacity
                    style={styles.addDataButton}
                    onPress={() => router.push('/Calculate')} // Tombol untuk pindah ke halaman kalkulator
                  >
                    <Typo style={styles.addDataButtonText}>Add Data</Typo>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginLeft: -20 }}>
                  <BarChart
                    data={rawWeeklyData.map(item => ({
                      ...item,
                      value: Math.max(item.value || 0, 0) // Pastikan value tidak negatif
                    }))}
                    // Properti untuk styling dan fungsionalitas chart
                    width={chartWidth}
                    height={220}
                    isAnimated
                    barWidth={moderateScale(18)}
                    frontColor="#3B82F6"
                    barBorderRadius={4}
                    maxValue={Math.max(weeklyChartMaxValue, 1)}
                    yAxisColor="#CBD5E1"
                    xAxisColor="#CBD5E1"
                    spacing={scale(22)}
                    initialSpacing={scale(15)}
                    noOfSections={4}
                    xAxisLabelTextStyle={{ color: colors.neutral500 }}
                    yAxisTextStyle={{ color: colors.neutral500 }}
                    yAxisLabelSuffix=" kWh"
                    yAxisLabelWidth={65}
                    rulesType="solid"
                    rulesColor="#E2E8F0"
                  />
                </View>
              )}
            </View>

            {/* --- CARD 2: KONSUMSI BERDASARKAN KATEGORI (PIE CHART) --- */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Typo size={16} fontWeight="600" color={colors.mirage}>Consumption by Category</Typo>
              </View>
              {totalKwhFromCategories > 0 ? (
                <View>
                  <View style={styles.pieChartWrapper}>
                    <PieChart
                      data={pieChartData.map(item => ({ value: item.percentage, color: item.color }))}
                      donut
                      radius={moderateScale(90)}
                      innerRadius={moderateScale(50)}
                    />
                  </View>
                  {/* Bagian legenda untuk pie chart */}
                  <View style={styles.legendContainer}>
                    {pieChartData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={styles.legendLeft}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Typo size={14} color={colors.mirage}>{item.name}</Typo>
                        </View>
                        <Typo size={14} fontWeight="600" color={colors.mirage}>{item.percentage.toFixed(1)}%</Typo>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Typo style={styles.noDataText}>No consumption data available by category.</Typo>
                </View>
              )}
            </View>

            {/* --- CARD 3: TREN BIAYA BULANAN (BAR CHART) --- */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Typo size={16} fontWeight="600" color={colors.mirage}>Monthly Cost Trends (Rp)</Typo>
              </View>
              {showNoDataForMonthlyChart ? (
                <View style={styles.noDataContainer}>
                  <Typo style={styles.noDataText}>No cost data available for this month.</Typo>
                </View>
              ) : (
                <View style={{ marginLeft: -15 }}>
                  <BarChart
                    data={rawMonthlyData.map(item => ({
                      ...item,
                      value: Math.max((item.value || 0) * 1500, 0) // Konversi kWh ke Rupiah (asumsi tarif 1500/kWh)
                    }))}
                    width={chartWidth}
                    height={220}
                    isAnimated
                    barWidth={moderateScale(18)}
                    frontColor="#48C353"
                    barBorderRadius={4}
                    maxValue={Math.max(monthlyCostMaxValue, 1500)}
                    yAxisColor="#CBD5E1"
                    xAxisColor="#CBD5E1"
                    spacing={scale(50)}
                    initialSpacing={scale(20)}
                    noOfSections={monthlyCostNoOfSections}
                    xAxisLabelTextStyle={{ color: colors.neutral500 }}
                    yAxisTextStyle={{ color: colors.neutral500 }}
                    yAxisLabelPrefix="Rp "
                    yAxisLabelWidth={65}
                    rulesType="solid"
                    rulesColor="#E2E2E2"
                  />
                </View>
              )}
            </View>

          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

// --- STYLING KOMPONEN ---
// Menggunakan StyleSheet.create untuk performa yang lebih baik
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  contentContainer: {
    paddingVertical: spacingY._20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: Dimensions.get('window').height * 0.8,
  },
  loadingText: {
    marginTop: spacingY._10,
    fontSize: moderateScale(16),
    color: colors.neutral600,
  },
  refreshInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._10,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    marginHorizontal: spacingX._20,
    marginBottom: spacingY._20,
    padding: spacingX._15,
    shadowColor: colors.neutral400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  chartHeader: {
    paddingHorizontal: spacingX._5,
    marginBottom: spacingY._15,
    paddingLeft: 0,
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacingY._15,
    height: moderateScale(200),
  },
  legendContainer: {
    marginTop: spacingY._20,
    paddingHorizontal: spacingX._5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingY._10,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginRight: spacingX._10,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: spacingY._30,
    minHeight: moderateScale(120),
    justifyContent: 'center',
    width: '100%',
  },
  noDataText: {
    textAlign: 'center',
    color: colors.neutral500,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: spacingY._15,
    paddingHorizontal: spacingX._20,
  },
  addDataButton: {
    backgroundColor: colors.mainBlue,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._8,
    alignSelf: 'center',
  },
  addDataButtonText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default EnergyAnalytics;
