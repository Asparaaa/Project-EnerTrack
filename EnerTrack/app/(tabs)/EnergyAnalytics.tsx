import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

import { useAuth } from '@/contexts/authContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { ChartDataPoint, CategoryChartData } from '@/types';
import { moderateScale, scale } from '@/utils/styling';
import { useFocusEffect, router } from 'expo-router';

const { width } = Dimensions.get('window');
const chartWidth = width - (spacingX._20 * 2);

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const EnergyAnalytics = () => {
  const { getWeeklyStatistics, getMonthlyStatistics, getCategoryStatistics } = useAuth();
  
  const [rawWeeklyData, setRawWeeklyData] = useState<ChartDataPoint[]>([]);
  const [rawMonthlyData, setRawMonthlyData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<CategoryChartData[]>([]);
  
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeekDisplay, setCurrentWeekDisplay] = useState('');
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchChartData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoadingCharts(true);
    }
    
    try {
      const currentTime = new Date();
      const formattedDate = currentTime.toISOString().split('T')[0];
      
      const [weeklyRes, monthlyRes, categoryRes] = await Promise.all([
        getWeeklyStatistics(formattedDate),
        getMonthlyStatistics(),
        getCategoryStatistics(),
      ]);

      if (weeklyRes.success && weeklyRes.data) {
        const validWeeklyData = weeklyRes.data.map((item: any, index: number) => {
          return {
            label: item.label || item.day || `Day ${index + 1}`,
            value: parseFloat(item.value || item.kwh || item.consumption || 0),
            frontColor: item.frontColor || '#3B82F6'
          };
        });
        setRawWeeklyData(validWeeklyData);
      } else {
        setRawWeeklyData([]);
        console.warn("⚠️ Weekly data is empty or failed to load:", weeklyRes.message);
      }

      if (monthlyRes.success && monthlyRes.data) {
        // Validate and transform data
        const validMonthlyData = monthlyRes.data
          .map((item: any, index: number) => {
            return {
              label: item.label || item.month || `Month ${index + 1}`,
              value: parseFloat(item.value || item.kwh || item.consumption || 0),
              frontColor: item.frontColor || '#48C353'
            };
          })
          .filter(item => {
            // Filter out 'W5' or any week labels beyond 'W4' if they appear in monthly data
            const label = item.label.toUpperCase();
            if (label.startsWith('W')) {
              const weekNumber = parseInt(label.substring(1), 10);
              return !isNaN(weekNumber) && weekNumber >= 1 && weekNumber <= 4;
            }
            return true; // Keep non-week labels
          });
        setRawMonthlyData(validMonthlyData);
      } else {
        setRawMonthlyData([]);
      }

      if (categoryRes.success && categoryRes.data) {
        // Validate and transform data
        const getPieColor = (name: string) => {
          switch (name) {
            case 'Entertainment': return colors.catBlue;
            case 'Cooling': return colors.catGreen;
            case 'Kitchen': return colors.catPurple;
            case 'Lighting': return colors.catYellow;
            case 'Health': return colors.catRed;
            case 'Heating': return colors.catOrange;
            default: return `#${Math.floor(Math.random()*16777215).toString(16)}`;
          }
        };
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
      
      setLastRefresh(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
    } catch (error: any) {
      console.error("❌ Error loading chart data:", error);
      Alert.alert('Error', error.message || 'An error occurred while loading chart data.');
    } finally {
      setLoadingCharts(false);
      setRefreshing(false);
    }
  }, [getWeeklyStatistics, getMonthlyStatistics, getCategoryStatistics]);

  const handleManualRefresh = useCallback(() => {
    fetchChartData(true);
  }, [fetchChartData]);

  useFocusEffect(
    useCallback(() => {
      fetchChartData(false);
    }, [fetchChartData])
  );

  useEffect(() => {
    const today = new Date();
    const mondayOfCurrentWeek = getMonday(today);
    const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
    sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);

    const displayText = `${mondayOfCurrentWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${sundayOfCurrentWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    setCurrentWeekDisplay(displayText);
  }, []);
  
  // Fixed condition to display chart - more permissive
  const totalWeeklyKwh = rawWeeklyData.reduce((sum, item) => sum + (item.value || 0), 0);
  const showNoDataForWeeklyChart = !rawWeeklyData || rawWeeklyData.length === 0 || totalWeeklyKwh === 0;
  
  const totalMonthlyKwh = rawMonthlyData.reduce((sum, item) => sum + (item.value || 0), 0);
  const showNoDataForMonthlyChart = !rawMonthlyData || rawMonthlyData.length === 0 || totalMonthlyKwh === 0;
  
  const getMaxChartValue = (data: ChartDataPoint[], defaultMax: number, stepMultiple: number = 5): number => {
    if (!data || data.length === 0) return defaultMax;
    const maxValue = Math.max(...data.map(item => item.value || 0));
    if (maxValue === 0) return defaultMax;
    const calculatedMax = Math.ceil(maxValue * 1.3 / stepMultiple) * stepMultiple;
    return Math.max(calculatedMax, stepMultiple);
  };

  const weeklyChartMaxValue = getMaxChartValue(rawWeeklyData, 10);
  const monthlyCostMaxValue = getMaxChartValue(rawMonthlyData.map(d=> ({...d, value: (d.value || 0) * 1500})), 50000, 5000);
  const monthlyCostNoOfSections = Math.max(1, monthlyCostMaxValue / 5000);
  const totalKwhFromCategories = pieChartData.reduce((acc, item) => acc + item.total_power, 0);

  const getTodayLabel = () => {
    const dayIndex = new Date().getDay();
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[dayIndex];
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
          />
        }
      >
        {loadingCharts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.mainBlue} />
            <Typo style={styles.loadingText}>Loading data...</Typo>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.refreshInfoContainer}>
              <Typo size={12} color={colors.neutral500}>
                Last refresh: {lastRefresh}
              </Typo>
            </View>

            {/* WEEKLY ENERGY CONSUMPTION - BAR CHART */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Typo size={16} fontWeight="600" color={colors.mirage}>Energy Consumption (kWh)</Typo>
                <Typo size={14} fontWeight="500" color={colors.textDarkGrey} style={{marginTop: 4}}>
                  {currentWeekDisplay}
                </Typo>
                <Typo size={18} fontWeight="bold" color={colors.mirage} style={{marginTop: 2}}>
                  This Week Total: {totalWeeklyKwh.toFixed(2)} kWh
                </Typo>
              </View>
              
              {showNoDataForWeeklyChart ? (
                <View style={styles.noDataContainer}>
                  <Typo style={styles.noDataText}>
                    No consumption data available for this week. Start adding your energy consumption data!
                  </Typo>
                  <TouchableOpacity 
                      style={styles.addDataButton}
                      onPress={() => router.push('/Calculate')}
                    >
                      <Typo style={styles.addDataButtonText}>Add Data</Typo>
                    </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginLeft: -20 }}>
                  <BarChart
                    data={rawWeeklyData.map(item => ({
                      ...item,
                      value: Math.max(item.value || 0, 0)
                    }))}
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
                    xAxisLabelTextStyle={{color: colors.neutral500}}
                    yAxisTextStyle={{color: colors.neutral500}}
                    yAxisLabelSuffix=" kWh"
                    yAxisLabelWidth={65}
                    showValuesAsTopLabel={false}
                    rulesType="solid"
                    rulesColor="#E2E8F0"
                    showReferenceLine1={false}
                    showReferenceLine2={false}
                    showReferenceLine3={false}
                  />
                </View>
              )}
            </View>
            
            {/* CONSUMPTION BY CATEGORY - PIE CHART */}
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
            
            {/* MONTHLY COST - BAR CHART */}
             <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Typo size={16} fontWeight="600" color={colors.mirage}>Monthly Cost Trends (Rp)</Typo>
              </View>
              {showNoDataForMonthlyChart ? (
                <View style={styles.noDataContainer}>
                  <Typo style={styles.noDataText}>No cost data available for this month.</Typo>
                </View>
              ) : (
                <View style={{ marginLeft: -15}}>
                  <BarChart
                    data={rawMonthlyData.map(item => ({ 
                      ...item, 
                      value: Math.max((item.value || 0) * 1500, 0)
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
                    xAxisLabelTextStyle={{color: colors.neutral500}}
                    yAxisTextStyle={{color: colors.neutral500}}
                    yAxisLabelPrefix="Rp "
                    yAxisLabelWidth={65}
                    showValuesAsTopLabel={false}
                    rulesType="solid"
                    rulesColor="#E2E2E2"
                    showReferenceLine1={false}
                    showReferenceLine2={false}
                    showReferenceLine3={false}
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
  refreshButton: {
    backgroundColor: colors.neutral200,
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._6,
  },
  refreshButtonText: {
    fontSize: moderateScale(12),
    color: colors.neutral700,
    fontWeight: '500',
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
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center'
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
  zeroDataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  zeroDataText: {
    color: colors.neutral500,
    fontSize: moderateScale(12),
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EnergyAnalytics;