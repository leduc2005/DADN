/**
 * api_sync.ts - Khối đồng bộ dữ liệu (Offline-First to Cloud storage)
 */

const BASE_URL = "http://localhost:5000";
const API_BASE = `${BASE_URL}/api/v1/calculation`;

export interface SyncPayload {
    userId: string;
    projectId: string;
    data: any; // Dynamic state payload
}

/**
 * Hàm pushStateToServer: dùng để đồng bộ dữ liệu tính toán (từ ProjectState) lên server DB
 */
export async function pushStateToServer(payload: SyncPayload) {
    try {
        const response = await fetch(`${API_BASE}/projects/${payload.projectId}/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload.data),
        });

        if (!response.ok) {
            console.error("Failed to sync project state to server:", await response.text());
            return false;
        }

        console.log("Successfully synced project state to server.");
        return true;
    } catch (error) {
        console.error("Network error while syncing project state:", error);
        return false; // Lưu offline tạm, sync sau
    }
}
