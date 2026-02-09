import { Input } from '@/components/common/input';

interface SharePresetFormProps {
  defaultName: string;
  onNameChange: (value: string) => void;
}

const SharePresetForm: React.FC<SharePresetFormProps> = ({ defaultName, onNameChange }) => {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-y-3">
      <div className="text-xs text-[#a0a2a3] mr-2">分享名称</div>
      <Input
        defaultValue={defaultName}
        onValueChange={onNameChange}
      />
    </div>
  );
};

export default SharePresetForm;
