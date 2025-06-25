import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View, RefreshControl, ScrollView } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { moderateScale } from '@/utils/styling';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/authContext';
import { AuthContextType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth() as AuthContextType;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Reset form
    setEmail('');
    setPassword('');
    setRefreshing(false);
  }, []);

  const handleSubmit = async () => {
    // Validasi input
    if (!email || !password) {
      Alert.alert("Error", "Please fill all the fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password, rememberMe);
      
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert("Login Failed", res.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.push('/Welcome')}
      >
        <Ionicons name="arrow-back" size={24} color={colors.neutral800} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.mainBlue]}
            tintColor={colors.mainBlue}
          />
        }
      >
        <View style={styles.container}>
          {/* Judul */}
          <Typo size={28} fontWeight="700" style={styles.title}>
            Welcome Back
          </Typo>
          <Typo size={16} color={colors.textDarkGrey} style={styles.subtitle}>
            Login to continue
          </Typo>

          {/* Form */}
          <View style={styles.formGroup}>
            <Typo size={16} fontWeight="500" style={styles.label}>
              Email
            </Typo>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"  placeholderTextColor={colors.textDarkGrey}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Typo size={16} fontWeight="500" style={styles.label}>
              Password
            </Typo>
            <TextInput
              style={styles.input}
              placeholder="Enter your password" placeholderTextColor={colors.textDarkGrey}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* Remember Me Checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Checkbox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? colors.mainBlue : undefined}
                style={{ marginRight: 8 }}
              />
              <Typo size={14} color={colors.neutral700}>Remember Me</Typo>
            </View>
          </View>

          {/* Tombol Login */}
          <TouchableOpacity 
            style={[styles.btnLogin, isLoading && styles.btnDisabled]} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Typo size={16} color={colors.white} fontWeight="600">
              {isLoading ? "Logging In..." : "Login"}
            </Typo>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Typo size={14} color={colors.textDarkGrey}>
              Don't have an account?
            </Typo>
            <TouchableOpacity onPress={() => router.push('/Register')}>
              <Typo size={14} fontWeight="600" color={colors.mainBlue}>
                {' '}Sign Up
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacingY._60,
    left: spacingX._10,
    zIndex: 1,
    padding: spacingX._10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._40,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacingY._10,
    color: colors.neutral800,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacingY._30,
  },
  formGroup: {
    marginBottom: spacingY._20,
    width: '80%',
  },
  label: {
    marginBottom: spacingY._8,
    color: colors.neutral700,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius._8,
    paddingVertical: moderateScale(14),
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._15,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.neutral800,
    height: moderateScale(50),
  },
  btnLogin: {
    backgroundColor: colors.mainBlue,
    paddingVertical: moderateScale(14),
    borderRadius: radius._8,
    alignItems: 'center',
    marginTop: spacingY._10,
    height: moderateScale(50),
    justifyContent: 'center',
    width: '80%',
  },
  btnDisabled: {
    backgroundColor: colors.neutral400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._20,
  },
});
