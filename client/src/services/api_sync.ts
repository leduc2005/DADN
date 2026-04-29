import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import {
  getUnsyncedProjects,
  markProjectSynced,
  getDeleteQueue,
  removeFromDeleteQueue,
} from '../database/sqlite';
import { useAuthStore } from '../store/authStore';

const TOKEN_KEY = 'auth_token';

// ─── Đồng bộ dự án chưa sync lên Cloud ─────────────────────────────────────

/**
 * Thực hiện đồng bộ 1 lần: Lấy tất cả project chưa sync → gửi lên server.
 * Giai đoạn 4 - Data & Sync Layer.
 */
async function syncPendingProjects() {
  const { setSyncing } = useAuthStore.getState();
  const unsynced = getUnsyncedProjects();
  if (unsynced.length === 0) return;

  setSyncing(true);
  let syncedCount = 0;

  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setSyncing(false);
      return;
    }

    for (const project of unsynced) {
      try {
        await api.post('/sync/project', {
          sessionId: project.session_id,
          name: project.name,
          status: project.status,
          inputData: project.input_data,
          resultData: project.result_data,
          createdAt: project.created_at,
        });
        markProjectSynced(project.session_id);
        syncedCount++;
      } catch (err: any) {
        // ✅ Nếu server trả 401 (Token hết hạn) → KHÔNG xóa SQLite
        // Chỉ thông báo cho user → giữ nguyên dữ liệu cục bộ
        if (err.response?.status === 401) {
          Alert.alert(
            'Phiên đăng nhập hết hạn',
            'Vui lòng đăng nhập lại để đồng bộ dữ liệu. Dữ liệu cục bộ của bạn vẫn được giữ nguyên.',
            [{ text: 'OK' }]
          );
          break; // Dừng sync, không tiếp tục
        }
        // Lỗi khác (mất mạng giữa chừng...) → bỏ qua dự án này, thử lần sau
        console.warn(`Sync failed for project ${project.session_id}:`, err.message);
      }
    }
  } finally {
    setSyncing(false);
    if (syncedCount > 0) {
      console.log(`✅ Đã đồng bộ ${syncedCount}/${unsynced.length} dự án lên server.`);
    }
  }
}

// ─── Đồng bộ hàng đợi xóa (Delete Queue) ────────────────────────────────────

/**
 * Xử lý Delete Queue: gửi lệnh xóa lên Cloud cho các project đã bị xóa cục bộ.
 */
async function syncDeleteQueue() {
  const deleteQueue = getDeleteQueue();
  if (deleteQueue.length === 0) return;

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return;

  for (const sessionId of deleteQueue) {
    try {
      await api.delete(`/sync/project/${sessionId}`);
      removeFromDeleteQueue(sessionId);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Server đã xóa rồi (hoặc không tồn tại) → xóa khỏi queue
        removeFromDeleteQueue(sessionId);
      } else {
        console.warn(`Delete sync failed for ${sessionId}:`, err.message);
      }
    }
  }
}

// ─── Full Sync: Push + Delete ─────────────────────────────────────────────────

/**
 * Chạy cả 2 luồng đồng bộ: push dữ liệu mới + xóa dữ liệu cũ.
 */
export async function runFullSync() {
  await syncPendingProjects();
  await syncDeleteQueue();
}

// ─── Listener NetInfo ─────────────────────────────────────────────────────────

/**
 * Khởi động listener NetInfo — tự động đồng bộ khi có mạng trở lại.
 * Gọi hàm này 1 lần trong App.tsx hoặc useSyncEngine hook.
 */
export function startSyncListener() {
  return NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected && state.isInternetReachable;
    if (isConnected) {
      runFullSync();
    }
  });
}
