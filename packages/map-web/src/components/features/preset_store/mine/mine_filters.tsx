import type { MineTab, PresetType } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { EndfieldToggle } from '@/components/common/endfield_components/form/toggle';
import { RefreshIcon } from '@/components/common/icons';
import { PRESET_TYPE_OPTIONS, TAB_OPTIONS } from '@/const/preset_store';

interface MineFiltersProps {
  activeTab: MineTab;
  presetType: PresetType;
  isLoading?: boolean;
  onTabChange: (tab: MineTab) => void;
  onPresetTypeChange: (type: PresetType) => void;
  onRefresh?: () => void;
}

export const MineFilters = ({
  activeTab,
  presetType,
  isLoading = false,
  onTabChange,
  onPresetTypeChange,
  onRefresh,
}: MineFiltersProps) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <>
      {/* Tab 切换 */}
      <div className="flex justify-center px-4 pt-3 pb-1 shrink-0">
        <EndfieldToggle
          className="w-48 text-xs"
          options={TAB_OPTIONS.map((opt) => ({
            key: opt.key,
            label: t(opt.labelKey, { defaultValue: opt.key === 'uploads' ? '我的上传' : '我的收藏' }),
          }))}
          activeKey={activeTab}
          onChange={onTabChange}
        />
      </div>

      {/* 预设类型筛选 */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <EndfieldToggle
          className="w-48 text-xs"
          options={PRESET_TYPE_OPTIONS.map((opt) => ({
            key: opt.key,
            label: t(opt.labelKey, { defaultValue: opt.key === 'electric_pole' ? '电线杆' : '自定义标点' }),
          }))}
          activeKey={presetType}
          onChange={onPresetTypeChange}
        />

        {/* 刷新按钮 */}
        {onRefresh && (
          <ZmdRoundIconButton
            onClick={onRefresh}
            disabled={isLoading}
            title={t('sidebar:operation.refresh', { defaultValue: '刷新' })}
          >
            <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
          </ZmdRoundIconButton>
        )}
      </div>
    </>
  );
};
