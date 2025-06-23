import React from 'react';
import { View, Text } from 'react-native';
import { useDevClock } from '../context/ClockContext';

const DevClockOverlay: React.FC = () => {
  const devTime = useDevClock();

  return (
    <View className="absolute top-12 left-4 z-50 bg-black bg-opacity-70 px-2 py-1 rounded">
      <Text className="text-white text-xs font-mono">
        Dev: {devTime.toLocaleTimeString()}
      </Text>
    </View>
  );
};

export default DevClockOverlay; 