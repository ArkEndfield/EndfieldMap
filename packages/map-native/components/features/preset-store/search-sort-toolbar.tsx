import type { PresetStoreSearchOptions } from '@endfieldmap/map-service';
import { debounce } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export interface SearchSortToolbarProps {
  onSearchChange: (keyword: string) => void;
  sortBy: PresetStoreSearchOptions['sortBy'];
  onSortByChange: (sortBy: PresetStoreSearchOptions['sortBy']) => void;
  sortOrder: PresetStoreSearchOptions['sortOrder'];
  onSortOrderChange: (order: PresetStoreSearchOptions['sortOrder']) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  debounceDelay?: number;
}

const SORT_BY_OPTIONS: { value: NonNullable<PresetStoreSearchOptions['sortBy']>; labelKey: string }[] = [
  { value: 'like_count', labelKey: 'common:sort.like_count' },
  { value: 'created_at', labelKey: 'common:sort.created_at' },
];

export const SearchSortToolbar = React.memo(function SearchSortToolbar({
  onSearchChange,
  sortBy = 'like_count',
  onSortByChange,
  sortOrder = 'desc',
  onSortOrderChange,
  onRefresh,
  isLoading = false,
  debounceDelay = 500,
}: SearchSortToolbarProps) {
  const { t } = useTranslation(['common']);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const debouncedSearchRef = useRef<ReturnType<typeof debounce<[string], void>> | null>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce((keyword: string) => {
      onSearchChange(keyword);
    }, debounceDelay);
  }, [onSearchChange, debounceDelay]);

  const handleValueChange = useCallback((value: string) => {
    debouncedSearchRef.current?.(value);
  }, []);

  const toggleSortOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  const handleSortBySelect = useCallback(
    (value: NonNullable<PresetStoreSearchOptions['sortBy']>) => {
      onSortByChange(value);
      setShowSortMenu(false);
    },
    [onSortByChange],
  );

  const currentSortLabel = useMemo(() => {
    const option = SORT_BY_OPTIONS.find((o) => o.value === sortBy);
    if (!option) return '';
    return t(option.labelKey, {
      defaultValue: option.value === 'like_count' ? '热度' : '时间',
    });
  }, [sortBy, t]);

  return (
    <View className="flex-row items-center gap-2 px-3 py-2">
      {/* Search input */}
      <View className="flex-1 flex-row items-center rounded-lg border border-border-default bg-bg-primary px-3 py-1.5">
        <MaterialIcons name="search" size={16} color="#999" />
        <TextInput
          className="ml-1.5 flex-1 py-0 text-sm text-text-primary"
          placeholder={t('common:search_placeholder', { defaultValue: '搜索...' })}
          placeholderTextColor="#999"
          onChangeText={handleValueChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Sort selector */}
      <View className="relative">
        <Pressable
          className="flex-row items-center rounded-lg border border-border-default bg-bg-primary px-2.5 py-2"
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text className="text-xs text-text-secondary">{currentSortLabel}</Text>
          <MaterialIcons name="arrow-drop-down" size={16} color="#666" />
        </Pressable>

        {/* Dropdown */}
        {showSortMenu && (
          <View className="absolute right-0 top-10 z-50 min-w-[80px] rounded-lg border border-border-default bg-bg-primary shadow-md shadow-black/10 elevation-4">
            {SORT_BY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                className="px-3 py-2.5"
                onPress={() => handleSortBySelect(option.value)}
              >
                <Text
                  className={
                    option.value === sortBy
                      ? 'text-xs font-semibold text-primary'
                      : 'text-xs text-text-secondary'
                  }
                >
                  {t(option.labelKey, {
                    defaultValue: option.value === 'like_count' ? '热度' : '时间',
                  })}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Sort order toggle */}
      <Pressable
        className="items-center justify-center rounded-lg border border-border-default bg-bg-primary p-2"
        onPress={toggleSortOrder}
      >
        <MaterialIcons
          name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
          size={16}
          color="#666"
        />
      </Pressable>

      {/* Refresh button */}
      {onRefresh && (
        <Pressable
          className="items-center justify-center rounded-lg border border-border-default bg-bg-primary p-2"
          onPress={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size={16} color="#007AFF" />
          ) : (
            <MaterialIcons name="refresh" size={16} color="#666" />
          )}
        </Pressable>
      )}
    </View>
  );
});
