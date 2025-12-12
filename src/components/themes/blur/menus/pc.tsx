import { MapSelector } from '@themes/blur/menus/map_selector';
import { MenuList } from '@themes/blur/menus/menu_list';

import { HeaderLogo } from '@/components/common/header_logo';
import { cn } from '@/utils/style';

export default function PCMenus() {
  return (
    <>
      {/* Left - Logo with glassmorphism */}
      <div
        className={cn(
          'fixed left-3 top-3 z-10',
          'h-14 px-4 rounded-2xl',
          'flex items-center',
          'bg-black/40 backdrop-blur-2xl',
          'border border-white/20',
          'shadow-xl shadow-black/20'
        )}
      >
        <HeaderLogo className="w-24 h-auto" />
      </div>

      {/* Center - Menu items (each button has its own glassmorphism) */}
      <div className={cn('fixed left-1/2 top-3 z-10', 'h-14', 'flex items-center', 'transform -translate-x-1/2')}>
        <MenuList />
      </div>

      {/* Right - Map selector (button has its own glassmorphism) */}
      <div className={cn('fixed right-3 top-3 z-10', 'h-14', 'flex items-center')}>
        <MapSelector />
      </div>
    </>
  );
}
