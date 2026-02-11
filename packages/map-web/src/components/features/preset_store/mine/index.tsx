import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback } from 'react';

import type { PresetStoreResponseItem } from '@/@types/preset_store';
import { alert } from '@/components/common/alert/alert_api';
import { Pagination } from '@/components/common/pagination';
import { PresetStoreItem } from '@/components/common/preset_store/item';
import { ScrollArea } from '@/components/common/scroll_area';
import { useMineStore } from '@/hooks/use_preset_store';

import { EditPresetForm } from './edit_form';
import { MineFilters } from './mine_filters';

interface MineStoreProps {
  show: boolean;
  onOpen: (item: PresetStoreResponseItem) => void;
}

export const MineStore = observer(({ show, onOpen }: MineStoreProps) => {
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
    activeTab === 'uploads'
      ? uploadsPagination.loadStatus === 'loading'
      : favoritesPagination.loadStatus === 'loading';

  const openEditDialog = useCallback(
    (id: number) => {
      const item = uploadsPagination.displayData.find((i) => i.id === id);
      if (!item) return;

      let editName = item.name;
      let editDescription = item.description;
      let editIsPublic = item.is_public;

      alert.confirm({
        dismissible: false,
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
            alert.info('编辑成功');
          }
          return success;
        },
      });
    },
    [uploadsPagination.displayData, handleEdit]
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
