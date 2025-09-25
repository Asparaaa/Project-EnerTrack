// Mengimpor hook dan komponen yang dibutuhkan dari berbagai library
import { useRouter } from "expo-router"; // Hook untuk navigasi/pindah halaman dari Expo Router
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react"; // Hook-hook inti dari React
import AsyncStorage from '@react-native-async-storage/async-storage'; // Komponen untuk menyimpan data secara lokal di perangkat pengguna
import { AuthContextType, UserType, CategoryType, HistoryItem, DevicePayload, SubmitResponseData, AnalysisResult, ChartDataPoint, CategoryChartData } from "@/types"; // Mengimpor tipe data kustom agar kode lebih terstruktur dan mudah dibaca

// Membuat 'Context' untuk otentikasi. Anggap saja ini sebagai "wadah" global
// yang bisa menyimpan state (seperti data user) dan fungsi (seperti login/logout).
// Komponen lain nanti bisa "mengambil" data dari wadah ini.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mendefinisikan tipe properti untuk komponen AuthProvider.
// Ini hanya memberi tahu TypeScript bahwa komponen ini akan menerima 'children',
// yaitu komponen-komponen lain yang akan "dibungkus" olehnya.
interface AuthProviderProps {
    children: React.ReactNode;
}

// Alamat dasar (base URL) dari server API backend.
// Semua request ke API akan diawali dengan alamat ini.
const BASE_URL = 'http://192.168.1.108:8081';

/**
 * Fungsi bantuan untuk mendapatkan tarif listrik per kWh berdasarkan kapasitas daya rumah.
 * @param capacity - String kapasitas daya, contoh: "900 VA" atau "1.300 VA".
 * @returns - Nilai tarif listrik dalam Rupiah.
 */
const getTariffByCapacity = (capacity: string | null): number => {
    if (!capacity) return 1444.70; // Jika tidak ada data kapasitas, gunakan tarif default
    const valStr = capacity.split(" ")[0].replace(/\./g, ''); // Ambil angka saja, misal "1.300 VA" -> "1300"
    const val = parseInt(valStr, 10); // Ubah string angka menjadi integer
    if (isNaN(val)) return 1444.70; // Jika gagal diubah, gunakan tarif default

    // Logika penentuan tarif berdasarkan aturan PLN
    if (val <= 900) return 1352.0;
    if (val <= 2200) return 1444.70;
    return 1699.53;
};

