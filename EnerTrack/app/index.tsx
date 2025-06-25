// app/index.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/constants/theme";

const index = () => {
  const router = useRouter();

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     router.push("/Welcome");
  //   }, 2000);

  //   return () => clearTimeout(timeout);
  // }, []);

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.container}>
        <Typo size={32} fontWeight="700" color={colors.mainBlue}>
          EnerTrack
        </Typo>
        <Typo size={16} color={colors.textDarkGrey} style={{ marginTop: spacingY._10 }}>
          Smart Energy Usage App
        </Typo>
        <ActivityIndicator size="large" color={colors.mainBlue} style={{ marginTop: spacingY._20 }} />
      </View>
    </ScreenWrapper>
  );
};

export default index;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.mainWhite,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
