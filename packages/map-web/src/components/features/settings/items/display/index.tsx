import { LanguageSetting } from '@/components/features/settings/items/display/language';
import { ThemeSetting } from '@/components/features/settings/items/display/theme';
import { UISetting } from '@/components/features/settings/items/display/ui';

export const DisplaySettings = () => {
  return (
    <div className="space-y-4">
      <LanguageSetting />
      <UISetting />
      <ThemeSetting />
    </div>
  );
};
