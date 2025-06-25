import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { moderateScale } from '@/utils/styling';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import Typo from '@/components/Typo';

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode; // Accept a React node for Phosphor icons
  bgColor?: string;
  valueColor?: string;
  subLabelColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subLabel,
  icon,
  bgColor = colors.white,
  valueColor = colors.mirage,
  subLabelColor = colors.mainBlue,
}: StatCardProps) => {
  
  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.iconWrapper}>
        {/* Make sure the icon is a proper React component */}
        {icon}
      </View>
      <View style={styles.contentWrapper}>
        <Typo size={14} color={colors.neutral500} style={styles.label}>
          {label}
        </Typo>
        <Typo size={20} fontWeight="700" color={valueColor} style={styles.value}>
          {value}
        </Typo>
        {subLabel && (
          <Typo size={12} color={subLabelColor} style={styles.subLabel}>
            {subLabel}
          </Typo>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: radius._12,
    marginBottom: spacingY._12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._12,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
  },
  label: {
    marginBottom: spacingY._4,
  },
  value: {
    marginBottom: spacingY._4,
  },
  subLabel: {
    // Styles for subLabel text
  },
});

export default StatCard;