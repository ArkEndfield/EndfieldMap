import React from 'react';
import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/utils/style';

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function StyledTextInput({ label, error, style, ...props }: StyledTextInputProps) {
  return (
    <View className="mb-3">
      {label ? <Text className="mb-1.5 text-sm font-medium text-text-secondary">{label}</Text> : null}
      <RNTextInput
        className={cn(
          'rounded-lg border bg-bg-primary px-4 py-3 text-base text-text-primary',
          error ? 'border-error' : 'border-border',
        )}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        style={style}
        {...props}
      />
      {error ? <Text className="mt-1 text-xs text-error">{error}</Text> : null}
    </View>
  );
}
