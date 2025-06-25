import { useRouter } from "expo-router";
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, UserType, CategoryType, HistoryItem, DevicePayload, SubmitResponseData, AnalysisResult, ChartDataPoint, CategoryChartData } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

const BASE_URL = 'http://192.168.1.108:8081';

const getTariffByCapacity = (capacity: string | null): number => {
    if (!capacity) return 1444.70;
    const valStr = capacity.split(" ")[0].replace(/\./g, '');
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return 1444.70;
    if (val <= 900) return 1352.0;
    if (val <= 2200) return 1444.70;
    return 1699.53;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [justLoggedOut, setJustLoggedOut] = useState(false);

    const logout = useCallback(async (): Promise<{ success: boolean; message: string }> => {
        if (isLoggingOut) return { success: false, message: "Logout in progress" };
        setIsLoggingOut(true);
        try {
            setUser(null);
            setJustLoggedOut(true);
            await AsyncStorage.removeItem('userData');
            router.replace("/(auth)/Welcome");
            return { success: true, message: "Logout successful!" };
        } catch (error) {
            return { success: false, message: "An error occurred during logout" };
        } finally {
            setIsLoggingOut(false);
        }
    }, [isLoggingOut, router]);

    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}, bypassAuthCheck: boolean = false): Promise<any> => {
        const finalHeaders: Record<string, string> = { };
        if (options.body && !(options.headers && (options.headers as Record<string, string>)['Content-Type'])) { 
            finalHeaders['Content-Type'] = 'application/json'; 
        }
        if (options.headers) { 
            if (options.headers instanceof Headers) { 
                options.headers.forEach((value, key) => { finalHeaders[key] = value; }); 
            } else { 
                const customHeaders = options.headers as Record<string, string>; 
                for (const key in customHeaders) { 
                    finalHeaders[key] = customHeaders[key]; 
                } 
            } 
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, { 
            ...options, 
            headers: finalHeaders, 
            credentials: 'include', 
        });
        
        const responseText = await response.text();
        let responseData: any;
        
        if (response.status === 401 && !bypassAuthCheck) {
            console.log(`Session expired (401) for endpoint: ${endpoint}. Logging out...`);
            await logout(); 
            let errorMessage = "Session expired";
            try { 
                const errorJson = JSON.parse(responseText); 
                errorMessage = errorJson.error || errorJson.message || responseText || errorMessage; 
            } catch (e) { 
                if (responseText && responseText.trim() !== "") { 
                    errorMessage = responseText; 
                } 
            }
            throw new Error(errorMessage);
        }
        
        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            try { 
                const errorJson = JSON.parse(responseText); 
                errorMessage = errorJson.error || errorJson.message || responseText || errorMessage; 
            } catch (e) { 
                if (responseText && responseText.trim() !== "") { 
                    errorMessage = responseText; 
                } 
            }
            console.error(`API call to ${endpoint} failed with status ${response.status}: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        
        if (!responseText || responseText.trim() === "") { 
            return null; 
        }
        
        try { 
            responseData = JSON.parse(responseText); 
        } catch (jsonParseError) { 
            console.error(`Failed to parse successful response from ${endpoint} as JSON. Text: "${responseText}"`, jsonParseError); 
            throw new Error(`Expected JSON response from ${endpoint} but received malformed data.`); 
        }
        
        return responseData;
    }, [logout]);

    const checkSession = useCallback(async (): Promise<boolean> => {
        try {
            const sessionData = await apiCall('/auth/check-session', { method: 'GET' });
            if (sessionData && sessionData.user_id) {
                const userData: UserType = {
                    uid: String(sessionData.user_id), 
                    email: sessionData.email || null,
                    username: sessionData.username || null, 
                    image: sessionData.profile_image_url || null,
                };
                setUser(userData);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                return true;
            }
            return false;
        } catch (error) {
            console.log("Invalid session:", error);
            setUser(null);
            await AsyncStorage.removeItem('userData');
            return false;
        }
    }, [apiCall]);

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                const isValid = await checkSession();
                if (isValid) {
                    router.replace("/(tabs)/Home");
                } else {
                    router.replace("/(auth)/Welcome");
                }
            } else {
                router.replace("/(auth)/Welcome");
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            setUser(null);
            await AsyncStorage.removeItem('userData');
            router.replace("/(auth)/Welcome");
        } finally {
            setIsLoading(false);
            setJustLoggedOut(false);
        }
    }, [checkSession, router]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const login = useCallback(async (email: string, password: string, remember: boolean = true): Promise<{ success: boolean; message: string; data?: any }> => {
        try {
            const payload = { email, password, remember };
            const responseData = await apiCall('/login', { method: 'POST', body: JSON.stringify(payload) }, true);
            const userData: UserType = {
                uid: String(responseData.user_id), 
                email: email,
                username: responseData.username || null, 
                image: responseData.profile_image_url || null,
            };
            setUser(userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            router.replace("/(tabs)/Home");
            return { success: true, message: responseData.message || "Login successful!", data: responseData };
        } catch (error: any) {
            console.error("Error during login:", error.message);
            return { success: false, message: error.message || "An error occurred." };
        }
    }, [apiCall, router]);

    const register = useCallback(async (username: string, email: string, password: string): Promise<{ success: boolean; message: string; data?: any }> => {
        try {
            const payload = { username, email, password };
            const responseData = await apiCall('/register', { method: 'POST', body: JSON.stringify(payload) }, true);
            return { success: true, message: responseData.message || "Registration successful!", data: responseData };
        } catch (error: any) {
            console.error("Error during registration:", error.message);
            return { success: false, message: error.message || "Registration failed." };
        }
    }, [apiCall]);

    const submitDevices = useCallback(async (billingType: string, electricity: { amount?: number, kwh?: number }, devices: DevicePayload[]): Promise<{ success: boolean; message: string; data?: SubmitResponseData }> => {
        try {
            const payload = { billingtype: billingType, electricity: electricity, devices: devices };
            const responseData = await apiCall('/submit', { method: 'POST', body: JSON.stringify(payload) });
            return { success: true, message: responseData.message || "Data saved successfully", data: responseData };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while saving data" };
        }
    }, [apiCall]);

    const getBrands = useCallback(async (): Promise<{ success: boolean; message: string; data?: string[] }> => {
        try {
            const brandsData = await apiCall('/brands');
            return { success: true, message: "Successfully retrieved brand data", data: brandsData as string[] || [] };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving brand data" };
        }
    }, [apiCall]);

    const getCategories = useCallback(async (): Promise<{ success: boolean; message: string; data?: CategoryType[] }> => {
        try {
            const categoriesData = await apiCall('/categories');
            return { success: true, message: "Successfully retrieved category data", data: categoriesData as CategoryType[] || [] };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving category data" };
        }
    }, [apiCall]);

    const getHouseCapacities = useCallback(async (): Promise<{ success: boolean; message: string; data?: string[] }> => {
        try {
            const capacitiesData = await apiCall('/house-capacity');
            return { success: true, message: "Successfully retrieved house capacity", data: capacitiesData as string[] || [] };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving house capacity" };
        }
    }, [apiCall]);

    const getDeviceHistory = useCallback(async (): Promise<{ success: boolean; message: string; data?: HistoryItem[] }> => {
        try {
            const historyData = await apiCall('/history');
            if (historyData) {
                const formattedHistory: HistoryItem[] = (historyData || []).map((item: any) => {
                    const power = parseFloat(item.daya) || 0;
                    const usage = parseFloat(item.durasi) || 0;
                    const dailyKwh = (power * usage) / 1000;
                    const monthlyKwh = dailyKwh * 30;
                    const tariffRate = getTariffByCapacity(item.besar_listrik);
                    const estimatedCost = dailyKwh * tariffRate;
                    const costString = `Rp ${estimatedCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    return {
                        id: String(item.id), 
                        date: item.tanggal_input || new Date().toISOString().split('T')[0],
                        appliance: item.nama_perangkat || 'N/A', 
                        applianceDetails: item.brand ? `Brand: ${item.brand}` : 'N/A',
                        category: { id: item.category_id || 0, name: item.category_name || 'Other' },
                        power: power, 
                        usage: usage, 
                        dailyKwh: dailyKwh, 
                        monthlyKwh: monthlyKwh, 
                        cost: costString,
                    };
                });
                return { success: true, message: "Successfully retrieved device history", data: formattedHistory };
            } else {
                return { success: true, message: "Device history is empty or no data available", data: [] };
            }
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving device history" };
        }
    }, [apiCall]);

    const updateUserData = useCallback(async (userDataToUpdate: Partial<UserType>): Promise<{ success: boolean; message: string }> => {
        try {
            if (!user) { 
                return { success: false, message: "User not found" }; 
            }
            const responseData = await apiCall('/user/profile', { method: 'PUT', body: JSON.stringify(userDataToUpdate) });
            if (responseData && responseData.success) {
                const updatedUser = { ...user, ...userDataToUpdate };
                setUser(updatedUser);
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                return { success: true, message: responseData.message || "Profile updated successfully" };
            } else {
                return { success: false, message: responseData.error || "Failed to update profile." };
            }
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to update user data." };
        }
    }, [apiCall, user]);

    const analyzeDevices = useCallback(async (devicesToAnalyze: DevicePayload[], besarListrik: string): Promise<{ success: boolean; message?: string; data?: AnalysisResult }> => {
        try {
            const payload = { devices: devicesToAnalyze, besar_listrik: besarListrik };
            const responseData = await apiCall('/analyze', { method: 'POST', body: JSON.stringify(payload) });
            return { success: true, message: responseData.message || "Analysis successful", data: responseData as AnalysisResult };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred during analysis" };
        }
    }, [apiCall]);

    const getWeeklyStatistics = useCallback(async (date?: string): Promise<{ success: boolean; message: string; data?: ChartDataPoint[] }> => {
        try {
            const endpoint = date ? `/statistics/weekly?date=${encodeURIComponent(date)}` : '/statistics/weekly';
            console.log('🔍 Fetching weekly statistics from:', endpoint);
            const data = await apiCall(endpoint);
            console.log('📊 Received weekly statistics data:', data);
            
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ Invalid or empty data received from server');
                // Return default 0 values for 7 days if no valid data
                return { 
                    success: true, 
                    message: "No data available", 
                    data: Array(7).fill(null).map((_, i) => ({
                        label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                        value: 0,
                        frontColor: '#3B82F6'
                    }))
                };
            }
            
            const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const formattedData: ChartDataPoint[] = daysOfWeek.map(day => {
                const existingData = data.find((item: any) => {
                    const itemDay = item.day || item.label || '';
                    return itemDay.toLowerCase() === day.toLowerCase();
                });
                
                // Prioritize total_kwh, then kwh, consumption, value, finally 0
                const value = existingData ? parseFloat(existingData.total_kwh || existingData.kwh || existingData.consumption || existingData.value || 0) : 0;
                console.log(`📊 Day ${day}: ${value} kWh`);
                
                return {
                    label: day,
                    value: value,
                    frontColor: '#3B82F6'
                };
            });
            
            console.log('✅ Formatted weekly data:', formattedData);
            return { success: true, message: "Successfully retrieved weekly statistics", data: formattedData };
        } catch (error: any) {
            console.error('❌ Error fetching weekly statistics:', error);
            return { success: false, message: error.message || "Error occurred while fetching weekly statistics" };
        }
    }, [apiCall]);

    const getMonthlyStatistics = useCallback(async (): Promise<{ success: boolean; message: string; data?: ChartDataPoint[] }> => {
        try {
            const data = await apiCall('/statistics/monthly');
            return { success: true, message: "Successfully retrieved monthly statistics", data: data as ChartDataPoint[] || [] };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving monthly statistics" };
        }
    }, [apiCall]);

    const getCategoryStatistics = useCallback(async (): Promise<{ success: boolean; message: string; data?: CategoryChartData[] }> => {
        try {
            const data = await apiCall('/statistics/category');
            return { success: true, message: "Successfully retrieved category statistics", data: data as CategoryChartData[] || [] };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving category statistics" };
        }
    }, [apiCall]);

    const getChartDataRange = useCallback(async (): Promise<{ success: boolean; message: string; firstDate?: string; lastDate?: string }> => {
        try {
            const data = await apiCall('/statistics/data-range');
            return { success: true, message: "Successfully retrieved chart data range", firstDate: data.firstDate, lastDate: data.lastDate };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while retrieving chart data range" };
        }
    }, [apiCall]);

    const contextValue = useMemo(() => ({
        user, 
        setUser, 
        login, 
        register, 
        logout, 
        updateUserData, 
        isLoading,
        apiCall, 
        checkSession, 
        submitDevices, 
        getBrands, 
        getCategories,
        getHouseCapacities, 
        getDeviceHistory, 
        analyzeDevices, 
        getWeeklyStatistics,
        getMonthlyStatistics, 
        getCategoryStatistics, 
        getChartDataRange,
        justLoggedOut,
    }), [
        user, 
        isLoading, 
        login, 
        register, 
        logout, 
        updateUserData, 
        apiCall, 
        checkSession, 
        submitDevices, 
        getBrands, 
        getCategories, 
        getHouseCapacities, 
        getDeviceHistory, 
        analyzeDevices, 
        getWeeklyStatistics, 
        getMonthlyStatistics, 
        getCategoryStatistics, 
        getChartDataRange, 
        justLoggedOut
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) { 
        throw new Error("useAuth must be wrapped inside AuthProvider"); 
    }
    return context;
};

export default AuthProvider;
