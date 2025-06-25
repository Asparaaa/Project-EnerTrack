// Calculate.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Button,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  KeyboardTypeOptions,
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { Lightning, CurrencyCircleDollar, Leaf, CaretDown, ChartBar, Robot, Trash, PencilSimple } from 'phosphor-react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { moderateScale, verticalScale, scale } from '@/utils/styling';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import Card from '@/components/card/CalculateCard';
import Dropdown from '@/components/Dropdown';
import { useAuth } from '@/contexts/authContext';
import { CategoryType, DevicePayload, HouseCapacity, SubmitResponseData, AnalysisResult, HistoryItem } from '@/types';
import Checkbox from 'expo-checkbox';

interface DropdownDataItem {
  id: number | string;
  name: string;
}

interface RegularInputProps {
  label: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
}

const RegularInput = ({ label, placeholder, keyboardType = 'default', value, onChangeText, editable = true }: RegularInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral400}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
    </View>
  );
};

interface Appliance {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  category_id: number | null;
  powerRating: number;
  dailyUsage: number;
  quantity: number;
  dailyEnergy: number;
  weeklyEnergy: number;
  monthlyEnergy: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
}

const ApplianceItem = ({ appliance, onDelete, onEdit }: { appliance: Appliance; onDelete: (id: number) => void; onEdit: (appliance: Appliance) => void }) => {
  return (
    <View style={styles.applianceItem}>
      <View style={styles.applianceInfo}>
        <Text style={styles.applianceName}>{appliance.name}</Text>
        <Text style={styles.applianceDetails}>{appliance.brand} • {appliance.category}</Text>
        <Text style={styles.applianceSpecs}>{appliance.powerRating}W • {appliance.dailyUsage}h/day • Qty: {appliance.quantity}</Text>
        <Text style={styles.applianceEnergy}>Daily: {appliance.dailyEnergy.toFixed(2)} kWh (Est. Rp {appliance.dailyCost.toLocaleString('id-ID')})</Text>
        <Text style={styles.applianceEnergy}>Weekly: {appliance.weeklyEnergy.toFixed(2)} kWh (Est. Rp {appliance.weeklyCost.toLocaleString('id-ID')})</Text>
        <Text style={styles.applianceEnergy}>Monthly: {appliance.monthlyEnergy.toFixed(2)} kWh (Est. Rp {appliance.monthlyCost.toLocaleString('id-ID')})</Text>
      </View>
      <View style={styles.applianceActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(appliance)}>
          <PencilSimple size={16} color={colors.mainBlue} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(appliance.id)}>
          <Trash size={16} color={colors.dangerRed} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface HistoryApplianceItemProps {
  item: HistoryItem;
  isSelected: boolean;
  onToggleSelect: (id: string, isSelected: boolean) => void;
}

const HistoryApplianceItem: React.FC<HistoryApplianceItemProps> = ({ item, isSelected, onToggleSelect }) => {
  return (
    <View style={styles.historyItem}>
      <Checkbox
        value={isSelected}
        onValueChange={(newValue: boolean) => onToggleSelect(item.id, newValue)}
        color={isSelected ? colors.mainBlue : undefined}
      />
      <View style={styles.historyInfo}>
        <Text style={styles.historyName}>{item.appliance}</Text>
        <Text style={styles.historyDetails}>
          {item.applianceDetails} • {item.category.name}
        </Text>
        <Text style={styles.historySpecs}>
          {item.power}W • {item.usage}h/day
        </Text>
        <Text style={styles.historyEnergy}>
          Daily: {item.dailyKwh.toFixed(2)} kWh • Monthly: {item.monthlyKwh.toFixed(2)} kWh
        </Text>
      </View>
    </View>
  );
};

const getTariffByCapacity = (capacity: string | null): number => {
  if (!capacity) return 1444.70;

  const valStr = capacity.split(" ")[0].replace(/\./g, '');
  const val = parseInt(valStr, 10);
  if (isNaN(val)) return 1444.70;

  if (val <= 900) {
    return 1352.0;
  }
  if (val <= 2200) {
    return 1444.70;
  }
  return 1699.53;
};

const Calculate: React.FC = () => {
  const { submitDevices, getBrands, getHouseCapacities, getCategories, analyzeDevices, getDeviceHistory, user, isLoading: authLoading, justLoggedOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'calculator' | 'analysis'>('calculator');
  const [applianceList, setApplianceList] = useState<Appliance[]>([]);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [houseCapacitiesOptions, setHouseCapacitiesOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryType[]>([]);

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [selectedHouseWatt, setSelectedHouseWatt] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [applianceName, setApplianceName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [powerRating, setPowerRating] = useState<string>('');
  const [dailyUsage, setDailyUsage] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');

  const [historyDevices, setHistoryDevices] = useState<HistoryItem[]>([]);
  const [selectedHistoryDeviceIds, setSelectedHistoryDeviceIds] = useState<Set<string>>(new Set());
  const [showAnalysisButton, setShowAnalysisButton] = useState<boolean>(false);

  const [billingType, setBillingType] = useState<'prepaid' | 'postpaid'>('postpaid');

  // Perbaikan 1: Pastikan data selalu array valid
  const safeHouseCapacitiesOptions = houseCapacitiesOptions.filter(option => 
    option && typeof option === 'string' && option.trim() !== ''
  );

  const safeBrandOptions = brandOptions.filter(option => 
    option && typeof option === 'string' && option.trim() !== ''
  );

  const safeCategoryOptions = categoryOptions.filter(option => 
    option && option.name && typeof option.name === 'string' && option.name.trim() !== ''
  );

  const fetchDropdownData = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoadingDropdowns(true);
    try {
      const houseCapResult = await getHouseCapacities();
      if (houseCapResult.success && houseCapResult.data && Array.isArray(houseCapResult.data)) {
        const validCapacities = houseCapResult.data.filter(item => 
          item && typeof item === 'string' && item.trim() !== ''
        );
        setHouseCapacitiesOptions(validCapacities);
        if (!selectedHouseWatt && validCapacities.length > 0) {
          setSelectedHouseWatt(validCapacities[0]);
        }
      } else {
        setHouseCapacitiesOptions([]);
        Alert.alert('Error', houseCapResult.message || 'Failed to fetch house capacities');
      }

      const brandRes = await getBrands();
      if (brandRes.success && brandRes.data && Array.isArray(brandRes.data)) {
        const validBrands = brandRes.data.filter(item => 
          item && typeof item === 'string' && item.trim() !== ''
        );
        setBrandOptions(validBrands);
      } else {
        setBrandOptions([]);
        Alert.alert('Error', brandRes.message || 'Failed to fetch brands');
      }

      const categoryRes = await getCategories();
      if (categoryRes.success && categoryRes.data && Array.isArray(categoryRes.data)) {
        const validCategories = categoryRes.data.filter(item => 
          item && item.name && typeof item.name === 'string' && item.name.trim() !== ''
        );
        setCategoryOptions(validCategories);
      } else {
        setCategoryOptions([
          { id: 1, name: 'Heating' },
          { id: 2, name: 'Kitchen' },
          { id: 3, name: 'Lighting' },
          { id: 4, name: 'Health' },
          { id: 5, name: 'Entertainment' },
          { id: 6, name: 'Cooling' },
        ]);
        Alert.alert('Error', categoryRes.message || 'Failed to fetch categories. Using default categories.');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to load dropdown data: ${error.message}`);
      console.error('Error fetching dropdown data:', error);
      
      // Set default values on error
      setHouseCapacitiesOptions([]);
      setBrandOptions([]);
      setCategoryOptions([
        { id: 1, name: 'Heating' },
        { id: 2, name: 'Kitchen' },
        { id: 3, name: 'Lighting' },
        { id: 4, name: 'Health' },
        { id: 5, name: 'Entertainment' },
        { id: 6, name: 'Cooling' },
      ]);
    } finally {
      setLoadingDropdowns(false);
    }
  }, [user, getBrands, getCategories, getHouseCapacities, selectedHouseWatt, justLoggedOut]);

  const loadDataForAnalysisTab = useCallback(async () => {
    if (activeTab === 'analysis' && user) {
      setAnalysisLoading(true);
      setAiAnalysisResult(null);

      try {
        const historyResult = await getDeviceHistory();
        if (historyResult.success && historyResult.data) {
          setHistoryDevices(historyResult.data);
          setSelectedHistoryDeviceIds(new Set(historyResult.data.map(item => item.id)));
        } else {
          setHistoryDevices([]);
          setSelectedHistoryDeviceIds(new Set());
          Alert.alert('Error', historyResult.message || 'Failed to fetch device history for analysis.');
        }
      } catch (error) {
        console.error("Error loading history for analysis tab:", error);
        Alert.alert('Error', 'An error occurred while loading device history for analysis.');
      } finally {
        setAnalysisLoading(false);
      }
    } else if (activeTab === 'calculator') {
      setAiAnalysisResult(null);
      setHistoryDevices([]);
      setSelectedHistoryDeviceIds(new Set());
    }
  }, [activeTab, user, getDeviceHistory]);

  const refreshAllData = useCallback(async () => {
    console.log("Pull-to-refresh triggered on Calculate page!");
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDropdownData(),
        loadDataForAnalysisTab() 
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDropdownData, loadDataForAnalysisTab]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const houseCapacityValue = parseFloat(selectedHouseWatt?.replace(/[^0-9]/g, '') || '2000');
  const totalDailyEnergy = applianceList.reduce((total, item) => total + item.dailyEnergy, 0);
  const totalMonthlyEnergy = applianceList.reduce((total, item) => total + item.monthlyEnergy, 0);
  const totalPowerUsage = applianceList.reduce((total, item) => total + (item.powerRating * item.quantity), 0);

  const usagePercentage = houseCapacityValue > 0 ? (totalPowerUsage / houseCapacityValue) * 100 : 0;

  const resetForm = () => {
    setApplianceName('');
    setSelectedBrand(null);
    setSelectedCategory(null);
    setPowerRating('');
    setDailyUsage('');
    setQuantity('1');
    setEditingAppliance(null);
  };

  const calculateAppliance = (powerRatingNum: number, dailyUsageNum: number, quantityNum: number) => {
    const tarifPerKwh = getTariffByCapacity(selectedHouseWatt);

    const dailyEnergyKwh = (powerRatingNum * dailyUsageNum * quantityNum) / 1000;
    const weeklyEnergyKwh = dailyEnergyKwh * 7;
    const monthlyEnergyKwh = dailyEnergyKwh * 30;

    const dailyCost = dailyEnergyKwh * tarifPerKwh;
    const weeklyCost = weeklyEnergyKwh * tarifPerKwh;
    const monthlyCost = monthlyEnergyKwh * tarifPerKwh;

    return {
      dailyEnergy: dailyEnergyKwh,
      weeklyEnergy: weeklyEnergyKwh,
      monthlyEnergy: monthlyEnergyKwh,
      dailyCost: dailyCost,
      weeklyCost: weeklyCost,
      monthlyCost: monthlyCost,
    };
  };

  const handleAddAppliance = () => {
    if (!applianceName.trim() || !selectedBrand || !selectedCategory || !powerRating || !dailyUsage) {
      Alert.alert('Error', 'Please complete all device fields.');
      return;
    }

    const powerRatingNum = parseFloat(powerRating) || 0;
    const dailyUsageNum = parseFloat(dailyUsage) || 0;
    const quantityNum = parseInt(quantity) || 1;
    if (powerRatingNum <= 0 || dailyUsageNum <= 0) {
      Alert.alert('Error', 'Power and duration must be greater than 0.');
      return;
    }

    const calculations = calculateAppliance(powerRatingNum, dailyUsageNum, quantityNum);
    const newAppliance: Appliance = {
      id: editingAppliance ? editingAppliance.id : Date.now(),
      name: applianceName.trim(),
      brand: selectedBrand,
      category: selectedCategory.name,
      category_id: selectedCategory.id ?? 0,
      powerRating: powerRatingNum,
      dailyUsage: dailyUsageNum,
      quantity: quantityNum,
      ...calculations,
    };

    console.log('DEBUG FE: Appliance to be added to list:', newAppliance);

    if (editingAppliance) {
      setApplianceList(prev => prev.map(item => item.id === editingAppliance.id ? newAppliance : item));
    } else {
      setApplianceList(prev => [...prev, newAppliance]);
    }
    resetForm();
  };

  const handleDeleteAppliance = (id: number) => {
    Alert.alert(
      'Delete Appliance',
      'Are you sure you want to delete this appliance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setApplianceList(prev => prev.filter(item => item.id !== id)) }
      ]
    );
  };

  const handleEditAppliance = (appliance: Appliance) => {
    setEditingAppliance(appliance);
    setApplianceName(appliance.name);
    setSelectedBrand(appliance.brand);
    setSelectedCategory(categoryOptions.find(c => c.id === appliance.category_id) || null);
    setPowerRating(appliance.powerRating.toString());
    setDailyUsage(appliance.dailyUsage.toString());
    setQuantity(appliance.quantity.toString());
  };

  const handleToggleHistoryDevice = useCallback((id: string, isChecked: boolean) => {
    setSelectedHistoryDeviceIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const runAIAnalysisOnSelectedDevices = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to analyze devices');
      return;
    }
    if (selectedHistoryDeviceIds.size === 0) {
      Alert.alert('Error', 'Please select at least one appliance to analyze.');
      return;
    }
    if (!selectedHouseWatt) {
      Alert.alert('Error', 'Please select house power capacity first.');
      return;
    }

    setAnalysisLoading(true);
    setAiAnalysisResult(null);

    try {
      const devicesToAnalyze: DevicePayload[] = Array.from(selectedHistoryDeviceIds)
        .map(id => historyDevices.find(item => item.id === id))
        .filter((item): item is HistoryItem => item !== undefined)
        .map(item => ({
          jenis_pembayaran: billingType,
          besar_listrik: selectedHouseWatt,
          name: item.appliance,
          brand: item.applianceDetails?.replace('Brand: ', '') || 'Unknown',
          power: item.power,
          duration: item.usage,
          category_id: item.category.id ?? 0,
        }));

      console.log('🔍 Sending selected devices to backend for AI analysis:', JSON.stringify(devicesToAnalyze, null, 2));

      const result = await analyzeDevices(devicesToAnalyze, selectedHouseWatt);

      if (result.success) {
        const responseData = result.data as AnalysisResult;
        setAiAnalysisResult(responseData?.ai_response || 'No AI response available.');
        Alert.alert('Success', 'AI Analysis completed!');
        console.log('✅ AI Analysis success:', result);
      } else {
        console.error('❌ AI Analysis failed:', result.message);
        Alert.alert('Error', result.message || 'Failed to get AI analysis.');
        setAiAnalysisResult('Failed to get AI analysis.');
      }
    } catch (error) {
      console.error('❌ AI Analysis exception:', error);
      Alert.alert('Error', 'An unexpected error occurred during AI analysis.');
      setAiAnalysisResult('An error occurred during AI analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  }, [user, selectedHistoryDeviceIds, historyDevices, selectedHouseWatt, analyzeDevices]);

  const getCapacityWarning = () => {
    const warning = { message: '', color: '' };
    if (usagePercentage > 90) {
      warning.message = '⚠️ Critical: Power usage exceeds safe capacity!';
      warning.color = colors.dangerRed;
    } else if (usagePercentage > 70) {
      warning.message = '⚠️ High power usage detected';
      warning.color = colors.energyOrange;
    } else if (usagePercentage > 50) {
      warning.message = '⚡ Moderate power usage';
      warning.color = colors.energyOrange;
    } else {
      warning.message = '✅ Low power usage, great!';
      warning.color = colors.energyGreen;
    }
    return warning;
  };

  const handleSubmitCurrentAppliances = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to submit devices');
      return;
    }
    if (applianceList.length === 0) {
      Alert.alert('Error', 'No appliances to submit');
      return;
    }
    if (!selectedHouseWatt) {
      Alert.alert('Error', 'Please select house power capacity first');
      return;
    }

    const invalidAppliances = applianceList.filter(
      appliance => !appliance.name || !appliance.brand || appliance.powerRating <= 0 || appliance.dailyUsage <= 0 || appliance.category_id === null
    );
    if (invalidAppliances.length > 0) {
      console.error('❌ Invalid appliances:', invalidAppliances);
      Alert.alert('Error', 'Some appliances have invalid data (name, brand, power, daily usage, or category missing/invalid). Please check your appliance list.');
      return;
    }

    setSubmitting(true);
    try {
      const devices: DevicePayload[] = applianceList.map(appliance => ({
        jenis_pembayaran: billingType,
        besar_listrik: selectedHouseWatt,
        name: appliance.name,
        brand: appliance.brand && appliance.brand.trim() !== '' ? appliance.brand : 'Unknown',
        power: appliance.powerRating,
        duration: appliance.dailyUsage,
        category_id: appliance.category_id ?? 0,
      }));

      console.log('🔍 Sending devices data to backend (submit):', JSON.stringify({ billingtype: billingType, electricity: { kwh: totalMonthlyEnergy }, devices: devices }, null, 2));

      const result = await submitDevices(
        billingType,
        { kwh: totalMonthlyEnergy },
        devices
      );

      setSubmitting(false);
      if (result.success) {
        Alert.alert('Success', 'Devices submitted successfully!');
        console.log('✅ Submit success:', result);
        setShowAnalysisButton(true);
      } else {
        console.error('❌ Submit error:', result);
        Alert.alert('Error', result.message || 'Failed to submit devices');
        setShowAnalysisButton(false);
      }
    } catch (error) {
      setSubmitting(false);
      console.error('❌ Submit exception:', error);
      Alert.alert('Error', 'An unexpected error occurred during submission');
      setShowAnalysisButton(false);
    }
  }, [user, applianceList, selectedHouseWatt, totalMonthlyEnergy, submitDevices, billingType]);

  if (authLoading || loadingDropdowns) {
    return (
      <ScreenWrapper style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.mainBlue} />
          <Typo color={colors.neutral600} size={16} style={{ marginTop: spacingY._10 }}>
            Loading...
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.wrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshAllData}
              colors={[colors.mainBlue]}
              tintColor={colors.mainBlue}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Energy Calculator</Text>
            <Text style={styles.subtitle}>Calculate your device energy consumption</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'calculator' && styles.activeTab]}
              onPress={() => setActiveTab('calculator')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'calculator' ? styles.activeTabText : null
                ]}
              >
                Energy Calculator
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
              onPress={() => setActiveTab('analysis')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'analysis' ? styles.activeTabText : null
                ]}
              >
                AI Analysis
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'calculator' ? (
            <View style={styles.calculatorContainer}>
              <Card style={{ marginBottom: spacingY._20 }}>
                <Text style={styles.cardTitle}>House Power Capacity</Text>
                <Dropdown
                  label="Power Capacity"
                  placeholder="Select house power capacity"
                  data={safeHouseCapacitiesOptions.map(name => ({ 
                    id: name, 
                    name 
                  }))}
                  selectedValue={selectedHouseWatt || null}
                  onSelect={(value) => setSelectedHouseWatt(value)}
                  disabled={loadingDropdowns}
                  searchable={true}
                />
                <Dropdown
                  label="Billing Type"
                  placeholder="Select billing type"
                  data={[
                    { id: 'prepaid', name: 'Prepaid' },
                    { id: 'postpaid', name: 'Postpaid' }
                  ]}
                  selectedValue={billingType}
                  onSelect={(_name, id) => setBillingType(id as 'prepaid' | 'postpaid')}
                  disabled={loadingDropdowns}
                />
              </Card>

              <Card style={{ marginBottom: spacingY._20 }}>
                <Text style={styles.cardTitle}>
                  {editingAppliance ? 'Edit Device' : 'Add Device'}
                </Text>
                <Dropdown
                  label="Brand"
                  placeholder={loadingDropdowns ? 'Loading brands...' : 'Select brand'}
                  data={safeBrandOptions.map(name => ({ 
                    id: name, 
                    name 
                  }))}
                  selectedValue={selectedBrand || null}
                  onSelect={(name) => setSelectedBrand(name)}
                  disabled={loadingDropdowns}
                  searchable={true}
                />
                <RegularInput
                  label="Device Name"
                  placeholder="Example: Smart TV"
                  value={applianceName}
                  onChangeText={setApplianceName}
                  editable={!loadingDropdowns}
                />
                <RegularInput
                  label="Power (Watt)"
                  placeholder="Example: 120"
                  keyboardType="numeric"
                  value={powerRating}
                  onChangeText={setPowerRating}
                  editable={!loadingDropdowns}
                />
                <RegularInput
                  label="Daily Usage (Hour(s))"
                  placeholder="Example: 5"
                  keyboardType="numeric"
                  value={dailyUsage}
                  onChangeText={setDailyUsage}
                  editable={!loadingDropdowns}
                />
                <RegularInput
                  label="Quantity"
                  placeholder="1"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  editable={!loadingDropdowns}
                />
                <Dropdown
                  label="Category"
                  placeholder={loadingDropdowns ? 'Loading categories...' : 'Select category'}
                  data={safeCategoryOptions}
                  selectedValue={selectedCategory?.name || null}
                  onSelect={(_name, id) => {
                    const selectedCat = safeCategoryOptions.find(cat => cat.id === id);
                    setSelectedCategory(selectedCat || null);
                  }}
                  disabled={loadingDropdowns}
                  searchable={true}
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddAppliance}
                  >
                    <Text style={styles.addButtonText}>
                      {editingAppliance ? 'Update Device' : 'Add to List'}
                    </Text>
                  </TouchableOpacity>
                  {editingAppliance && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={resetForm}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>

              {applianceList.length > 0 && (
                <Card style={{ marginBottom: spacingY._20 }}>
                  <Text style={styles.cardTitle}>
                    Your Devices ({applianceList.length})
                  </Text>
                  {applianceList.map(appliance => (
                    <ApplianceItem
                      key={appliance.id}
                      appliance={appliance}
                      onDelete={handleDeleteAppliance}
                      onEdit={handleEditAppliance}
                    />
                  ))}
                </Card>
              )}

              {applianceList.length > 0 && (
                <Card>
                  <Text style={styles.cardTitle}>
                    Total Energy Consumption
                  </Text>
                  {houseCapacityValue > 0 && (
                    <View style={[styles.warningContainer, {
                      backgroundColor: getCapacityWarning().color + '20'
                    }]}>
                      <Typo
                        style={styles.warningText}
                        color={getCapacityWarning().color}
                        fontWeight='600'
                        size={14}
                      >
                        {getCapacityWarning().message}
                      </Typo>
                      <Typo
                        style={styles.capacity}
                        color={colors.neutral600}
                        size={12}
                      >
                        Using {totalPowerUsage}W of {houseCapacityValue}W capacity ({usagePercentage.toFixed(1)}%)
                      </Typo>
                    </View>
                  )}
                  <Card.Stat
                    label="Total Daily Energy"
                    value={`${totalDailyEnergy.toFixed(2)} kWh`}
                    subLabel={`From ${applianceList.length} devices`}
                    icon={<Lightning size={moderateScale(22)} color={colors.mainBlue} />}
                  />
                  <Card.Stat
                    label="Total Monthly Energy"
                    value={`${totalMonthlyEnergy.toFixed(2)} kWh`}
                    subLabel="Based on daily usage"
                    icon={<Lightning size={moderateScale(22)} color={colors.energyOrange} />}
                  />
                  <TouchableOpacity
                    style={styles.submitToDbButton}
                    onPress={handleSubmitCurrentAppliances}
                    disabled={submitting || applianceList.length === 0 || !selectedHouseWatt}
                  >
                    <Text style={styles.submitToDbButtonText}>
                      {submitting ? 'Saving...' : 'Save Devices'}
                    </Text>
                  </TouchableOpacity>
                  {showAnalysisButton && (
                    <TouchableOpacity
                      style={styles.aiAnalysisButton}
                      onPress={() => setActiveTab('analysis')}
                    >
                      <Robot size={moderateScale(20)} color={colors.white} />
                      <Typo
                        color={colors.white}
                        size={16}
                        fontWeight='600'
                        style={{ marginLeft: spacingX._8 }}
                      >
                        Go to AI Analysis
                      </Typo>
                    </TouchableOpacity>
                  )}
                </Card>
              )}
            </View>
          ) : (
            <View style={styles.analysisContainer}>
              <Card>
                <View style={styles.aiHeader}>
                  <ChartBar size={moderateScale(24)} color={colors.mainBlue} />
                  <Text style={styles.aiTitle}>
                    AI Analysis
                  </Text>
                </View>
                <Text style={styles.sectionTitle}>Select Devices for Analysis:</Text>
                {analysisLoading ? (
                  <Text style={styles.loadingText}>Loading history...</Text>
                ) : historyDevices.length === 0 ? (
                  <Text style={styles.emptyHistoryText}>No devices in your history. Add some from the 'Energy Calculator' tab!</Text>
                ) : (
                  <ScrollView style={styles.historyList}>
                    {historyDevices.map(item => (
                      <HistoryApplianceItem
                        key={item.id}
                        item={item}
                        isSelected={selectedHistoryDeviceIds.has(item.id)}
                        onToggleSelect={handleToggleHistoryDevice}
                      />
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity
                  style={[styles.aiAnalysisButton, { marginTop: spacingY._20 }]}
                  onPress={runAIAnalysisOnSelectedDevices}
                  disabled={analysisLoading || selectedHistoryDeviceIds.size === 0 || !selectedHouseWatt}
                >
                  <Robot size={moderateScale(20)} color={colors.white} />
                  <Typo
                    color={colors.white}
                    size={16}
                    fontWeight='600'
                    style={{ marginLeft: spacingX._8 }}
                  >
                    {analysisLoading ? 'Analyzing...' : 'Run AI Analysis'}
                  </Typo>
                </TouchableOpacity>
                <View style={styles.aiContentContainer}>
                  <View style={styles.aiIconContainer}>
                    <Robot size={moderateScale(48)} color={colors.mainBlue} />
                  </View>
                  {analysisLoading ? (
                    <Typo
                      style={styles.aiDescription}
                      color={colors.neutral600}
                      size={16}
                    >
                      Analyzing selected devices...
                    </Typo>
                  ) : aiAnalysisResult ? (
                    <Typo
                      style={styles.aiDescription}
                      color={colors.neutral600}
                      size={16}
                    >
                      {aiAnalysisResult}
                    </Typo>
                  ) : (
                    <Typo
                      style={styles.aiDescription}
                      color={colors.neutral600}
                      size={16}
                    >
                      Select devices from your history above and click 'Run AI Analysis' to get insights and recommendations.
                    </Typo>
                  )}
                </View>
              </Card>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.mainWhite,
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
  },
  title: {
    color: colors.mirage,
    fontSize: moderateScale(22),
    fontWeight: '700'
  },
  subtitle: {
    marginTop: spacingY._4,
    fontSize: moderateScale(14),
    color: colors.neutral500
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    paddingHorizontal: spacingX._20,
  },
  tab: {
    paddingVertical: spacingY._12,
    marginRight: spacingX._20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.mainBlue,
  },
  tabText: {
    fontSize: moderateScale(16),
    color: colors.neutral700,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.mainBlue,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacingY._30,
  },
  calculatorContainer: {
    padding: spacingX._20,
  },
  analysisContainer: {
    padding: spacingX._20,
  },
  cardTitle: {
    marginBottom: spacingY._15,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.neutral800
  },
  inputContainer: {
    marginBottom: spacingY._15,
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.mirage,
    marginBottom: spacingY._5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius._10,
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: colors.mirage,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacingY._10,
    justifyContent: 'center',
    width: '100%',
  },
  addButton: {
    backgroundColor: colors.mainBlue,
    borderRadius: radius._10,
    padding: moderateScale(14),
    alignItems: 'center',
    marginHorizontal: spacingX._5,
    minWidth: moderateScale(150),
  },
  addButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.neutral200,
    borderRadius: radius._10,
    padding: moderateScale(14),
    alignItems: 'center',
    marginHorizontal: spacingX._5,
    minWidth: moderateScale(100),
  },
  cancelButtonText: {
    color: colors.mirage,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  applianceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
    backgroundColor: colors.neutral50,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
  },
  applianceInfo: {
    flex: 3,
  },
  applianceName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.mirage,
    marginBottom: spacingY._2,
  },
  applianceDetails: {
    fontSize: moderateScale(12),
    color: colors.neutral600,
    marginBottom: spacingY._2,
  },
  applianceSpecs: {
    fontSize: moderateScale(12),
    color: colors.neutral500,
    marginBottom: spacingY._2,
  },
  applianceEnergy: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.mainBlue,
    marginTop: 3,
  },
  applianceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacingY._8,
    marginLeft: spacingX._5,
  },
  warningContainer: {
    padding: spacingY._12,
    borderRadius: radius._10,
    marginBottom: spacingY._15,
  },
  warningText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: spacingY._4,
  },
  capacityText: {
    fontSize: moderateScale(12),
    color: colors.neutral600,
  },
  submitToDbButton: {
    backgroundColor: colors.energyGreen,
    borderRadius: radius._10,
    padding: moderateScale(14),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._15,
  },
  submitToDbButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  aiAnalysisButton: {
    backgroundColor: colors.mainBlue,
    borderRadius: radius._10,
    padding: moderateScale(14),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._10,
  },
  aiAnalysisButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: spacingX._8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  aiTitle: {
    marginLeft: spacingX._10,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.neutral800
  },
  aiContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._30,
  },
  aiIconContainer: {
    backgroundColor: colors.neutral50,
    padding: moderateScale(20),
    borderRadius: 100,
    marginBottom: spacingY._20,
  },
  aiDescription: {
    textAlign: 'center',
    color: colors.neutral600,
    lineHeight: 24,
    fontSize: moderateScale(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: colors.neutral600,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.neutral800,
    marginBottom: spacingY._10,
    marginTop: spacingY._15,
  },
  historyList: {
    maxHeight: verticalScale(250),
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius._10,
    padding: spacingX._10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  historyInfo: {
    marginLeft: spacingX._10,
    flex: 1,
  },
  historyName: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: colors.mirage,
  },
  historyDetails: {
    fontSize: moderateScale(11),
    color: colors.neutral600,
  },
  historySpecs: {
    fontSize: moderateScale(11),
    color: colors.neutral500,
  },
  historyEnergy: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: colors.mainBlue,
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: colors.neutral600,
    fontSize: moderateScale(14),
    marginTop: spacingY._10,
    marginBottom: spacingY._20,
  },
  capacity: {
    fontSize: moderateScale(12),
    color: colors.neutral600,
  }
});

export default Calculate;