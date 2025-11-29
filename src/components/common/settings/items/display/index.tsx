import { LanguageSetting } from './language';
import { UISetting } from './ui';

export const DisplaySettings = () => {
  return (
    <div className="space-y-4">
      <LanguageSetting />
      <UISetting />
    </div>
  );
};
