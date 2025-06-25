import React, { ReactNode } from "react";
import { Href } from "expo-router";
import { Icon } from "phosphor-react-native";
import {
    ActivityIndicator,
    ActivityIndicatorProps,
    ImageStyle,
    PressableProps,
    TextInput,
    TextInputProps,
    TextProps,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
    ModalProps as RNModalProps,
    Modal
  } from "react-native";

export type ScreenWrapperProps = {
    style?: ViewStyle;
    children: React.ReactNode;
};

export type ModalWrapperProps = {
    style?: ViewStyle;
    children: React.ReactNode;
    bg?: string;
};

export type PROPS = RNModalProps & {
    isOpen: boolean;
    withInput?: boolean;
};

export type SignUpFormData = {
    username: string;
    email: string;
    password: string;
};

export type SignInFormData = {
    email: string;
    password: string;
}

export type SignUpModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSignUpClick: () => void;
    onSubmit: (data: SignUpFormData) => Promise<void>;
}

export type SignInModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSignInClick: () => void;
    onSubmit: (data: SignInFormData) => Promise<void>;
}
export type TypoProps = {
    size?: number;
    color?: string;
    fontWeight?: TextStyle["fontWeight"];
    fontFamily?: string;
    children: React.ReactNode;
    style?: TextStyle;
    textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
    height?: number;
    width?: number;
    strokeWidth?: number;
    color?: string;
    fill?: string;
}>;

export type IconProps = {
    name: string;
    color?: string;
    size?: number;
    strokeWidth?: number;
    fill?: string;
  };

  export type HeaderProps = {
    title?: string;
    style?: ViewStyle;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

export type BackButtonProps = {
    style?: ViewStyle;
    iconSize?: number;
};

export interface InputProps extends TextInputProps {
    icon?: React.ReactNode;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    inputRef?: React.RefObject<TextInput>;
}

export interface CustomButtonProps extends TouchableOpacityProps {
    style?: ViewStyle;
    onPress?: () => void;
    loading?: boolean;
    children: React.ReactNode;
}

export type ImageUploadProps = {
    file?: any;
    onSelect: (file: any) => void;
    onClear: () => void;
    containerStyle?: ViewStyle;
    imageStyle?: ViewStyle;
    placeholder?: string;
};

export type UserType = {
    uid: string;
    email: string | null;
    image?: string | null;
    username?: string | null;
}

export type UserDataType = {
    name: string;
    image?: any;
};

export type ResponseType = {
    success: boolean;
    data?: any;
    message?: string;
};

export interface CategoryType {
    id: number;
    name: string;
}

export interface DevicePayload {
    jenis_pembayaran: string;
    besar_listrik: string;
    name: string;
    brand: string;
    power: number;
    duration: number;
    category_id: number;
}


export interface SubmitPayload {
    billingtype: string;
    electricity?: {
        amount?: number;
        kwh?: number;
    };
    devices: DevicePayload[];
}

export interface SubmitResponseData {
    id_submit: string;
    total_items: number;
    message?: string;
    ai_response?: string;
}

export interface ApplianceFormItem {
    id: number; 
    name: string;
    brand: string | null;
    category: string | null; 
    category_id: number | null; 
    powerRating: number;
    dailyUsage: number;
    quantity: number;
    dailyEnergy?: number;
    monthlyEnergy?: number;
    yearlyCost?: number;
    co2Emissions?: number;
}


export interface ApplianceInput {
    name: string;
    brand: string; 
    category_id: number; 
    power_rating: number;
    daily_usage: number;  
}

export interface ApplianceUpdate extends ApplianceInput { 
    id: number; 
}

export interface Appliance { 
    id: number;
    user_id?: number; 
    name: string;
    brand: string;
    category_id: number;
    category_name?: string; 
    power_rating: number; 
    daily_usage: number; 
}


export type HouseCapacity = string;

export interface AnalysisResult {
    total_power_wh: number;
    daily_kwh: number;
    monthly_kwh: number;
    tariff_rate: number;
    estimated_monthly_rp: string;
    ai_response: string;
    id_submit: string;
    besar_listrik: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  appliance: string;
  applianceDetails: string;
  category: CategoryType;
  power: number;
  usage: number;
  dailyKwh: number;
  monthlyKwh: number;
  cost: string;
}

export interface ChartDataPoint {
    value: number;
    label: string;
}

export interface CategoryChartData {
    name:string;
    percentage: number;
    color: string;
    total_power: number;
}


export interface AuthContextType {
    user: UserType | null;
    setUser: (user: UserType | null) => void;
    login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; message: string; data?: any }>;
    register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string; data?: any }>;
    logout: () => Promise<{ success: boolean; message: string }>;
    updateUserData: (userData: Partial<UserType>) => Promise<{ success: boolean; message: string }>;
    isLoading: boolean;
    apiCall: (endpoint: string, options?: RequestInit, bypassAuthCheck?: boolean) => Promise<any>;
    checkSession: () => Promise<boolean>;
    submitDevices: (billingType: string, electricity: { amount?: number; kwh?: number }, devices: DevicePayload[]) => Promise<{ success: boolean; message: string; data?: SubmitResponseData }>;
    getBrands: () => Promise<{ success: boolean; message: string; data?: string[] }>;
    getCategories: () => Promise<{ success: boolean; message: string; data?: CategoryType[] }>;
    getHouseCapacities: () => Promise<{ success: boolean; message: string; data?: string[] }>;
    getDeviceHistory: () => Promise<{ success: boolean; message: string; data?: HistoryItem[] }>;
    analyzeDevices: (devicesToAnalyze: DevicePayload[], besarListrik: string) => Promise<{ success: boolean; message?: string; data?: AnalysisResult }>;
    
    // --- PERUBAHAN: getWeeklyStatistics bisa menerima parameter tanggal ---
    getWeeklyStatistics: (date?: string) => Promise<{ success: boolean; message: string; data?: ChartDataPoint[] }>;
    getMonthlyStatistics: () => Promise<{ success: boolean; message: string; data?: ChartDataPoint[] }>;
    getCategoryStatistics: () => Promise<{ success: boolean; message: string; data?: CategoryChartData[] }>;
    getChartDataRange: () => Promise<{ success: boolean; message: string; firstDate?: string; lastDate?: string }>;
    justLoggedOut: boolean;
}