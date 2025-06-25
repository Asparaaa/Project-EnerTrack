import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, FlatList as RNFlatList, ViewToken } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { moderateScale } from '@/utils/styling';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: require('@/assets/images/CalculateIcon.png'),
    title: 'Calculate',
    description: 'Easily calculate your device energy usage and cost.',
  },
  {
    icon: require('@/assets/images/HistoryIcon.png'),
    title: 'History',
    description: 'View your past energy usage and device history.',
  },
  {
    icon: require('@/assets/images/AnalyticIcon.png'),
    title: 'Analytics',
    description: 'Visualize your energy consumption with analytics.',
  },
];

const Welcome = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<RNFlatList<any>>(null);

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => {
        const next = prev === slides.length - 1 ? 0 : prev + 1;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const onViewableItemsChanged = useRef(({
    viewableItems,
  }: {
    viewableItems: Array<ViewToken>;
  }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') setActiveIndex(viewableItems[0].index);
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.mainWhite }}>
      {/* Header kiri atas */}
      <View style={{ marginTop: 100, paddingHorizontal: 20 }}>
        <Typo size={24} fontWeight="800" color={colors.mainBlue}>
          EnerTrack
        </Typo>
      </View>
      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            <Image source={item.icon} style={{ width: 400, height: 400, marginBottom: 36 }} resizeMode="contain" />
            <Typo size={22} fontWeight="700" style={{ marginBottom: 8 }}>{item.title}</Typo>
            <Typo size={15} color={colors.textDarkGrey} style={{ textAlign: 'center', paddingHorizontal: 30 }}>{item.description}</Typo>
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />
      {/* Indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16 }}>
        {slides.map((_, i) => (
          <View key={i} style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: i === activeIndex ? colors.mainBlue : colors.neutral200,
            marginHorizontal: 5
          }} />
        ))}
      </View>
      {/* Tombol bawah */}
      <View style={{ marginBottom: 40, alignItems: 'center' }}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/Register')}>
          <Typo size={16} color={colors.white} fontWeight="600">Get Started</Typo>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btnPrimary: {
    backgroundColor: colors.mainBlue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 12,
  },
  btnOutline: {
    borderColor: colors.mainBlue,
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
});

export default Welcome;
