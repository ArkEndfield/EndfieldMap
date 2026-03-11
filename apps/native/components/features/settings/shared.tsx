import { cn } from '@endfieldmap/tools';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </Text>
      <View className="rounded-xl bg-bg-primary">{children}</View>
    </View>
  );
}

export function SettingRow({
  title,
  description,
  children,
  last,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-3',
        !last && 'border-b border-border',
      )}
    >
      <View className="mr-3 flex-1">
        <Text className="text-[15px] text-text-primary">{title}</Text>
        {description ? (
          <Text className="mt-0.5 text-xs text-text-muted">{description}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function ActionButton({
  label,
  loading,
  disabled,
  variant = 'default',
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  variant?: 'default' | 'danger';
  onPress: () => void;
}) {
  const isDanger = variant === 'danger';
  return (
    <Pressable
      className={cn(
        'shrink-0 rounded-lg px-3 py-1.5',
        isDanger ? 'bg-error/15' : 'bg-primary/10',
        disabled && !loading && 'opacity-40',
      )}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDanger ? '#ef4444' : '#007AFF'} />
      ) : (
        <Text className={cn('text-xs font-semibold', isDanger ? 'text-error' : 'text-primary')}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
