import { MapSelector } from '@themes/blur/menus/map_selector';
import { HeaderMenuFeedback } from '@themes/blur/menus/menu_items/feedback';
import { HeaderMenuSettings } from '@themes/blur/menus/menu_items/settings';

import { cn } from '@/utils/style';

export default function MobileMenus() {
  return (
    <div className={cn('fixed top-0 left-0 right-0 flex items-center gap-3 px-2 h-14', 'text-white z-10')}>
      {/* Left - Feedback (with glassmorphism) */}
      <HeaderMenuFeedback />

      {/* Center - Map Selector (flex-1 to take remaining space, with glassmorphism) */}
      <div className="flex-1 flex justify-center">
        <MapSelector />
      </div>

      {/* Right - Settings (with glassmorphism) */}
      <HeaderMenuSettings />
    </div>
  );
}
