import { OperateList } from '@themes/endfield/ui/menus/center/operate_list';
import { MenuContainer } from '@themes/endfield/ui/menus/center/menu_container';

import { cn } from '@/utils/style';
import { menus } from '@themes/endfield/ui/menus/left/list';

const Menu = menus[1];

export default function MobileMenus() {
  return (
    <div
      className={cn(
        'fixed flex justify-start text-white select-none z-10 overflow-hidden',
        'w-full h-13 items-center left-0 top-0 bg-black/80 rounded-none pb-1'
      )}
    >
      <div className="absolute bottom-0 h-1 flex items-stretch left-4 right-4 bg-[#fffa00]" />
      <OperateList
        endContent={
          <MenuContainer>
            <Menu />
          </MenuContainer>
        }
      />
    </div>
  );
}
