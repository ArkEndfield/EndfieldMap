import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';

import { type CustomPointMode, useCustomPointMode } from '@/hooks/use_custom_point_mode';
import { PlusIcon } from '@/components/common/icons';
import { CloseIcon } from '@/components/common/icons';
import { OperatorToggleButton } from '@themes/endfield/control_panel/controllers/operations/components/button';

export const CustomPointManagerToolbar = observer(() => {
  const { changeMode, getCurrentMode, toggleMode } = useCustomPointMode();
  const { t } = useTranslation('sidebar');
  const currentMode = getCurrentMode();
  // 配置按钮数据
  const tools: { key: CustomPointMode; label: string; icon: React.ReactNode }[] = [
    {
      key: 'isCreating',
      label: t('operation.custom_point.create.start'),
      icon: <PlusIcon />,
    },
    {
      key: 'isDeleting',
      label: t('operation.custom_point.delete.start'),
      icon: <CloseIcon />,
    },
  ];
  return (
    <div className="flex gap-1 px-1 shrink-0">
      {tools.map((tool) => (
        <OperatorToggleButton
          key={tool.key}
          label={tool.label}
          icon={tool.icon}
          isActive={currentMode === tool.key}
          onClick={() => changeMode(tool.key)}
          onActiveClick={() => toggleMode(tool.key)}
        />
      ))}
    </div>
  );
});
