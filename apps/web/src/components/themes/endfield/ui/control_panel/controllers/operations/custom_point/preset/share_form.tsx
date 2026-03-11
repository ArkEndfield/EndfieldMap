import { Input } from '@/components/common/input';

interface SharePresetFormProps {
  defaultName?: string;
  defaultDescription?: string;
  onNameChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
}

const SharePresetForm: React.FC<SharePresetFormProps> = ({
  defaultName,
  defaultDescription,
  onNameChange,
  onDescriptionChange,
}) => {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-y-3">
      <div className="text-xs text-[#a0a2a3] mr-2">分享名称</div>
      <Input defaultValue={defaultName} onValueChange={onNameChange} />
      <div className="text-xs text-[#a0a2a3] mr-2">分享描述</div>
      <Input defaultValue={defaultDescription} onValueChange={onDescriptionChange} inputType="textarea" rows={3} />
    </div>
  );
};

export default SharePresetForm;
