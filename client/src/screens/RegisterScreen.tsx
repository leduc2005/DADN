import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, Eye, EyeOff } from 'lucide-react-native';
import { api } from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Cảnh báo', 'Vui lòng nhập đủ các trường!');
    if (password !== confirmPassword) return Alert.alert('Lỗi', 'Mật khẩu nhập lại không khớp!');
    if (!agreeTerms) return Alert.alert('Từ chối', 'Vui lòng đồng ý với các điều khoản.');

    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Tuyệt vời', 'Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.');
      navigation.goBack(); // Đẩy về màn hình đăng nhập
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.response?.data?.message || 'Máy chủ không phản hồi');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Top Section */}
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Settings size={28} color="#1976D2" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your drive system design today.</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity 
              style={styles.termsContainer} 
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
              <Text style={styles.loginButtonText}>Create Account</Text>
            </TouchableOpacity>

          </View>

          {/* Bottom Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: '500', textAlign: 'center', paddingHorizontal: 16 },
  formContainer: { width: '100%', gap: 16, flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  input: { width: '100%', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b', fontSize: 14, fontWeight: '500' },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  passwordInput: { width: '100%', paddingLeft: 16, paddingRight: 48, paddingVertical: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b', fontSize: 14, fontWeight: '500' },
  eyeButton: { position: 'absolute', right: 0, height: '100%', justifyContent: 'center', paddingHorizontal: 16 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  checkboxInner: { width: 10, height: 10, backgroundColor: '#ffffff', borderRadius: 2 },
  termsText: { fontSize: 14, fontWeight: '500', color: '#64748b', flex: 1 },
  termsLink: { color: '#1976D2' },
  loginButton: { width: '100%', backgroundColor: '#1976D2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, shadowColor: '#1976D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  footerLink: { fontSize: 14, fontWeight: 'bold', color: '#1976D2' }
});
