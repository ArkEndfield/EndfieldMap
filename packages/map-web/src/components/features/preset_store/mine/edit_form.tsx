import { useState } from 'react';
import { useTranslation } from '@endfieldmap/map-service';

import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { Input } from '@/components/common/input';

interface EditPresetFormProps {
  defaultName?: string;
  defaultDescription?: string;
  defaultIsPublic?: boolean;
  onNameChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onIsPublicChange?: (value: boolean) => void;
}

export const EditPresetForm: React.FC<EditPresetFormProps> = ({
  defaultName,
  defaultDescription,
  defaultIsPublic = true,
  onNameChange,
  onDescriptionChange,
  onIsPublicChange,
}) => {
  const { t } = useTranslation(['sidebar', 'common']);
  const [isPublic, setIsPublic] = useState(defaultIsPublic);

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-y-3">
      <div className="text-xs text-[#a0a2a3] mr-2">
        {t('sidebar:preset_store.edit_form.name', { defaultValue: '名称' })}
      </div>
      <Input defaultValue={defaultName} onValueChange={onNameChange} />
      <div className="text-xs text-[#a0a2a3] mr-2">
        {t('sidebar:preset_store.edit_form.description', { defaultValue: '描述' })}
      </div>
      <Input defaultValue={defaultDescription} onValueChange={onDescriptionChange} inputType="textarea" rows={3} />
      <div className="text-xs text-[#a0a2a3] mr-2">
        {t('sidebar:preset_store.edit_form.is_public', { defaultValue: '公开' })}
      </div>
      <EndfieldSwitch
        checked={isPublic}
        onChange={(value) => {
          setIsPublic(value);
          onIsPublicChange?.(value);
        }}
        onText={t('common:yes', { defaultValue: '是' })}
        offText={t('common:no', { defaultValue: '否' })}
        className="w-32 text-xs"
      />
    </div>
  );
};
