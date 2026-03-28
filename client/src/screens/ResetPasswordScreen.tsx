import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { api } from '../services/api';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = route.params?.email;

  const handleReset = async () => {
    if (!password) return Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
    if (password !== confirmPassword) return Alert.alert('Lỗi', 'Mật khẩu không khớp!');
    try {
      const response = await api.post('/auth/reset-password', { email, newPassword: password });
      Alert.alert('Thành công', response.data.message);
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Lỗi Đổi Mật Khẩu', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('ForgotPassword')}>
            <ArrowLeft size={24} color="#475569" />
          </TouchableOpacity>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Lock size={32} color="#1976D2" />
            </View>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>Please enter a secure new password.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor="#94a3b8" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.actionButtonText}>Reset Password</Text>
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
  formContainer: { width: '100%', gap: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  passwordInput: { width: '100%', paddingLeft: 16, paddingRight: 48, paddingVertical: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b', fontSize: 14, fontWeight: '500' },
  eyeButton: { position: 'absolute', right: 0, height: '100%', justifyContent: 'center', paddingHorizontal: 16 },
  actionButton: { width: '100%', backgroundColor: '#1976D2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
