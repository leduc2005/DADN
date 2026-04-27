import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import InputScreen from '../screens/InputScreen';
import HomeScreen from '../screens/HomeScreen';
import MotorSelectionScreen from '../screens/MotorSelectionScreen';

import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator();

export default function AppNavigator() {
  // ✅ Chạy 1 lần khi App khởi động — kiểm tra token trong SecureStore
  useAuthBootstrap();

  const { isAuthenticated, isBootstrapping } = useAuthStore();

  // Đang kiểm tra token → hiện spinner loading
  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* ✅ Offline-First: Nếu đã có token hợp lệ → vào thẳng HomeScreen (Dashboard) */}
        {isAuthenticated ? (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="InputScreen" component={InputScreen} />
            <Stack.Screen name="MotorSelection" component={MotorSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="InputScreen" component={InputScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
