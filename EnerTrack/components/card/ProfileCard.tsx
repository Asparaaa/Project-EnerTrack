import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Envelope } from 'phosphor-react-native';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import Typo from '@/components/Typo';

// Interface untuk data yang diterima dari Profile.tsx
interface ProfileDisplayData {
  username: string | null;
  email: string | null;
  image?: string | null;
}

interface ProfileCardProps {
  userData: ProfileDisplayData;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ userData }) => {
  const initials = userData.username ? userData.username.charAt(0).toUpperCase() : 'A';
  
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileImageContainer}>
        {userData.image ? (
          <Image source={{ uri: userData.image }} style={styles.profilePicture} />
        ) : (
          <View style={styles.profileInitials}>
            <Typo size={36} fontWeight="bold" color={colors.mainBlue}>
              {initials}
            </Typo>
          </View>
        )}
      </View>
      
      <Typo size={22} fontWeight="bold" color={colors.neutral800} style={styles.nameText}>
        {userData.username || 'Anonymous User'}
      </Typo>
      
      {/* Wrapper for info container to control horizontal padding */}
      <View style={styles.infoSectionWrapper}>
        <View style={styles.infoContainer}>
          <View style={[styles.infoIconContainer, styles.emailIconContainer]}>
            <Envelope size={20} color={colors.mainBlue} weight="fill" />
          </View>
          <View>
            <Typo size={14} color={colors.neutral500}>Email</Typo>
            <Typo size={16} fontWeight="500" color={colors.neutral800}>
              {userData.email}
            </Typo>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    profileCard: {
        backgroundColor: colors.white,
        borderRadius: radius._10,
        paddingVertical: spacingY._20,
        alignItems: 'center',
        width: '100%',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: spacingY._16,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.neutral100,
    },
    profileInitials: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.neutral75,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        marginTop: spacingY._6,
        marginBottom: spacingY._20,
        textAlign: 'center',
    },
    infoSectionWrapper: {
      width: '100%',
      paddingHorizontal: spacingX._20, // Apply internal horizontal padding here
    },
    infoContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacingX._12,
    },
    emailIconContainer: {
        backgroundColor: `${colors.mainBlue}1A`,
    },
});