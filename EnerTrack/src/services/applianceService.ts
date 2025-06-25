// services/applianceService.ts
import { useAuth } from '@/contexts/authContext';
import { Appliance, ApplianceInput, ApplianceUpdate } from '@/types';

export const useApplianceService = () => {
    const { apiCall } = useAuth();

    const createAppliance = async (appliance: ApplianceInput): Promise<{ success: boolean; message: string; data?: Appliance }> => {
        try {
            // apiCall akan mengembalikan data JSON atau melempar error
            const responseData = await apiCall('/user/appliances', {
                method: 'POST',
                body: JSON.stringify(appliance),
            });

            // Asumsi backend mengirimkan { message: "...", data: {...} } atau hanya data appliance
            return {
                success: true,
                message: responseData.message || "Appliance created successfully",
                data: responseData.data || responseData // Sesuaikan dengan struktur respons backend Anda
            };
        } catch (error: any) {
            console.error("Error creating appliance:", error.message);
            return { success: false, message: error.message || "An unexpected error occurred while creating appliance" };
        }
    };

    const getUserAppliances = async (): Promise<{ success: boolean; data?: Appliance[]; message: string }> => {
        try {
            const responseData = await apiCall('/user/appliances', {
                method: 'GET',
            });
            // Asumsi responseData adalah array Appliance[] atau null jika kosong
            return {
                success: true,
                data: responseData as Appliance[] || [], // Jika null, jadikan array kosong
                message: "Appliances loaded successfully"
            };
        } catch (error: any) {
            console.error("Error loading appliances:", error.message);
            return { success: false, message: error.message || "An unexpected error occurred while loading appliances", data: [] };
        }
    };

    const updateAppliance = async (applianceData: ApplianceUpdate): Promise<{ success: boolean; message: string; data?: Appliance }> => {
        try {
            // Backend Anda (UpdateApplianceHandler di appliance_crud.go) saat ini mengharapkan ID di body.
            // Jika Anda ingin ID di path URL, endpointnya akan menjadi /user/appliances/${applianceData.id}
            // dan handler backend juga perlu disesuaikan untuk membaca ID dari path.
            // Untuk saat ini, kita ikuti handler backend yang mengharapkan ID di body ApplianceUpdate
            // dan endpoint /user/appliances untuk PUT.
            const responseData = await apiCall('/user/appliances', { // Endpoint untuk update sesuai main.go Anda
                method: 'PUT',
                body: JSON.stringify(applianceData), // applianceData sudah berisi ID
            });
            return {
                success: true,
                message: responseData.message || "Appliance updated successfully",
                data: responseData.data || responseData
            };
        } catch (error: any) {
            console.error("Error updating appliance:", error.message);
            return { success: false, message: error.message || "An unexpected error occurred while updating appliance" };
        }
    };

    const deleteAppliance = async (applianceId: number): Promise<{ success: boolean; message: string }> => {
        try {
            // Backend Anda (DeleteApplianceHandler di appliance_crud.go) saat ini mengharapkan ID di body.
            // Endpointnya adalah /user/appliances untuk DELETE.
            const responseData = await apiCall('/user/appliances', {
                method: 'DELETE',
                body: JSON.stringify({ id: applianceId }), // Kirim objek { id: ... }
            });
            return {
                success: true,
                message: responseData.message || "Appliance deleted successfully"
            };
        } catch (error: any) {
            console.error("Error deleting appliance:", error.message);
            return { success: false, message: error.message || "An unexpected error occurred while deleting appliance" };
        }
    };

    const getApplianceById = async (id: number): Promise<{ success: boolean; data?: Appliance; message: string }> => {
        try {
            // Endpoint ini (dengan ID di path) sudah benar sesuai router.HandleFunc("/user/appliances/", ...) di main.go Anda
            const responseData = await apiCall(`/user/appliances/${id}`, {
                method: 'GET',
            });
            return {
                success: true,
                data: responseData as Appliance,
                message: "Appliance loaded successfully"
            };
        } catch (error: any) {
            console.error("Error loading appliance by ID:", error.message);
            return { success: false, message: error.message || "An unexpected error occurred while loading the appliance" };
        }
    };

    // getHouseCapacities sudah ada di authContext.tsx dan sepertinya lebih cocok di sana
    // Jika Anda ingin fungsi ini ada di service ini juga dan mungkin berbeda implementasinya,
    // Anda bisa menambahkannya. Tapi jika sama, cukup gunakan yang dari authContext.

    return {
        createAppliance,
        getUserAppliances,
        updateAppliance,
        deleteAppliance,
        getApplianceById,
    };
};