import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Tabs, router } from 'expo-router';
import { House, ChartLine, Calculator, ClockCounterClockwise } from 'phosphor-react-native';
import { useAuth } from '@/contexts/authContext';
import { colors } from '@/constants/theme';
import Typo from '@/components/Typo';
import { verticalScale } from '@/utils/styling';

const ProfileHeaderIcon = () => {
  const { user } = useAuth();
  const initials = user?.username ? user.username.charAt(0).toUpperCase() : '?';
  
  return (
    <TouchableOpacity onPress={() => router.push('/Profile')} style={styles.headerIconContainer}>
      {user?.image ? (
        <Image source={{ uri: user.image }} style={styles.profileImage} />
      ) : (
        <View style={styles.initialsContainer}>
          <Text>
            <Typo color={colors.white} fontWeight="bold" size={16}>
              {initials}
            </Typo>
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.mainBlue,
        tabBarInactiveTintColor: colors.neutral500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral100,
          height: 100,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: true,
        headerStyle: {
          height: verticalScale(100),
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 2,
          borderBottomColor: colors.neutral100,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 24,
        },
        headerRight: () => <ProfileHeaderIcon />,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <View>
              <House size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="EnergyAnalytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <View>
              <ChartLine size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Calculate"
        options={{
          title: 'Calculate',
          tabBarIcon: ({ color }) => (
            <View>
              <Calculator size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <View>
              <ClockCounterClockwise size={28} color={color} weight="fill" />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="Profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerIconContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mainBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
});