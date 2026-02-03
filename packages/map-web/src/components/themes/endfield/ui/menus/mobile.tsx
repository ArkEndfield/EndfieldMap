import { MenuContainer } from '@themes/endfield/ui/menus/center/menu_container';
import { OperateList } from '@themes/endfield/ui/menus/center/operate_list';
import { menus } from '@themes/endfield/ui/menus/left/list';

import { cn } from '@/utils/style';

const SettingsMenu = menus[1];
const UserMenu = menus[2];

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
          <>
            <MenuContainer rightBorder>
              <SettingsMenu />
            </MenuContainer>
            <MenuContainer>
              <UserMenu />
            </MenuContainer>
          </>
        }
      />
    </div>
  );
}
