import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/sqlite';
import { startSyncListener } from './src/services/api_sync';

function App(): React.JSX.Element {
  useEffect(() => {
    // ✅ Giai đoạn 4: Khởi tạo SQLite cục bộ khi App mở
    initDatabase();

    // ✅ Giai đoạn 4: Bắt đầu lắng nghe NetInfo để tự đồng bộ khi có mạng
    const unsubscribe = startSyncListener();

    return () => {
      unsubscribe(); // Dọn dẹp khi App đóng
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