// Ini adalah komponen Provider utama. Fungsinya untuk "menyediakan" state dan fungsi
// yang ada di dalam AuthContext ke seluruh aplikasi (atau ke komponen 'children'-nya).
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // State untuk menyimpan data pengguna yang sedang login. Defaultnya null (tidak ada yang login).
    const [user, setUser] = useState<UserType | null>(null);
    // State untuk menandakan apakah aplikasi sedang dalam proses loading awal (misal: cek sesi).
    const [isLoading, setIsLoading] = useState(true);
    // Mengambil instance router untuk keperluan navigasi.
    const router = useRouter();
    // State untuk mencegah proses logout dijalankan berkali-kali secara bersamaan.
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    // State untuk menandakan jika pengguna baru saja melakukan logout.
    const [justLoggedOut, setJustLoggedOut] = useState(false);

    /**
     * Fungsi untuk melakukan logout.
     * Dibungkus dengan useCallback agar fungsi ini tidak dibuat ulang setiap kali komponen render,
     * kecuali jika dependensinya (isLoggingOut, router) berubah. Ini baik untuk performa.
     */
    const logout = useCallback(async (): Promise<{ success: boolean; message: string }> => {
        if (isLoggingOut) return { success: false, message: "Logout in progress" }; // Mencegah logout ganda
        setIsLoggingOut(true);
        try {
            setUser(null); // Hapus data user dari state
            setJustLoggedOut(true); // Tandai bahwa baru saja logout
            await AsyncStorage.removeItem('userData'); // Hapus data user dari penyimpanan lokal
            router.replace("/(auth)/Welcome"); // Arahkan pengguna ke halaman Welcome
            return { success: true, message: "Logout successful!" };
        } catch (error) {
            return { success: false, message: "An error occurred during logout" };
        } finally {
            setIsLoggingOut(false); // Selesaikan proses logout
        }
    }, [isLoggingOut, router]);

    /**
     * Fungsi generik untuk melakukan panggilan (request) ke API backend.
     * Ini adalah "jantung" dari komunikasi dengan server.
     * @param endpoint - Path API yang dituju, misal: '/login'.
     * @param options - Konfigurasi request (method, body, headers).
     * @param bypassAuthCheck - Jika true, tidak akan otomatis logout saat response 401 (Unauthorized).
     */
    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}, bypassAuthCheck: boolean = false): Promise<any> => {
        const finalHeaders: Record<string, string> = {};
        // Otomatis menambahkan header 'Content-Type': 'application/json' jika ada body
        if (options.body && !(options.headers && (options.headers as Record<string, string>)['Content-Type'])) {
            finalHeaders['Content-Type'] = 'application/json';
        }
        // Menggabungkan header default dengan header kustom dari options
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

        // Melakukan fetch request ke server
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: finalHeaders,
            credentials: 'include', // Penting: agar cookie (untuk session) bisa dikirim dan diterima
        });

        const responseText = await response.text(); // Membaca response sebagai teks dulu

        // Penanganan kasus khusus: 401 Unauthorized (sesi habis)
        if (response.status === 401 && !bypassAuthCheck) {
            console.log(`Session expired (401) for endpoint: ${endpoint}. Logging out...`);
            await logout(); // Otomatis logout pengguna
            let errorMessage = "Session expired";
            try { // Mencoba mengambil pesan error dari response JSON
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.error || errorJson.message || responseText || errorMessage;
            } catch (e) { // Jika response bukan JSON, gunakan teksnya sebagai pesan error
                if (responseText && responseText.trim() !== "") {
                    errorMessage = responseText;
                }
            }
            throw new Error(errorMessage); // Lemparkan error agar bisa ditangkap di pemanggil fungsi
        }

        // Penanganan jika request tidak berhasil (status code bukan 2xx)
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

        // Jika response berhasil tapi tidak ada body (kosong), kembalikan null
        if (!responseText || responseText.trim() === "") {
            return null;
        }

        // Mencoba mengubah response teks menjadi objek JSON
        let responseData: any;
        try {
            responseData = JSON.parse(responseText);
        } catch (jsonParseError) {
            console.error(`Failed to parse successful response from ${endpoint} as JSON. Text: "${responseText}"`, jsonParseError);
            throw new Error(`Expected JSON response from ${endpoint} but received malformed data.`);
        }

        return responseData; // Kembalikan data JSON
    }, [logout]);

    /**
     * Fungsi untuk memeriksa validitas sesi pengguna ke server.
     */
    const checkSession = useCallback(async (): Promise<boolean> => {
        try {
            // Memanggil endpoint check-session di backend
            const sessionData = await apiCall('/auth/check-session', { method: 'GET' });
            if (sessionData && sessionData.user_id) {
                // Jika sesi valid, susun data user dan simpan di state & AsyncStorage
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
            // Jika sesi tidak valid atau ada error, bersihkan data user
            console.log("Invalid session:", error);
            setUser(null);
            await AsyncStorage.removeItem('userData');
            return false;
        }
    }, [apiCall]);

    /**
     * Fungsi untuk memeriksa status otentikasi saat aplikasi pertama kali dimuat.
     * Ini yang menentukan apakah pengguna akan diarahkan ke halaman Home atau Welcome.
     */
    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                // Jika ada data di AsyncStorage, verifikasi lagi ke server
                const isValid = await checkSession();
                if (isValid) {
                    router.replace("/(tabs)/Home"); // Jika valid, ke Home
                } else {
                    router.replace("/(auth)/Welcome"); // Jika tidak, ke Welcome
                }
            } else {
                // Jika tidak ada data sama sekali, langsung ke Welcome
                router.replace("/(auth)/Welcome");
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            setUser(null);
            await AsyncStorage.removeItem('userData');
            router.replace("/(auth)/Welcome");
        } finally {
            setIsLoading(false); // Selesaikan loading
            setJustLoggedOut(false);
        }
    }, [checkSession, router]);

    // Hook useEffect untuk menjalankan `checkAuthStatus` sekali saja
    // saat AuthProvider pertama kali di-render.
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    /**
     * Fungsi untuk login pengguna.
     */
    const login = useCallback(async (email: string, password: string, remember: boolean = true): Promise<{ success: boolean; message: string; data?: any }> => {
        try {
            const payload = { email, password, remember };
            const responseData = await apiCall('/login', { method: 'POST', body: JSON.stringify(payload) }, true); // bypassAuthCheck = true karena ini memang halaman login
            const userData: UserType = {
                uid: String(responseData.user_id),
                email: email,
                username: responseData.username || null,
                image: responseData.profile_image_url || null,
            };
            setUser(userData); // Simpan data user di state
            await AsyncStorage.setItem('userData', JSON.stringify(userData)); // Simpan di penyimpanan lokal
            router.replace("/(tabs)/Home"); // Arahkan ke Home
            return { success: true, message: responseData.message || "Login successful!", data: responseData };
        } catch (error: any) {
            console.error("Error during login:", error.message);
            return { success: false, message: error.message || "An error occurred." };
        }
    }, [apiCall, router]);

    /**
     * Fungsi untuk registrasi pengguna baru.
     */
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

    /**
     * Fungsi untuk mengirim data perangkat elektronik yang diinput pengguna ke server.
     */
    const submitDevices = useCallback(async (billingType: string, electricity: { amount?: number, kwh?: number }, devices: DevicePayload[]): Promise<{ success: boolean; message: string; data?: SubmitResponseData }> => {
        try {
            const payload = { billingtype: billingType, electricity: electricity, devices: devices };
            const responseData = await apiCall('/submit', { method: 'POST', body: JSON.stringify(payload) });
            return { success: true, message: responseData.message || "Data saved successfully", data: responseData };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred while saving data" };
        }
    }, [apiCall]);

    // Di bawah ini adalah serangkaian fungsi untuk mengambil data (GET request) dari server.
    // Polanya sama: memanggil `apiCall` dengan endpoint yang sesuai dan menangani hasilnya.

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

    /**
     * Fungsi untuk mengambil riwayat input perangkat dari server dan memformatnya.
     */
    const getDeviceHistory = useCallback(async (): Promise<{ success: boolean; message: string; data?: HistoryItem[] }> => {
        try {
            const historyData = await apiCall('/history');
            if (historyData) {
                // Memformat data mentah dari API menjadi format yang lebih mudah digunakan di frontend.
                const formattedHistory: HistoryItem[] = (historyData || []).map((item: any) => {
                    const power = parseFloat(item.daya) || 0;
                    const usage = parseFloat(item.durasi) || 0;
                    const dailyKwh = (power * usage) / 1000; // Kalkulasi kWh harian
                    const monthlyKwh = dailyKwh * 30; // Estimasi kWh bulanan
                    const tariffRate = getTariffByCapacity(item.besar_listrik); // Dapatkan tarif
                    const estimatedCost = dailyKwh * tariffRate; // Kalkulasi estimasi biaya harian
                    const costString = `Rp ${estimatedCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format biaya ke Rupiah
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

    /**
     * Fungsi untuk memperbarui data pengguna (misal: ganti username atau foto profil).
     */
    const updateUserData = useCallback(async (userDataToUpdate: Partial<UserType>): Promise<{ success: boolean; message: string }> => {
        try {
            if (!user) {
                return { success: false, message: "User not found" };
            }
            const responseData = await apiCall('/user/profile', { method: 'PUT', body: JSON.stringify(userDataToUpdate) });
            if (responseData && responseData.success) {
                // Jika berhasil di server, update juga state dan AsyncStorage
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

    /**
     * Fungsi untuk mengirim data perangkat ke server untuk dianalisis (misal: dapatkan rekomendasi).
     */
    const analyzeDevices = useCallback(async (devicesToAnalyze: DevicePayload[], besarListrik: string): Promise<{ success: boolean; message?: string; data?: AnalysisResult }> => {
        try {
            const payload = { devices: devicesToAnalyze, besar_listrik: besarListrik };
            const responseData = await apiCall('/analyze', { method: 'POST', body: JSON.stringify(payload) });
            return { success: true, message: responseData.message || "Analysis successful", data: responseData as AnalysisResult };
        } catch (error: any) {
            return { success: false, message: error.message || "An error occurred during analysis" };
        }
    }, [apiCall]);

    /**
     * Mengambil data statistik konsumsi listrik mingguan untuk ditampilkan di chart.
     * @param date - Tanggal referensi untuk minggu yang ingin diambil. Jika kosong, server akan pakai tanggal sekarang.
     */
    const getWeeklyStatistics = useCallback(async (date?: string): Promise<{ success: boolean; message: string; data?: ChartDataPoint[] }> => {
        try {
            const endpoint = date ? `/statistics/weekly?date=${encodeURIComponent(date)}` : '/statistics/weekly';
            console.log('🔍 Fetching weekly statistics from:', endpoint);
            const data = await apiCall(endpoint);
            console.log('📊 Received weekly statistics data:', data);

            // Jika data dari server tidak valid atau kosong
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ Invalid or empty data received from server');
                // Kembalikan data default (7 hari dengan nilai 0) agar chart tidak error
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
            // Memformat data dari API agar sesuai dengan format yang dibutuhkan oleh komponen chart
            const formattedData: ChartDataPoint[] = daysOfWeek.map(day => {
                const existingData = data.find((item: any) => {
                    const itemDay = item.day || item.label || '';
                    return itemDay.toLowerCase() === day.toLowerCase();
                });

                // Mencari nilai konsumsi. Coba dari `total_kwh`, `kwh`, `consumption`, `value`, jika tidak ada semua, pakai 0.
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

    // useMemo digunakan untuk "mengingat" nilai dari contextValue.
    // Objek contextValue ini hanya akan dibuat ulang jika salah satu dari dependensinya
    // (yang ada di dalam array di bawah) berubah. Ini adalah optimasi performa yang
    // mencegah komponen-komponen consumer (yang memakai useAuth) untuk render ulang tanpa perlu.
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

    // Komponen Provider ini akan "membungkus" komponen lain (`children`)
    // dan memberikan `contextValue` (yang berisi semua state dan fungsi)
    // kepada mereka.
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook `useAuth`. Ini adalah cara mudah bagi komponen lain
 * untuk mengakses context. Daripada menulis `useContext(AuthContext)`
 * yang panjang, mereka cukup memanggil `useAuth()`.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    // Jika hook ini dipanggil di luar AuthProvider, akan muncul error.
    // Ini untuk memastikan penggunaannya selalu benar.
    if (!context) {
        throw new Error("useAuth must be wrapped inside AuthProvider");
    }
    return context;
};

export default AuthProvider;
