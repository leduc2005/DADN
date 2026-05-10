import { useEffect, useRef } from 'react';
import { startSyncListener, runFullSync } from '../services/api_sync';
import { initDatabase } from '../database/sqlite';

/**
 * useSyncEngine - Custom Hook (Trái tim đồng bộ)
 *
 * Chức năng:
 * 1. Khởi tạo SQLite Database khi App khởi động.
 * 2. Chạy Full Sync ngay lập tức (push + delete).
 * 3. Lắng nghe NetInfo — tự động sync khi có mạng trở lại.
 *
 * Tuân thủ "Luật thép": Hook này KHÔNG chứa logic UI,
 * chỉ quản lý vòng đời đồng bộ dữ liệu.
 *
 * Gọi 1 lần duy nhất tại App.tsx hoặc AppNavigator.
 */
export function useSyncEngine() {
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Bước 1: Khởi tạo bảng SQLite
    try {
      initDatabase();
    } catch (e) {
      console.error('[SyncEngine] Lỗi khởi tạo SQLite:', e);
    }

    // Bước 2: Sync ngay lập tức khi App mở
    runFullSync().catch((e) =>
      console.warn('[SyncEngine] Initial sync failed:', e)
    );

    // Bước 3: Lắng nghe mạng — auto sync khi có kết nối
    const unsubscribe = startSyncListener();
    listenerRef.current = unsubscribe;

    // Cleanup khi component unmount
    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, []);
}
