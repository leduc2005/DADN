import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { api } from '../services/api';

export default function VerifyCodeScreen({ navigation, route }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || '';

  const handleVerify = async () => {
    if (code.length !== 6) return Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 chữ số');
    setLoading(true);
    try {
      // ✅ Gọi API thật — server kiểm tra OTP với DB có thời hạn 10 phút
      await api.post('/auth/verify-code', { email, code });
      navigation.navigate('ResetPassword', { email });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Đã gửi lại', 'Mã OTP mới đã được gửi đến email của bạn!');
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi lại mã. Thử lại sau.');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#475569" />
          </TouchableOpacity>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <ShieldCheck size={32} color="#1976D2" />
            </View>
            <Text style={styles.title}>Verify Identity</Text>
            <Text style={styles.subtitle}>We've sent a 6-digit code to your email.</Text>
          </View>
          <View style={styles.formContainer}>
            <TextInput
                style={styles.otpInput}
                placeholder="------"
                placeholderTextColor="#cbd5e1"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
            />
            <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend}><Text style={styles.resendLink}>Resend</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 32 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: '500', textAlign: 'center', paddingHorizontal: 16 },
  formContainer: { width: '100%', gap: 24 },
  otpInput: { width: '100%', paddingVertical: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b', fontSize: 32, fontWeight: 'bold', textAlign: 'center', letterSpacing: 10 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: -8 },
  resendText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  resendLink: { fontSize: 14, color: '#1976D2', fontWeight: 'bold' },
  actionButton: { width: '100%', backgroundColor: '#1976D2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
