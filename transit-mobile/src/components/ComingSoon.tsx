import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ComingSoonProps {
  title?: string;
  icon?: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Coming Soon",
  icon = "rocket-launch",
  description = "This feature is currently under development and will be available soon!"
}) => {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-6">
          <MaterialCommunityIcons
            name={icon as any}
            size={48}
            color="#3B82F6"
          />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-text mb-3 text-center">
          {title}
        </Text>

        {/* Description */}
        <Text className="text-subtext text-center text-lg leading-6 mb-8">
          {description}
        </Text>

        {/* Additional Info */}
        <View className="bg-primary/20 rounded-xl p-4 border border-primary/40">
          <Text className="text-primary font-medium text-center mb-1">
            Stay Tuned!
          </Text>
          <Text className="text-primary/80 text-sm text-center">
            We're working hard to bring you amazing new features.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ComingSoon; 