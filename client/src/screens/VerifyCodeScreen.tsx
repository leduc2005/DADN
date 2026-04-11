import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';

export default function VerifyCodeScreen({ navigation, route }: any) {
  const [code, setCode] = useState('');
  const email = route.params?.email || '';

  const handleVerify = () => {
    // API Check Mã OTP sẽ làm ở đây
    if (code === '123456') { // Mock tempCode theo cái backend viết lúc nãy
       navigation.navigate('ResetPassword', { email });
    } else {
       Alert.alert('Lỗi', 'Mã OTP không hợp lệ! (Thử gõ 123456 xem sao)');
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
                <TouchableOpacity><Text style={styles.resendLink}>Resend</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleVerify}>
              <Text style={styles.actionButtonText}>Verify</Text>
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
