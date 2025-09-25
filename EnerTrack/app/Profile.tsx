// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, TextInput, RefreshControl } from 'react-native';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { ProfileCard } from '@/components/card/ProfileCard';
import { useAuth } from '@/contexts/authContext'; // Hook untuk mengakses data user, fungsi logout, dll.
import { useRouter } from 'expo-router';

// --- DEFINISI TIPE DATA (INTERFACE) ---
// Mendefinisikan struktur data profil yang akan ditampilkan dan di-edit.
export interface ProfileDisplayData {
  username: string;
  email: string;
}

// --- KOMPONEN UTAMA HALAMAN PROFIL ---
const Profile: React.FC = () => {
  const router = useRouter();
  const { user, logout: contextLogout, updateUserData } = useAuth();

  // --- STATE MANAGEMENT ---
  // State untuk data yang ditampilkan di UI (tidak berubah saat diedit)
  const [displayData, setDisplayData] = useState<ProfileDisplayData>({
    username: '',
    email: '',
  });

  // State untuk data yang sedang di-edit di dalam form. Dipisahkan agar UI tidak langsung berubah saat user mengetik.
  const [editableData, setEditableData] = useState<ProfileDisplayData>({ ...displayData });
  // State untuk beralih antara tampilan profil utama dan tampilan pengaturan akun
  const [showAccountSettings, setShowAccountSettings] = useState<boolean>(false);
  // State untuk beralih antara mode lihat dan mode edit di halaman pengaturan akun
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // State untuk fitur pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // --- SIDE EFFECT HOOKS ---
  // useEffect ini akan berjalan setiap kali objek `user` dari context berubah.
  // Tujuannya adalah untuk menyinkronkan state lokal komponen dengan data user terbaru.
  useEffect(() => {
    if (user) {
      const currentUserData = {
        username: user.username || 'No Username',
        email: user.email || 'No Email',
      };
      setDisplayData(currentUserData); // Update data yang ditampilkan
      setEditableData(currentUserData); // Update data untuk form edit
    }
  }, [user]);

  // --- EVENT HANDLERS ---

  /**
   * Fungsi untuk menangani aksi pull-to-refresh.
   * Mensimulasikan pengambilan data baru dan memperbarui state.
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi jeda jaringan
      if (user) {
        // Logika yang sama seperti di useEffect untuk re-sync data
        const currentUserData = {
          username: user.username || 'No Username',
          email: user.email || 'No Email',
        };
        setDisplayData(currentUserData);
        setEditableData(currentUserData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to refresh profile data.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  /**
   * Fungsi untuk menangani proses logout.
   */
  const handleLogout = async () => {
    const res = await contextLogout();
    if (res && res.success) {
      Alert.alert('Success', 'Logout successful!');
      // Navigasi ke halaman login akan ditangani oleh AuthProvider/Router
    }
  };

  /**
   * Fungsi untuk beralih antara halaman profil dan halaman pengaturan akun.
   */
  const toggleAccountSettings = () => {
    setShowAccountSettings(prev => !prev);
    setIsEditing(false); // Selalu reset ke mode non-edit saat beralih halaman
  };

  /**
   * Fungsi untuk menangani perubahan teks pada input form.
   * @param field Nama field yang berubah ('username' atau 'email').
   * @param value Nilai baru dari input.
   */
  const handleInputChange = (field: keyof ProfileDisplayData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Mengaktifkan mode edit di halaman pengaturan akun.
   */
  const handleEdit = () => { setIsEditing(true); };

  /**
   * Membatalkan perubahan dan keluar dari mode edit.
   */
  const handleCancel = () => {
    setEditableData({ ...displayData }); // Kembalikan data form ke data terakhir yang disimpan
    setIsEditing(false);
  };

  /**
   * Menyimpan perubahan data profil ke backend.
   */
  const handleSave = async () => {
    // Panggil fungsi update dari context
    const result = await updateUserData({
        username: editableData.username,
        email: editableData.email,
    });
    
    if (result.success) {
        setDisplayData(editableData); // Update data yang ditampilkan dengan data baru
        setIsEditing(false); // Keluar dari mode edit
        Alert.alert("Success", "Profile updated successfully!");
    } else {
        Alert.alert("Failed", result.message || "Failed to update profile.");
    }
  };


  // --- TAMPILAN KONDISIONAL ---
  // Tampilan akan berubah tergantung pada nilai state `showAccountSettings`.

  // --- Tampilan 1: Pengaturan Akun ---
  // Tampilan ini muncul jika `showAccountSettings` adalah `true`.
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.mainBlue]} tintColor={colors.mainBlue} />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.settingsCard}>
              <Typo size={20} fontWeight="bold" color={colors.neutral800} style={styles.cardTitle}> Account Settings </Typo>
              
              {/* Form untuk Username */}
              <View style={styles.formGroup}>
                <Typo size={16} color={colors.neutral700} style={styles.formLabel}>Username</Typo>
                <TextInput
                  style={styles.formInput}
                  value={editableData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  editable={isEditing} // Input bisa diedit atau tidak tergantung state `isEditing`
                />
              </View>
              {/* Form untuk Email */}
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
              
              {/* Tombol Aksi Form */}
              <View style={styles.formActions}>
                {/* Tampilkan tombol 'Save' dan 'Cancel' jika dalam mode edit */}
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
                  // Tampilkan tombol 'Edit Profile' jika tidak dalam mode edit
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

  // --- Tampilan 2: Profil Default ---
  // Tampilan ini muncul jika `showAccountSettings` adalah `false`.
  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.mainBlue]} tintColor={colors.mainBlue} />
        }
      >
        {/* Header Halaman Profil */}
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
        
        {/* Kartu Profil */}
        <View style={styles.contentContainer}>
          <ProfileCard userData={displayData} />
        </View>

        {/* Tombol Aksi Utama */}
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

// --- STYLING KOMPONEN ---
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
