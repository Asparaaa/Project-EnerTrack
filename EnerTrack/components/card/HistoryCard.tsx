// HistoryCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { HistoryItem, CategoryType } from '@/types';
import { colors } from '@/constants/theme';

interface HistoryCardProps {
  item: HistoryItem;
  onOpenModal: (item: HistoryItem) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  onOpenModal
}) => {

  const getCategoryColor = (categoryName: string): string => {
    switch(categoryName) {
      case 'Heating':
        return '#FFF2E3';
      case 'Entertainment':
        return '#E3EAFF';
      case 'Cooling':
        return '#E3FFE8';
      case 'Health':
        return '#F5E3FF';
      case 'Lighting':
        return '#FFFDE3';
      case 'Kitchen':
        return '#FFE3E3';
      default:
        return '#E5E5E5';
    }
  };

  const getCategoryTextColor = (categoryName: string): string => {
    switch(categoryName) {
      case 'Heating':
        return colors.catOrange;
      case 'Entertainment':
        return colors.catBlue;
      case 'Cooling':
        return colors.catGreen;
      case 'Health':
        return colors.catRed;
      case 'Lighting':
        return colors.catYellow;
      case 'Kitchen':
        return colors.catPurple;
      default:
        return colors.catDefault;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.date}</Text>
        <TouchableOpacity onPress={() => onOpenModal(item)}>
          <Feather name="more-vertical" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.applianceInfo}>
          <Text style={styles.applianceName}>{item.appliance}</Text>
          <Text style={styles.applianceDetails}>{item.applianceDetails}</Text>

          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category.name) }
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: getCategoryTextColor(item.category.name) }
              ]}
            >
              {item.category.name}
            </Text>
          </View>
        </View>

        <View style={styles.usageInfo}>
          <View style={styles.usageRow}>
            <View style={styles.usageColumn}>
              <Text style={styles.usageLabel}>Power (W)</Text>
              <Text style={styles.usageValue}>{item.power}</Text>
            </View>
            <View style={styles.usageColumn}>
              <Text style={styles.usageLabel}>Usage (hrs)</Text>
              <Text style={styles.usageValue}>{item.usage}</Text>
            </View>
          </View>

          <View style={styles.usageRow}>
            <View style={styles.usageColumn}>
              <Text style={styles.usageLabel}>Daily (kWh)</Text>
              <Text style={styles.usageValue}>{item.dailyKwh.toFixed(2)}</Text>
            </View>
            <View style={styles.usageColumn}>
              <Text style={styles.usageLabel}>Monthly (kWh)</Text>
              <Text style={styles.usageValue}>{item.monthlyKwh.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.costSection}>
          <Text style={styles.costLabel}>COST</Text>
          <Text style={styles.costValue}>{item.cost}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  applianceInfo: {
    marginBottom: 16,
  },
  applianceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  applianceDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  usageInfo: {
    marginBottom: 16,
  },
  usageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  usageColumn: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 12,
    color: '#888',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default HistoryCard;