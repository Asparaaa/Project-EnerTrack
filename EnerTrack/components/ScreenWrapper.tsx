// File: ScreenWrapper.tsx

// Hapus import View
import {
    Platform,
    StatusBar,
    StyleSheet,
    SafeAreaView // <-- Tambahkan ini
} from "react-native";
import React from "react";
import { ScreenWrapperProps } from "../types";
import { colors } from "../constants/theme";

const ScreenWrapper = ({ style, children } : ScreenWrapperProps) => {
    // Hapus baris let paddingTop = ...
    return (
        // Ganti View jadi SafeAreaView
        <SafeAreaView
            style={[
                styles.container, // <-- Gunakan style dari bawah
                style,
            ]}
        >
            <StatusBar 
                backgroundColor={colors.white}
                barStyle = "dark-content" />
            {children}
        </SafeAreaView>
    );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
    container: { // <-- Buat style baru
        flex: 1,
        backgroundColor: colors.mainWhite,
    }
});