import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, Plus, Trash2, Cloud, CloudOff } from 'lucide-react-native';
import { useProjectState, CalculationSession } from '../store/projectState';
import { getAllProjects, deleteProjectLocal, initDatabase } from '../database/sqlite';
import { runFullSync } from '../services/api_sync';
import { useFocusEffect } from '@react-navigation/native';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { savedSessions, setSavedSessions, removeSession, resetInputState } = useProjectState();

  // ── Load dữ liệu từ SQLite mỗi khi HomeScreen được focus ──
  useFocusEffect(
    useCallback(() => {
      try {
        initDatabase();
        const projects = getAllProjects();
        const sessions: CalculationSession[] = projects.map((p: any) => ({
          id: p.session_id,
          title: p.name,
          date: new Date(p.created_at).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          }),
          status: p.status === 'HOÀN THÀNH' ? 'HOÀN THÀNH' : 'ĐANG THỰC HIỆN',
          motorModel: p.input_data?.motorModel,
          motorPower: p.input_data?.motorPower,
          nDc: p.input_data?.nDc,
          uHop: p.input_data?.uHop,
          uNgoai: p.input_data?.uNgoai,
          beltResult: p.result_data?.beltResult,
          gearResult: p.result_data?.gearResult,
          systemTransmission: p.result_data?.systemTransmission,
          rawInputData: p.input_data?.rawInputData,
          // Metadata đồng bộ
          is_synced: p.is_synced,
        }));
        setSavedSessions(sessions);
      } catch (e) {
        console.error('Lỗi load dữ liệu từ SQLite:', e);
      }
    }, [])
  );

  const filtered = searchQuery.trim()
    ? savedSessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.motorModel?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedSessions;

  // ── Xử lý nhấn vào Card để xem lại ──
  const handleOpenSession = (item: CalculationSession) => {
    navigation.navigate('Input', { historySession: item });
  };

  // ── Xử lý xóa lịch sử ──
  const handleDeleteSession = (item: CalculationSession) => {
    Alert.alert(
      'Xóa bài toán',
      `Bạn có chắc muốn xóa "${item.title}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            try {
              deleteProjectLocal(item.id);
              removeSession(item.id);
              // Kích hoạt đồng bộ ngầm gửi lệnh xóa lên server
              runFullSync().catch(err => console.warn('Lỗi trigger sync xóa:', err));
            } catch (e) {
              console.error('Lỗi xóa bài toán:', e);
            }
          },
        },
      ]
    );
  };

  // ── Nút tạo bài toán mới ──
  const handleNewProject = () => {
    resetInputState();
    navigation.navigate('Input');
  };

  const renderItem = ({ item }: { item: CalculationSession & { is_synced?: boolean } }) => {
    const isDone = item.status === 'HOÀN THÀNH';
    const isSynced = (item as any).is_synced === true;

    return (
      <TouchableOpacity
        style={styles.projectCard}
        activeOpacity={0.7}
        onPress={() => handleOpenSession(item)}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.projectTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, isDone ? styles.badgeDone : styles.badgeInProgress]}>
            <Text style={[styles.statusText, isDone ? styles.textDone : styles.textInProgress]}>
              {isDone ? 'Hoàn thành' : 'Đang thực hiện'}
            </Text>
          </View>
        </View>
        <Text style={styles.projectDate}>{item.date}</Text>
        {item.motorModel && (
          <View style={styles.motorRow}>
            <Text style={styles.motorLabel}>Động cơ:</Text>
            <Text style={styles.motorValue}> {item.motorModel}</Text>
            {item.motorPower !== undefined && (
              <Text style={styles.motorMeta}> · {item.motorPower} kW</Text>
            )}
            {item.nDc !== undefined && (
              <Text style={styles.motorMeta}> · {item.nDc} v/ph</Text>
            )}
          </View>
        )}
        {item.beltResult && (
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Đai:</Text>
            <Text style={[styles.resultValue, item.beltResult.overall_pass ? styles.pass : styles.fail]}>
              {item.beltResult.overall_pass ? ' Đạt ✓' : ' Chưa đạt ✗'}
            </Text>
            {item.beltResult.section && (
              <Text style={styles.motorMeta}> · Tiết diện {item.beltResult.section}</Text>
            )}
          </View>
        )}
        {item.gearResult && (
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Bánh răng:</Text>
            <Text style={[styles.resultValue, item.gearResult.overall_pass ? styles.pass : styles.fail]}>
              {item.gearResult.overall_pass ? ' Đạt ✓' : ' Chưa đạt ✗'}
            </Text>
          </View>
        )}

        {/* Footer: Icon đồng bộ + Nút xóa */}
        <View style={styles.cardFooter}>
          <View style={styles.syncStatus}>
            {isSynced ? (
              <>
                <Cloud size={14} color="#059669" />
                <Text style={styles.syncedText}>Đã đồng bộ</Text>
              </>
            ) : (
              <>
                <CloudOff size={14} color="#9ca3af" />
                <Text style={styles.unsyncedText}>Chưa đồng bộ</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteSession(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trang chủ</Text>
          <Text style={styles.headerSub}>Thiết kế hệ thống truyền động</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, động cơ..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Summary Banner */}
      {savedSessions.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {savedSessions.length} phiên tính toán ·{' '}
            {savedSessions.filter((s) => s.status === 'HOÀN THÀNH').length} hoàn thành
          </Text>
        </View>
      )}

      {/* Session List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📐</Text>
          <Text style={styles.emptyTitle}>Chưa có tính toán nào</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn nút + bên dưới để bắt đầu nhập dữ liệu và thiết kế hệ thống truyền động mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewProject}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
  notificationButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 15, color: '#111827' },
  summaryBar: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#dbeafe',
  },
  summaryText: { fontSize: 13, color: '#1d4ed8', fontWeight: '500' },
  listContainer: { padding: 16, paddingBottom: 90 },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  projectTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, paddingRight: 8 },
  projectDate: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeDone: { backgroundColor: '#dcfce7' },
  badgeInProgress: { backgroundColor: '#dbeafe' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textDone: { color: '#15803d' },
  textInProgress: { color: '#1d4ed8' },
  motorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  motorLabel: { fontSize: 12, color: '#6b7280' },
  motorValue: { fontSize: 12, fontWeight: '600', color: '#374151' },
  motorMeta: { fontSize: 12, color: '#9ca3af' },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  resultLabel: { fontSize: 12, color: '#6b7280' },
  resultValue: { fontSize: 12, fontWeight: '700' },
  pass: { color: '#059669' },
  fail: { color: '#dc2626' },
  // ── Card Footer: Sync icon + Delete button ──
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  syncStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncedText: { fontSize: 11, color: '#059669', fontWeight: '500' },
  unsyncedText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ef4444', shadowOpacity: 0.3,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 80,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});
