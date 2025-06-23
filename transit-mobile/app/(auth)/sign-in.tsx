import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/utils/api';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with email:', email);
      const response = await api.post('/users/login', { email, password });
      console.log('Login response received:', response.data);
      
      if (response.data.token) {
        await login(response.data.token);
        router.replace('/home' as any);
      } else {
        Alert.alert('Error', 'No token received from server');
      }
    } catch (error: any) {
      console.error('Login request failed:', error.response?.data || error.message);
      Alert.alert(
        'Login Failed', 
        error.response?.data?.message || 'Failed to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up' as any);
  };

  const handleForgotPassword = () => {
    Alert.alert('Coming Soon', 'Password recovery feature will be available soon!');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-8 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center shadow-sm"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#E5E7EB" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-6 py-8">
            {/* Logo/Title */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="transit-connection-variant" size={40} color="white" />
              </View>
              <Text className="text-3xl font-bold text-text mb-2">Welcome Back</Text>
              <Text className="text-subtext text-center">
                Sign in to access your transit cards and personalized features
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-text font-medium mb-2">Email Address</Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 shadow-sm border border-surface/60">
                  <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-text"
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-text font-medium mb-2">Password</Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 shadow-sm border border-surface/60">
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-text"
                    placeholder="Enter your password"
                    placeholderTextColor="#6B7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Forgot Password */}
              <Pressable onPress={handleForgotPassword} className="self-end">
                <Text className="text-primary font-medium">Forgot Password?</Text>
              </Pressable>

              {/* Sign In Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                className={`bg-primary rounded-xl py-4 items-center mt-6 ${
                  loading ? 'opacity-50' : ''
                }`}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="loading" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Signing In...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-lg">Sign In</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-surface/60" />
                <Text className="mx-4 text-subtext">or</Text>
                <View className="flex-1 h-px bg-surface/60" />
              </View>

              {/* Sign Up Link */}
              <View className="flex-row justify-center">
                <Text className="text-subtext">Don't have an account? </Text>
                <Pressable onPress={handleSignUp}>
                  <Text className="text-primary font-medium">Sign Up</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="px-6 pb-6">
            <Text className="text-center text-subtext text-sm">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 