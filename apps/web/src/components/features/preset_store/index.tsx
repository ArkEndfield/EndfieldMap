import type { PresetStoreTab } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, Dialog } from '@endfieldmap/web-components';
import { CustomPointIcon, ElectricPoleIconPole, LocationClusterIcon, StoreIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PresetStoreDetail } from '@/components/common/preset_store/detail';
import { CustomPointStore } from '@/components/features/preset_store/custom_point';
import { ElectricPoleStore } from '@/components/features/preset_store/electric_pole';
import { MineStore } from '@/components/features/preset_store/mine';
import uiManager from '@/services/ui_manager';

const TAB_CONFIG: { key: PresetStoreTab; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'electric_pole', labelKey: 'sidebar:operation.electric_pole.preset.title', icon: <ElectricPoleIconPole /> },
  { key: 'custom_point', labelKey: 'sidebar:operation.custom_point.preset.title', icon: <CustomPointIcon /> },
  { key: 'mine', labelKey: 'sidebar:preset_store.mine', icon: <LocationClusterIcon /> },
];

/**
 * 统一预设商店组件
 * 通过 uiManager 控制显示和 tab 切换
 */
export const PresetStore: React.FC = observer(() => {
  const { t } = useTranslation(['sidebar']);
  const open = uiManager.presetStoreOpen;
  const activeTab = uiManager.presetStoreTab;

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleOpen = (id: number) => {
    setSelectedId(id);
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  const handleClose = () => {
    setSelectedId(null);
    uiManager.closePresetStore();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      title={t('sidebar:preset_store.title')}
      icon={<StoreIcon />}
      onClose={handleClose}
      height="35rem"
      width="60rem"
    >
      <div className="flex flex-col overflow-hidden h-full w-full relative">
        {/* Tab 导航栏 */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {TAB_CONFIG.map(({ key, labelKey, icon }) => (
            <ButtonWithAudio
              key={key}
              className={cn(
                'flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5',
                activeTab === key ? 'text-[#363636] bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => uiManager.switchPresetStoreTab(key)}
            >
              {icon}
              {t(labelKey, {
                defaultValue: labelKey,
              })}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffff21]" />}
            </ButtonWithAudio>
          ))}
        </div>

        {/* Tab 内容区 */}
        <div className="flex-1 relative overflow-hidden">
          <ElectricPoleStore show={activeTab === 'electric_pole'} onOpen={(item) => handleOpen(item.id)} />
          <CustomPointStore show={activeTab === 'custom_point'} onOpen={(item) => handleOpen(item.id)} />
          <MineStore show={activeTab === 'mine'} onOpen={(item) => handleOpen(item.id)} />
        </div>

        {/* Detail overlay — covers tabs + content */}
        <AnimatePresence>
          {selectedId !== null && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.25, ease: [0.2, 1, 0.3, 1] }}
              className="absolute inset-0 bg-white z-10"
            >
              <PresetStoreDetail id={selectedId} onBack={handleBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
});

export default PresetStore;
