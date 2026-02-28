import type { ElectricPoleType } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { EndfieldSelect } from '@endfieldmap/web-components';
import { useMemo, useState } from 'react';

import { Input } from '@/components/common/input';

interface SharePresetFormProps {
  defaultName?: string;
  defaultType?: ElectricPoleType;
  defaultDescription?: string;
  onNameChange?: (value: string) => void;
  onTypeChange?: (value: ElectricPoleType) => void;
  onDescriptionChange?: (value: string) => void;
}

const SharePresetForm: React.FC<SharePresetFormProps> = ({
  defaultName,
  defaultType = 'pole',
  defaultDescription,
  onNameChange,
  onTypeChange,
  onDescriptionChange,
}) => {
  const { t } = useTranslation('sidebar');
  const [type, setType] = useState(defaultType);

  const typeOptions = useMemo(
    () => [
      { value: 'pole' as const, label: t('preset_store.sub_type.pole') },
      { value: 'zipline' as const, label: t('preset_store.sub_type.zipline') },
    ],
    [t]
  );

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-y-3">
      <div className="text-xs text-[#a0a2a3] mr-2">{t('preset_store.type')}</div>
      <EndfieldSelect
        className="text-sm w-32"
        classNames={{
          trigger: 'py-1.5',
        }}
        options={typeOptions}
        value={type}
        onChange={(value) => {
          setType(value);
          onTypeChange?.(value);
        }}
      />
      <div className="text-xs text-[#a0a2a3] mr-2">{t('preset_store.edit_form.name')}</div>
      <Input defaultValue={defaultName} onValueChange={onNameChange} />
      <div className="text-xs text-[#a0a2a3] mr-2">{t('preset_store.edit_form.description')}</div>
      <Input defaultValue={defaultDescription} onValueChange={onDescriptionChange} inputType="textarea" rows={3} />
    </div>
  );
};

export default SharePresetForm;
