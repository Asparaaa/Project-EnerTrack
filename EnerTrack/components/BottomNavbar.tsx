import { View, TouchableOpacity, Text, Keyboard } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { House, ChartLine, Calculator, ClockCounterClockwise } from 'phosphor-react-native';
import { colors } from '@/constants/theme';

const BottomNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  
  // 🔑 Tambahkan useEffect untuk deteksi keyboard
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // 🚫 Jangan render navbar saat keyboard muncul
  if (isKeyboardVisible) return null;

  const menuItems = [
    { label: 'Home', icon: House, path: '/(tabs)/Home' },
    {label: 'Analytics', icon: ChartLine, path: '/(tabs)/EnergyAnalytics' },
    { label: 'Calculate', icon: Calculator, path: '/(tabs)/Calculate' },
    { label: 'History', icon: ClockCounterClockwise, path: '/(tabs)/History' },
  ];
  
  

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingVertical: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 4,
        marginBottom: 0,
      }}
    >
      {menuItems.map((item, index) => {
        const isActive = pathname === item.path.replace('/(tabs)', '');
        const Icon = item.icon;
        //console.log('pathname:', pathname, 'item.path:', item.path);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (!isActive) {
                router.push(item.path as any);
              }
            }}
            style={{
              alignItems: 'center',
              padding: 10,
              borderRadius: 15,
              backgroundColor: isActive ? colors.mainBlue : 'transparent',
              marginTop: 5,
            }}
          >
            <View
              style={{
                backgroundColor: isActive ? colors.mainBlue : 'transparent',
                padding: 10,
                borderRadius: 50,
              }}
            >
              <Icon size={28} weight={isActive ? 'fill' : 'regular'} color={isActive ? '#fff' : '#1A1A1A'} />
            </View>
            <Text
              style={{
                marginTop: 4,
                color: isActive ? '#fff' : '#1A1A1A',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavbar;
