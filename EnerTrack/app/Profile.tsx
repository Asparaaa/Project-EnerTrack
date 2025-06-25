import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, TextInput, RefreshControl } from 'react-native';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { ProfileCard } from '@/components/card/ProfileCard';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';

export interface ProfileDisplayData {
  username: string;
  email: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const { user, logout: contextLogout, updateUserData } = useAuth();

  const [displayData, setDisplayData] = useState<ProfileDisplayData>({
    username: '',
    email: '',
  });

  const [editableData, setEditableData] = useState<ProfileDisplayData>({ ...displayData });
  const [showAccountSettings, setShowAccountSettings] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      const currentUserData = {
        username: user.username || 'No Username',
        email: user.email || 'No Email',
      };
      setDisplayData(currentUserData);
      setEditableData(currentUserData);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    console.log("Pull-to-refresh triggered on Profile page!");
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      if (user) { 
        const currentUserData = {
          username: user.username || 'No Username',
          email: user.email || 'No Email',
        };
        setDisplayData(currentUserData);
        setEditableData(currentUserData);
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      Alert.alert("Error", "Failed to refresh profile data.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const handleLogout = async () => {
    const res = await contextLogout();
    if (res && res.success) {
      Alert.alert('Success', 'Logout successful!');
    }
  };

  const toggleAccountSettings = () => {
    setShowAccountSettings(prev => !prev);
    setIsEditing(false); 
  };

  const handleInputChange = (field: keyof ProfileDisplayData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => { setIsEditing(true); };

  const handleCancel = () => {
    setEditableData({ ...displayData }); 
    setIsEditing(false);
  };

  const handleSave = async () => {
    const result = await updateUserData({
        username: editableData.username,
        email: editableData.email,
    });
    
    if (result.success) {
        setDisplayData(editableData); 
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
    } else {
        Alert.alert("Failed", result.message || "Failed to update profile.");
    }
  };

  //  Account Settings
  if (showAccountSettings) {
    return (
      <ScreenWrapper>
        <View style={styles.fullScreenHeader}>
          <TouchableOpacity onPress={toggleAccountSettings} style={styles.fullScreenBackToProfileText}> 
            <Typo size={16} fontWeight="500" color={colors.mainBlue}>← Back to Profile</Typo>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.scrollViewContent} 
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.mainBlue]}
              tintColor={colors.mainBlue}
            />
          }
        >
          <View style={styles.contentContainer}> 
            <View style={styles.settingsCard}>
              <Typo size={20} fontWeight="bold" color={colors.neutral800} style={styles.cardTitle}> Account Settings </Typo>
              
              <View style={styles.formGroup}>
                <Typo size={16} color={colors.neutral700} style={styles.formLabel}>Username</Typo>
                <TextInput
                  style={styles.formInput}
                  value={editableData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  editable={isEditing}
                />
              </View>
              <View style={styles.formGroup}>
                <Typo size={16} color={colors.neutral700} style={styles.formLabel}>Email</Typo>
                <TextInput
                  style={styles.formInput}
                  value={editableData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  editable={isEditing}
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.formActions}>
                {isEditing ? (
                  <View style={{ flexDirection: 'row', gap: spacingX._12 }}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                      <Typo size={16} fontWeight="500" color={colors.neutral700}>Cancel</Typo>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Typo size={16} fontWeight="500" color={colors.white}>Save Changes</Typo>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Typo size={16} fontWeight="500" color={colors.white}>Edit Profile</Typo>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Default Profile Page
  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Home')} style={[styles.backButton, { marginBottom: spacingY._16 }]}>
            <Typo size={16} fontWeight="500" color={colors.mainBlue}>← Back to Dashboard</Typo>
          </TouchableOpacity>
          <View>
            <Typo size={24} fontWeight="bold" color={colors.neutral800}>Profile</Typo>
            <Typo size={16} color={colors.neutral500} style={styles.profileSubtitle}>
              Manage your account information
            </Typo>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <ProfileCard userData={displayData} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.settingsButton} onPress={toggleAccountSettings}>
            <Typo size={16} fontWeight="500" color={colors.white}>Account Settings</Typo>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Typo size={16} fontWeight="500" color={colors.white}>Log Out</Typo>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  scrollViewContent: {
    paddingTop: spacingY._10,
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._24,
    backgroundColor: colors.neutral50,
    marginTop: spacingY._20, 
  },
  contentContainer: {
    paddingHorizontal: spacingX._20, 
    paddingVertical: 0,
  },
  buttonContainer: {
    paddingHorizontal: spacingX._20, 
    paddingBottom: spacingY._24,
    marginTop: spacingY._20,
  },
  settingsButton: {
    backgroundColor: colors.mainBlue,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  logoutButton: {
    backgroundColor: colors.dangerRed,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    width: '100%',
    alignItems: 'center',
  },
  fullScreenHeader: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._60,
    paddingBottom: spacingY._24,
    backgroundColor: colors.neutral50,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    padding: spacingX._20,
    marginBottom: spacingY._20,
  },
  cardTitle: {
    marginBottom: spacingY._24,
  },
  formGroup: {
    marginBottom: spacingY._20,
  },
  formLabel: {
    marginBottom: spacingY._8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._8,
    padding: spacingX._12,
    fontSize: 16,
    color: colors.neutral800,
    backgroundColor: colors.mainWhite,
  },
  readOnlyInput: {
    backgroundColor: colors.neutral100,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacingY._24,
    gap: spacingX._12,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: colors.neutral200,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._8,
    alignItems: 'center',
    minWidth: 120,
  },
  saveButton: {
    backgroundColor: colors.mainBlue,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._8,
    alignItems: 'center',
    minWidth: 140,
  },
  editButton: {
    backgroundColor: colors.mainBlue,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    alignItems: 'center',
    width: '100%',
    minWidth: 100,
  },
  backButton: {
    marginBottom: spacingY._10,
    alignSelf: 'flex-start',
  },
  profileSubtitle: {
    marginTop: spacingY._4,
  },
  fullScreenBackToProfileText: {
    marginBottom: spacingY._16,
  },
});

export default Profile;