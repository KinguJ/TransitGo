import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../src/context/AuthContext';
import { useDevClock } from '../src/context/ClockContext';
import { transitAPI } from '../src/utils/api';

interface MenuItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  isDanger?: boolean;
}

interface TransitCard {
  _id: string;
  name: string;
  cardNumber: string;
  balance: number;
  expiryDate: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, onPress, isDanger = false }) => (
  <Pressable
    className="bg-surface rounded-xl p-4 mb-3 shadow-sm border border-surface/60"
    onPress={onPress}
  >
    <View className="flex-row items-center">
      <View
        className={`w-10 h-10 rounded-lg items-center justify-center mr-4 ${
          isDanger ? 'bg-red-500/20' : 'bg-primary/20'
        }`}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={isDanger ? '#EF4444' : '#3B82F6'}
        />
      </View>
      
      <Text
        className={`flex-1 font-medium ${
          isDanger ? 'text-red-400' : 'text-text'
        }`}
      >
        {title}
      </Text>
      
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color="#9CA3AF"
      />
    </View>
  </Pressable>
);

const UserAvatar: React.FC<{ name: string; userId: string }> = ({ name, userId }) => {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Generate a color based on userId for consistent avatar colors
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
  ];
  const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <View
      className="w-20 h-20 rounded-full items-center justify-center"
      style={{ backgroundColor: avatarColor }}
    >
      <Text className="text-white text-xl font-bold">
        {initials}
      </Text>
    </View>
  );
};

