import { menus } from '@themes/endfield/menus/left/list';

import { cn } from '@/utils/style';

const MenuContainer = ({ children, rightBorder }: { children: React.ReactNode; rightBorder?: boolean }) => (
  <div
    className={cn(
      'relative px-4',
      rightBorder &&
        'after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-px after:h-3 after:bg-white/25'
    )}
  >
    {children}
  </div>
);

export const MenuListForPC = () => {
  return (
    <div className="flex h-full relative items-center">
      {menus.map((Menu, index) => (
        <MenuContainer key={index} rightBorder={index !== menus.length - 1}>
          <Menu />
        </MenuContainer>
      ))}
    </div>
  );
};
