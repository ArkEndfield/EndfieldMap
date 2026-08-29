import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View } from 'react-native';

interface UserAvatarProps {
  uri?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { container: 40, image: 36 },
  md: { container: 64, image: 58 },
  lg: { container: 88, image: 82 },
};

export function UserAvatar({ uri, size = 'md' }: UserAvatarProps) {
  const { container, image } = SIZE_MAP[size];
  const borderRadius = container / 2;

  return (
    <LinearGradient
      colors={['#01ffa2', '#FDFB73', '#ff1aac']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: container,
        height: container,
        borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: image,
          height: image,
          borderRadius: image / 2,
          overflow: 'hidden',
          backgroundColor: '#1a1a2e',
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: image, height: image }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: image,
              height: image,
              backgroundColor: '#2a2a4e',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: image * 0.4,
                height: image * 0.4,
                borderRadius: (image * 0.4) / 2,
                backgroundColor: '#555',
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: image * 0.6,
                height: image * 0.3,
                borderTopLeftRadius: image * 0.3,
                borderTopRightRadius: image * 0.3,
                backgroundColor: '#555',
              }}
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