const TransitCardComponent: React.FC<{ card: TransitCard; onEdit: (card: TransitCard) => void }> = ({ card, onEdit }) => {
  const formatCardNumber = (cardNumber: string) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const formatExpiryDate = (date: string) => {
    if (!date) return '';
    const expiryDate = new Date(date);
    return expiryDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <Pressable
      className="bg-surface rounded-xl shadow-md border border-surface/60 p-4 mb-4"
      onPress={() => onEdit(card)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-sm text-subtext mb-1">{card.name}</Text>
          <Text className="text-text font-mono text-sm">
            {formatCardNumber(card.cardNumber)}
          </Text>
        </View>
        <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="credit-card" size={20} color="#3B82F6" />
        </View>
      </View>
      
      <View className="border-t border-surface/40 pt-3 mt-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-subtext text-sm">Balance</Text>
          <Text className="text-xl font-bold text-text">₺{card.balance.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-subtext text-xs">Expires: {formatExpiryDate(card.expiryDate)}</Text>
          <View className="bg-green-500/20 px-2 py-1 rounded">
            <Text className="text-green-400 text-xs font-medium">Active</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const devTime = useDevClock();
  const [cards, setCards] = useState<TransitCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ show: boolean; card: TransitCard | null }>({ show: false, card: null });
  const [editForm, setEditForm] = useState({ name: '', topUpAmount: '' });
  const [updating, setUpdating] = useState(false);

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

  useEffect(() => {
    if (user) {
      fetchUserCards();
    }
  }, [user]);

  const fetchUserCards = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📱 Loading transit cards...');
      const response = await transitAPI.getCards();
      console.log('📱 Cards loaded:', response.data);
      setCards(response.data || []);
    } catch (error) {
      console.error('📱 Error loading cards:', error);
      setError('Failed to load cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = (card: TransitCard) => {
    setEditModal({ show: true, card });
    setEditForm({ name: card.name, topUpAmount: '' });
  };

  const handleSaveEdit = async () => {
    if (!editModal.card) return;

    try {
      setUpdating(true);
      setError(null);

      const updateData: any = {};
      
      // Only update name if it's different
      if (editForm.name !== editModal.card.name) {
        updateData.name = editForm.name;
      }

      // Only update balance if top-up amount is provided
      if (editForm.topUpAmount && parseFloat(editForm.topUpAmount) > 0) {
        updateData.balance = editModal.card.balance + parseFloat(editForm.topUpAmount);
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await transitAPI.updateCard(editModal.card._id, updateData);
        
        // Update the cards state with the new data
        setCards(prevCards => 
          prevCards.map(card => 
            card._id === editModal.card!._id ? response.data : card
          )
        );

        Alert.alert('Success', 'Card updated successfully!');
      }

      setEditModal({ show: false, card: null });
      setEditForm({ name: '', topUpAmount: '' });
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert('Error', 'Failed to update card. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModal({ show: false, card: null });
    setEditForm({ name: '', topUpAmount: '' });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleMenuPress = (item: string) => {
    // TODO: Navigate to actual screens when they're implemented
    Alert.alert('Coming Soon', `${item} feature will be available soon!`);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialCommunityIcons
            name="account-circle"
            size={80}
            color="#9CA3AF"
          />
          <Text className="text-xl font-semibold text-text mt-4 mb-2">
            Not Signed In
          </Text>
          <Text className="text-subtext text-center mb-6">
            Please sign in to view your profile and account settings.
          </Text>
          <Pressable
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => router.push('/(auth)/sign-in' as any)}
          >
            <Text className="text-white font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Unified Header - Same as Home */}
      <View className="bg-bg shadow-sm border-b border-surface/40">
        <View className="px-4 py-4">
          <View className="flex-row justify-between items-center">
            {/* Left: Hamburger Menu + Logo */}
            <View className="flex-row items-center">
              <Pressable
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                className="mr-4 p-2 -ml-2"
              >
                <MaterialCommunityIcons name="menu" size={24} color="#E5E7EB" />
              </Pressable>
              <Text className="text-xl font-bold text-primary">TransitGo</Text>
            </View>
            
            {/* Right: Location & Time */}
            <View className="flex-row items-center">
              <Badge>
                <MaterialCommunityIcons name="map-marker" size={16} color="#9CA3AF" />
                <Text className="ml-1 text-subtext font-medium text-sm">Elazığ</Text>
              </Badge>

              <View className="w-2" />

              <Badge>
                <View className="mr-2">
                  <Text className="text-xs text-subtext uppercase tracking-wide">Sim Time</Text>
                  <Text className="text-sm font-semibold text-text">
                    {devTime.toLocaleTimeString()}
                  </Text>
                </View>
              </Badge>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <View className="bg-surface border-b border-surface/40 px-6 py-8">
          <View className="items-center">
            <UserAvatar name={user.name} userId={user._id} />
            <Text className="text-2xl font-bold text-text mt-4">
              {user.name}
            </Text>
            <Text className="text-subtext mt-1">
              {user.email}
            </Text>
            <View className="bg-primary/20 px-3 py-1 rounded-full mt-2">
              <Text className="text-primary text-sm font-medium">
                ID: {user._id}
              </Text>
            </View>
          </View>
        </View>

        {/* Transit Cards Section */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-text mb-4">
            Your Transit Cards
          </Text>

          {loading ? (
            <View className="flex justify-center items-center py-8">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-subtext mt-2">Loading cards...</Text>
            </View>
          ) : error ? (
            <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-center font-medium">{error}</Text>
              <Pressable
                onPress={fetchUserCards}
                className="bg-red-500 px-4 py-2 rounded-lg mt-2"
              >
                <Text className="text-white text-center font-medium">Retry</Text>
              </Pressable>
            </View>
          ) : cards.length > 0 ? (
            cards.map((card) => (
              <TransitCardComponent
                key={card._id}
                card={card}
                onEdit={handleEditCard}
              />
            ))
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <MaterialCommunityIcons name="credit-card-plus" size={48} color="#6B7280" />
              <Text className="text-lg font-medium text-text mt-3">No Transit Cards</Text>
              <Text className="text-subtext text-center mt-2">
                Get your first transit card at any station or through the app
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-text mb-4">
            Account Settings
          </Text>

          <MenuItem
            icon="account-edit"
            title="My Informations"
            onPress={() => handleMenuPress('My Informations')}
          />

          <MenuItem
            icon="credit-card-multiple"
            title="My Financial Transactions"
            onPress={() => handleMenuPress('My Financial Transactions')}
          />

          <MenuItem
            icon="bug-report"
            title="My Issue Reports"
            onPress={() => handleMenuPress('My Issue Reports')}
          />

          <MenuItem
            icon="lock-reset"
            title="Change Password"
            onPress={() => handleMenuPress('Change Password')}
          />

          {/* Spacer */}
          <View className="h-4" />

          <MenuItem
            icon="logout"
            title="Logout"
            onPress={handleLogout}
            isDanger={true}
          />
        </View>

        {/* App Info */}
        <View className="px-4 pb-6">
          <View className="bg-surface/50 rounded-xl p-4">
            <Text className="text-center text-subtext text-sm">
              TransitGo Mobile App
            </Text>
            <Text className="text-center text-subtext text-xs mt-1">
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Card Modal */}
      <Modal
        visible={editModal.show}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-surface rounded-xl p-6 w-full max-w-md">
            <Text className="text-lg font-semibold text-text mb-4">Edit Card</Text>
            
            <View className="space-y-4">
              {/* Card Name */}
              <View>
                <Text className="text-sm font-medium text-text mb-2">
                  Card Name
                </Text>
                <TextInput
                  className="bg-bg border border-surface/60 rounded-lg px-3 py-3 text-text"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Enter card name"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Current Balance Display */}
              <View>
                <Text className="text-sm font-medium text-text mb-2">
                  Current Balance
                </Text>
                <View className="bg-bg border border-surface/60 rounded-lg px-3 py-3">
                  <Text className="text-text">
                    ₺{editModal.card?.balance?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>

              {/* Top Up Amount */}
              <View>
                <Text className="text-sm font-medium text-text mb-2">
                  Top Up Amount
                </Text>
                <TextInput
                  className="bg-bg border border-surface/60 rounded-lg px-3 py-3 text-text"
                  value={editForm.topUpAmount}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, topUpAmount: text }))}
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
                {editForm.topUpAmount && parseFloat(editForm.topUpAmount) > 0 && (
                  <Text className="text-sm text-green-400 mt-1">
                    New balance: ₺{((editModal.card?.balance || 0) + parseFloat(editForm.topUpAmount)).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {/* Modal Buttons */}
            <View className="flex-row justify-end space-x-3 mt-6">
              <Pressable
                onPress={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 bg-surface border border-surface/60 rounded-lg opacity-70"
              >
                <Text className="text-text font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={updating || (!editForm.name.trim() && !editForm.topUpAmount)}
                className={`px-4 py-2 bg-primary rounded-lg ${
                  (updating || (!editForm.name.trim() && !editForm.topUpAmount)) ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-white font-medium">
                  {updating ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 