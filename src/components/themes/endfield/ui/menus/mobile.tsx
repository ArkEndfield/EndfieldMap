import { HeaderMenuFeedback } from '@themes/endfield/ui/menus/left/feedback';
import { HeaderMenuSettings } from '@themes/endfield/ui/menus/left/settings';
import { RightMenu } from '@themes/endfield/ui/menus/right';

import { cn } from '@/utils/style';

export default function MobileMenus() {
  return (
    <div
      className={cn('fixed top-0 left-0 right-0 flex items-center', 'bg-[#272727]/90 text-white', 'backdrop-blur-sm')}
    >
      <HeaderMenuFeedback />
      <RightMenu />
      <HeaderMenuSettings />
    </div>
  );
}
