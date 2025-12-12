import { HeaderMenuFeedback } from '@themes/blur/menus/menu_items/feedback';
import { HeaderMenuSettings } from '@themes/blur/menus/menu_items/settings';

import { cn } from '@/utils/style';

const menus = [HeaderMenuFeedback, HeaderMenuSettings];

export const MenuList = () => {
  return (
    <div className={cn('flex items-center gap-1')}>
      {menus.map((Menu, index) => (
        <Menu key={index} />
      ))}
    </div>
  );
};
