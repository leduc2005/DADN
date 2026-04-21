import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FolderGit2, Plus, LogOut, Cloud, CloudOff, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { clearAuthFromSecureStore } from '../hooks/useAuthBootstrap';
import { getAllProjects } from '../database/sqlite';

export default function HomeScreen({ navigation }: any) {
  const { user, logout, isSyncing } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);

  // Tải lại dự án từ SQLite mỗi khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      const loadProjects = () => {
        const data = getAllProjects();
        setProjects(data);
      };
      loadProjects();
    }, [])
  );

  const handleLogout = async () => {
    await clearAuthFromSecureStore();
    logout();
  };

  const renderProjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <FolderGit2 size={24} color="#1976D2" />
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectDate}>Tạo lúc: {new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
        </View>
        <View style={styles.syncStatus}>
          {item.is_synced ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : (
             <CloudOff size={20} color="#64748b" /> // Cloud gạch chéo báo hiệu lưu cục bộ
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.username}>{user?.name || 'Kỹ sư Cơ khí'}</Text>
        </View>
        
        <View style={styles.headerRight}>
             {/* Icon Đồng bộ ngầm */}
             {isSyncing ? (
                 <ActivityIndicator size="small" color="#1976D2" style={{ marginRight: 16 }} />
             ) : (
                 <Cloud size={24} color="#64748b" style={{ marginRight: 16 }} />
             )}

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={24} color="#ef4444" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Bài toán của bạn</Text>
        
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có bài toán nào. Hãy tạo mới!</Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProjectItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('InputScreen')}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  greeting: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  username: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 16 },
  listContent: { paddingBottom: 20 },
  projectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  projectHeader: { flexDirection: 'row', alignItems: 'center' },
  projectInfo: { flex: 1, marginLeft: 16 },
  projectName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  projectDate: { fontSize: 12, color: '#64748b' },
  syncStatus: { marginLeft: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
