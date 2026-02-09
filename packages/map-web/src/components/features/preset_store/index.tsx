import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import type { PresetStoreTab } from '@/@types/preset_store';
import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { Dialog } from '@/components/common/dialog';
import { StoreIcon } from '@/components/common/icons';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const TAB_CONFIG: { key: PresetStoreTab; labelKey: string }[] = [
  { key: 'electric_pole', labelKey: 'sidebar:operation.electric_pole.preset.title' },
  { key: 'custom_point', labelKey: 'sidebar:operation.custom_point.preset.title' },
  { key: 'mine', labelKey: 'sidebar:preset_store_mine' },
];

/**
 * 统一预设商店组件
 * 通过 uiManager 控制显示和 tab 切换
 */
export const PresetStore: React.FC = observer(() => {
  const { t } = useTranslation(['sidebar']);
  const open = uiManager.presetStoreOpen;
  const activeTab = uiManager.presetStoreTab;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && uiManager.closePresetStore()}
      title={t('sidebar:preset_store')}
      icon={<StoreIcon />}
      onClose={() => uiManager.closePresetStore()}
    >
      <div className="flex flex-col h-full min-h-80">
        {/* Tab 导航栏 */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {TAB_CONFIG.map(({ key, labelKey }) => (
            <ButtonWithAudio
              key={key}
              className={cn(
                'flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative',
                activeTab === key ? 'text-[#363636] bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => uiManager.switchPresetStoreTab(key)}
            >
              {t(labelKey, {
                defaultValue: labelKey,
              })}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffff21]" />}
            </ButtonWithAudio>
          ))}
        </div>

        {/* Tab 内容区 */}
        <div className="flex-1 p-4">
          {activeTab === 'custom_point' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">{t('sidebar:operation.custom_point.preset.title')} - 功能开发中...</p>
            </div>
          )}
          {activeTab === 'electric_pole' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">{t('sidebar:operation.electric_pole.preset.title')} - 功能开发中...</p>
            </div>
          )}
          {activeTab === 'mine' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">{t('sidebar:preset_store_mine', { defaultValue: '我的' })} - 功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
});

export default PresetStore;
