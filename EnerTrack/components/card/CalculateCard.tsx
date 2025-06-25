import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, radius, spacingY } from '@/constants/theme';
import Typo from '@/components/Typo';
import { moderateScale } from '@/utils/styling';

interface CardProps {
  children: React.ReactNode;
  style?: object;
}

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.JSX.Element;
}

// Main Card component
const CalculateCard = ({ children, style }: CardProps) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

// Stat Card component as a nested component of Card
const StatCard = ({ label, value, subLabel, icon }: StatCardProps) => {
  return (
    <View style={styles.statContainer}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Typo size={14} color={colors.neutral600} style={styles.label}>
          {label}
        </Typo>
        <Typo size={18} fontWeight="600" style={styles.value}>
          {value}
        </Typo>
        {subLabel && (
          <Typo size={12} color={colors.neutral500} style={styles.subLabel}>
            {subLabel}
          </Typo>
        )}
      </View>
    </View>
  );
};

// Add nested components to Card
CalculateCard.Stat = StatCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._12,
    paddingVertical: spacingY._8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.neutral50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
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

export default CalculateCard;