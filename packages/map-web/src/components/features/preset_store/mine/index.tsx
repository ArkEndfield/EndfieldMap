import type { PresetStoreResponseItem } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback } from 'react';

import { alert } from '@/components/common/alert/alert_api';
import { Pagination } from '@/components/common/pagination';
import { PresetStoreItem } from '@/components/common/preset_store/item';
import { ScrollArea } from '@endfieldmap/web-components';
import { EditPresetForm } from '@/components/features/preset_store/mine/edit_form';
import { MineFilters } from '@/components/features/preset_store/mine/mine_filters';
import { useMineStore } from '@/hooks/use_preset_store';

interface MineStoreProps {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

export const MineStore = observer(({ show, onOpen }: MineStoreProps) => {
  const { t } = useTranslation('sidebar');
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
    handleEdit,
  } = useMineStore({ show, onOpen });

  const isLoading =
    activeTab === 'uploads' ? uploadsPagination.loadStatus === 'loading' : favoritesPagination.loadStatus === 'loading';

  const openEditDialog = useCallback(
    (id: number) => {
      const item = uploadsPagination.displayData.find((i) => i.id === id);
      if (!item) return;

      let editName = item.name;
      let editDescription = item.description;
      let editIsPublic = item.is_public;

      alert.confirm({
        dismissible: false,
        keyboardCloseable: true,
        content: (
          <EditPresetForm
            defaultName={item.name}
            defaultDescription={item.description}
            defaultIsPublic={item.is_public}
            onNameChange={(value) => {
              editName = value;
            }}
            onDescriptionChange={(value) => {
              editDescription = value;
            }}
            onIsPublicChange={(value) => {
              editIsPublic = value;
            }}
          />
        ),
        onConfirm: async () => {
          const success = await handleEdit(id, {
            name: editName,
            description: editDescription,
            is_public: editIsPublic,
          });
          if (success) {
            alert.info(t('preset_store.edit_success'));
          }
          return success;
        },
      });
    },
    [uploadsPagination.displayData, handleEdit, t]
  );

  // 渲染上传列表项
  const renderUploadsItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <ScrollArea className="h-full" contentClassName="grid grid-cols-2 gap-4 md:grid-cols-3 auto-rows-min p-4">
        {items.map((item) => (
          <PresetStoreItem
            key={item.id}
            item={item}
            onOpen={handleOpen}
            onLike={handleLike}
            onDelete={handleDelete}
            onEdit={openEditDialog}
          />
        ))}
      </ScrollArea>
    ),
    [handleOpen, handleLike, handleDelete, openEditDialog]
  );

  // 渲染收藏列表项
  const renderFavoritesItems = useCallback(
    (items: PresetStoreResponseItem[]) => (
      <ScrollArea className="h-full" contentClassName="grid grid-cols-2 gap-4 md:grid-cols-3 auto-rows-min p-4">
        {items.map((item) => (
          <PresetStoreItem key={item.id} item={item} onOpen={handleOpen} onLike={handleLike} />
        ))}
      </ScrollArea>
    ),
    [handleOpen, handleLike]
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col overflow-hidden"
        >
          <MineFilters
            activeTab={activeTab}
            presetType={presetType}
            isLoading={isLoading}
            onTabChange={handleTabChange}
            onPresetTypeChange={setPresetType}
            onRefresh={handleRefresh}
          />

          {/* 我的上传 */}
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
              className="flex-1"
            />
          )}

          {/* 我的收藏 */}
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
              className="flex-1"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
