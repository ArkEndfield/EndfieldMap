import { LanguageSetting } from '@/components/common/settings/items/display/language';
import { UISetting } from '@/components/common/settings/items/display/ui';
import { ThemeSetting } from '@/components/common/settings/items/display/theme';

export const DisplaySettings = () => {
  return (
    <div className="space-y-4">
      <LanguageSetting />
      <UISetting />
      <ThemeSetting />
    </div>
  );
};
