import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail } from 'lucide-react-native';
import { api } from '../services/request';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');

  const handleSendCode = async () => {
    if (!email) return Alert.alert('Lỗi', 'Vui lòng nhập thư điện tử email');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      Alert.alert('Thành công', response.data.message);
      // Demo truyền email sang màn hình xác minh
      navigation.navigate('VerifyCode', { email });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không tìm thấy tài khoản');
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
              <Mail size={32} color="#1976D2" />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your university email to receive a 6-digit reset code.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="University Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleSendCode}>
              <Text style={styles.actionButtonText}>Send Code</Text>
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
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  input: { width: '100%', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b', fontSize: 14, fontWeight: '500' },
  actionButton: { width: '100%', backgroundColor: '#1976D2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
