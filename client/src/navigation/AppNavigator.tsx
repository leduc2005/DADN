import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import InputScreen from '../screens/InputScreen';
import MotorSelectionScreen from '../screens/MotorSelectionScreen';
import KinematicResultsScreen from '../screens/KinematicResultsScreen';
import BeltCalculationScreen from '../screens/BeltCalculationScreen';
import GearCalculationScreen from '../screens/GearCalculationScreen';
import { useSyncEngine } from '../hooks/useSyncEngine';
import GlobalChatbot from '../components/GlobalChatbot';

const Stack = createStackNavigator();

export default function AppNavigator() {
  useSyncEngine(); // <-- Kích hoạt Module 3: Offline-First Sync Engine

  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState('Login');

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const route = navigationRef.getCurrentRoute();
          if (route) setCurrentRoute(route.name);
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Input" component={InputScreen} />
          <Stack.Screen name="MotorSelection" component={MotorSelectionScreen} />
          <Stack.Screen name="KinematicResults" component={KinematicResultsScreen} />
          <Stack.Screen name="BeltCalculation" component={BeltCalculationScreen} />
          <Stack.Screen name="GearCalculation" component={GearCalculationScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Chatbot nổi trên toàn bộ App, tự ẩn trên màn hình Auth */}
      <GlobalChatbot currentRoute={currentRoute} />
    </View>
  );
}

