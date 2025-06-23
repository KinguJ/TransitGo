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

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting registration with email:', email);
      const response = await api.post('/users', { name, email, password });
      console.log('Registration response received:', response.data);
      
      if (response.data.token) {
        await login(response.data.token);
        router.replace('/home' as any);
      } else {
        Alert.alert('Error', 'Registration successful but no token received');
      }
    } catch (error: any) {
      console.error('Registration request failed:', error.response?.data || error.message);
      Alert.alert(
        'Registration Failed', 
        error.response?.data?.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in' as any);
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
              <Text className="text-3xl font-bold text-text mb-2">Create Account</Text>
              <Text className="text-subtext text-center">
                Join TransitGo to manage your transit cards and get personalized features
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Name Input */}
              <View>
                <Text className="text-text font-medium mb-2">Full Name</Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 shadow-sm border border-surface/60">
                  <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-text"
                    placeholder="Enter your full name"
                    placeholderTextColor="#6B7280"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

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
                    placeholder="Create a password"
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
                <Text className="text-subtext text-sm mt-1">
                  Password must be at least 6 characters long
                </Text>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-text font-medium mb-2">Confirm Password</Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 shadow-sm border border-surface/60">
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-text"
                    placeholder="Confirm your password"
                    placeholderTextColor="#6B7280"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialCommunityIcons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSignUp}
                disabled={loading}
                className={`bg-primary rounded-xl py-4 items-center mt-6 ${
                  loading ? 'opacity-50' : ''
                }`}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="loading" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Creating Account...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-lg">Create Account</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-surface/60" />
                <Text className="mx-4 text-subtext">or</Text>
                <View className="flex-1 h-px bg-surface/60" />
              </View>

              {/* Sign In Link */}
              <View className="flex-row justify-center">
                <Text className="text-subtext">Already have an account? </Text>
                <Pressable onPress={handleSignIn}>
                  <Text className="text-primary font-medium">Sign In</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="px-6 pb-6">
            <Text className="text-center text-subtext text-sm">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 