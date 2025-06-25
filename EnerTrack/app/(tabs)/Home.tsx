import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '@/contexts/authContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { HistoryItem } from '@/types';
import { Lightning, CalendarX, Wallet } from 'phosphor-react-native';

// Komponen kecil untuk Kartu Ringkasan
const SummaryCard = ({ title, value, unit, icon, color }: { title: string, value: string, unit: string, icon: React.ReactNode, color: string }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIconContainer, { backgroundColor: `${color}20` }]}>
      {icon}
    </View>
    <View style={styles.cardTextContainer}>
      <Typo size={14} color={colors.neutral600}>{title}</Typo>
      <View style={styles.cardValueRow}>
        <Typo size={20} fontWeight="bold" color={colors.neutral800}>{value}</Typo>
        <Typo size={14} color={colors.neutral600} style={{ marginLeft: spacingX._4 }}>{unit}</Typo>
      </View>
    </View>
  </View>
);

// Komponen kecil untuk Item Riwayat Terakhir
const RecentHistoryItem = ({ item }: { item: HistoryItem }) => (
  <TouchableOpacity style={styles.historyItem} onPress={() => router.push('/(tabs)/History')}>
    <View style={styles.historyItemText}>
      <Typo size={16} fontWeight="500" color={colors.neutral800} textProps={{ numberOfLines: 1 }}>
        {item.appliance}
      </Typo>
      <Typo size={12} color={colors.neutral500} style={styles.categoryText}>
        {item.category.name} • {item.date}
      </Typo>
    </View>
    <Typo size={16} fontWeight="bold" color={colors.mainBlue}>
      {item.dailyKwh.toFixed(2)} kWh
    </Typo>
  </TouchableOpacity>
);

const Home = () => {
  const { user, getWeeklyStatistics, getMonthlyStatistics, getDeviceHistory } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayKwh, setTodayKwh] = useState(0);
  const [weeklyKwh, setWeeklyKwh] = useState(0);
  const [estimatedMonthlyCost, setEstimatedMonthlyCost] = useState(0);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);

  const getTodayLabel = () => {
    const dayIndex = new Date().getDay();
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[dayIndex];
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [weeklyRes, monthlyRes, historyRes] = await Promise.all([
        getWeeklyStatistics(),
        getMonthlyStatistics(),
        getDeviceHistory()
      ]);

      if (weeklyRes.success && weeklyRes.data) {
        const todayLabel = getTodayLabel();
        const todayData = weeklyRes.data.find(item => item.label === todayLabel);
        setTodayKwh(todayData ? todayData.value : 0);
        
        // Calculate total weekly consumption
        const totalWeeklyKwh = weeklyRes.data.reduce((sum, item) => sum + item.value, 0);
        setWeeklyKwh(totalWeeklyKwh);
      }

      if (monthlyRes.success && monthlyRes.data) {
        const totalMonthlyKwh = monthlyRes.data.reduce((sum, item) => sum + item.value, 0);
        setEstimatedMonthlyCost(totalMonthlyKwh * 1500);
      }

      if (historyRes.success && historyRes.data) {
        setRecentHistory(historyRes.data.slice(0, 3));
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data.");
    }
  }, [getWeeklyStatistics, getMonthlyStatistics, getDeviceHistory]);

  // Function untuk handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log("Pull-to-refresh triggered on Home page!");
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardData]);

  // Initial load data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDashboardData();
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardData]);

  // --- PERUBAHAN: Gunakan useFocusEffect untuk auto-refresh ---
  useFocusEffect(
    useCallback(() => {
      console.log("Home/Dashboard page received focus, reloading data...");
      loadInitialData();
    }, [loadInitialData])
  );

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mainBlue} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.mainBlue]} // Android
            tintColor={colors.mainBlue} // iOS
          />
        }
      >
        <View style={styles.headerContainer}>
          <View>
            <Typo size={18} color={colors.neutral600}>Welcome back,</Typo>
            <Typo size={24} fontWeight="bold" color={colors.neutral800}>
              {user?.username || 'User'}!
            </Typo>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <SummaryCard 
            title="Today's Consumption" 
            value={todayKwh.toFixed(2)} 
            unit="kWh"
            color= {colors.mainBlue}
            icon={<Lightning size={24} color="#3B82F6" weight="fill" />}
          />
          <SummaryCard 
            title="This Week" 
            value={weeklyKwh.toFixed(2)} 
            unit="kWh"
            color="#10B981"
            icon={<CalendarX size={24} color="#10B981" weight="fill" />}
          />
          <SummaryCard 
            title="Est. Monthly Cost" 
            value={estimatedMonthlyCost.toLocaleString('id-ID')}
            unit="Rp"
            color="#F59E0B"
            icon={<Wallet size={24} color={colors.energyOrange} weight="fill" />}
          />
        </View>

        <View style={styles.recentActivityContainer}>
          <View style={styles.recentActivityHeader}>
            <Typo size={18} fontWeight="bold" color={colors.neutral800}>Recent Activity</Typo>
            <TouchableOpacity onPress={() => router.push('/(tabs)/History')}>
              <Typo size={14} fontWeight="500" color={colors.mainBlue}>View All</Typo>
            </TouchableOpacity>
          </View>
          
          {recentHistory.length > 0 ? (
            recentHistory.map(item => <RecentHistoryItem key={`recent-${item.id}`} item={item} />)
          ) : (
            <View style={styles.noDataCard}>
              <Typo style={styles.noDataText}>No activity recorded yet.</Typo>
              <Typo style={styles.noDataSubText}>Try calculating device consumption in the 'Calculate' tab.</Typo>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  summaryContainer: {
    paddingHorizontal: spacingX._20,
    marginTop: spacingY._20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius._12,
    padding: spacingX._15,
    marginBottom: spacingY._12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius._10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacingY._4,
  },
  recentActivityContainer: {
    marginTop: spacingY._20,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacingX._15,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
  },
  historyItemText: {
    flex: 1,
    marginRight: spacingX._10,
  },
  categoryText: {
    marginTop: spacingY._2,
  },
  noDataCard: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    padding: spacingX._20,
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: colors.neutral500,
  },
  noDataSubText: {
    textAlign: 'center',
    color: colors.neutral400,
    fontSize: 12,
    marginTop: 4,
  },
});


export default Home;