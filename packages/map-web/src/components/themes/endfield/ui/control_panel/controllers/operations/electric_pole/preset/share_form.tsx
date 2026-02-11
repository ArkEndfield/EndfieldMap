import type { ElectricPoleType } from '@eftypes/preset_store';
import { useState } from 'react';

import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { Input } from '@/components/common/input';

interface SharePresetFormProps {
  defaultName?: string;
  defaultType?: ElectricPoleType;
  defaultDescription?: string;
  onNameChange?: (value: string) => void;
  onTypeChange?: (value: ElectricPoleType) => void;
  onDescriptionChange?: (value: string) => void;
}

const typeOptions = [
  { value: 'pole' as const, label: '电线杆' },
  { value: 'zipline' as const, label: '滑索' },
];

const SharePresetForm: React.FC<SharePresetFormProps> = ({
  defaultName,
  defaultType = 'pole',
  defaultDescription,
  onNameChange,
  onTypeChange,
  onDescriptionChange,
}) => {
  const [type, setType] = useState(defaultType);

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-y-3">
      <div className="text-xs text-[#a0a2a3] mr-2">电线杆类型</div>
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
      <div className="text-xs text-[#a0a2a3] mr-2">分享名称</div>
      <Input defaultValue={defaultName} onValueChange={onNameChange} />
      <div className="text-xs text-[#a0a2a3] mr-2">分享描述</div>
      <Input defaultValue={defaultDescription} onValueChange={onDescriptionChange} inputType="textarea" rows={3} />
    </div>
  );
};

export default SharePresetForm;
