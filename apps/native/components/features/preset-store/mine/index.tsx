import type { PresetStoreResponseItem } from '@endfieldmap/map-service';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router/react-navigation';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Pagination } from '@/components/features/preset-store/pagination';
import { PresetStoreItem } from '@/components/features/preset-store/preset-store-item';
import { alertApi } from '@/components/ui/alert';
import { useMineStore } from '@/hooks/use-preset-store';

import { MineFilters } from './mine-filters';

interface MineStoreProps {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

export const MineStore = observer(function MineStore({ show, onOpen }: MineStoreProps) {
  const { t } = useTranslation('sidebar');
  const router = useRouter();
  const navigation = useNavigation();
  const {
    activeTab,
    presetType,
    uploadsPagination,
    favoritesPagination,
    setPresetType,
    handleTabChange,
    handleOpen,
    handleDelete,
    handleLike,
    handleRefresh,
  } = useMineStore({ show, onOpen });

  const isLoading =
    activeTab === 'uploads'
      ? uploadsPagination.loadStatus === 'loading'
      : favoritesPagination.loadStatus === 'loading';

  // Refresh data when returning from edit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (show && uploadsPagination.loadStatus === 'success') {
        uploadsPagination.load(uploadsPagination.currentPage);
      }
    });
    return unsubscribe;
  }, [navigation, show, uploadsPagination]);

  const openEditScreen = useCallback(
    (id: number) => {
      const item = uploadsPagination.displayData.find((i) => i.id === id);
      if (!item) return;

      router.push({
        pathname: '/preset-store-edit',
        params: {
          id: String(item.id),
          name: item.name,
          description: item.description,
          is_public: String(item.is_public),
        },
      });
    },
    [uploadsPagination.displayData, router],
  );

  const confirmDelete = useCallback(
    (id: number) => {
      alertApi.confirm({
        content: t('preset_store.delete_confirm', { defaultValue: '确定删除该预设吗？' }),
        onConfirm: async () => {
          await handleDelete(id);
        },
      });
    },
    [handleDelete, t],
  );

  const renderUploadsItem = useCallback(
    ({ item }: { item: PresetStoreResponseItem }) => (
      <PresetStoreItem
        item={item}
        onOpen={handleOpen}
        onLike={handleLike}
        onDelete={confirmDelete}
        onEdit={openEditScreen}
      />
    ),
    [handleOpen, handleLike, confirmDelete, openEditScreen],
  );

  const renderFavoritesItem = useCallback(
    ({ item }: { item: PresetStoreResponseItem }) => (
      <PresetStoreItem item={item} onOpen={handleOpen} onLike={handleLike} />
    ),
    [handleOpen, handleLike],
  );

  const renderUploadsItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <FlatList
        data={items}
        renderItem={renderUploadsItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperClassName="gap-3 px-3"
        contentContainerClassName="gap-3 pb-2 pt-1"
        showsVerticalScrollIndicator={false}
      />
    ),
    [renderUploadsItem],
  );

  const renderFavoritesItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <FlatList
        data={items}
        renderItem={renderFavoritesItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperClassName="gap-3 px-3"
        contentContainerClassName="gap-3 pb-2 pt-1"
        showsVerticalScrollIndicator={false}
      />
    ),
    [renderFavoritesItem],
  );

  return (
    <View className="flex-1">
      <MineFilters
        activeTab={activeTab}
        presetType={presetType}
        isLoading={isLoading}
        onTabChange={handleTabChange}
        onPresetTypeChange={setPresetType}
        onRefresh={handleRefresh}
      />

      {activeTab === 'uploads' && (
        <Pagination
          data={uploadsPagination.displayData}
          currentPage={uploadsPagination.currentPage}
          totalPages={uploadsPagination.totalPages}
          loadStatus={uploadsPagination.loadStatus}
          errorMessage={uploadsPagination.errorMessage}
          onLoad={uploadsPagination.load}
          onRetry={uploadsPagination.retry}
          renderItem={renderUploadsItems}
        />
      )}

      {activeTab === 'favorites' && (
        <Pagination
          data={favoritesPagination.displayData}
          currentPage={favoritesPagination.currentPage}
          totalPages={favoritesPagination.totalPages}
          loadStatus={favoritesPagination.loadStatus}
          errorMessage={favoritesPagination.errorMessage}
          onLoad={favoritesPagination.load}
          onRetry={favoritesPagination.retry}
          renderItem={renderFavoritesItems}
        />
      )}
    </View>
  );
});
