import { LanguageSetting } from '@/components/common/settings/items/display/language';
import { UISetting } from '@/components/common/settings/items/display/ui';

export const DisplaySettings = () => {
  return (
    <div className="space-y-4">
      <LanguageSetting />
      <UISetting />
    </div>
  );
};
