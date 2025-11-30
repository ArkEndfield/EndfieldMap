import { cn } from '@/utils/style';

import { menus } from './list';

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

const MenuListDeco = () => (
  <div
    className="absolute w-full h-full top-0 bg-[linear-gradient(-45deg,#3a3a3a_0,#3a3a3a_12.5%,#3a3a3a00_12.5%,#3a3a3a00_37.5%,#3a3a3a_37.5%,#3a3a3a_62.5%,#3a3a3a00_62.5%,#3a3a3a00_87.5%,#3a3a3a_87.5%,#3a3a3a_100%)] bg-repeat bg-size-[0.2em_0.2em]"
    style={{
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }}
  ></div>
);

export const MenuListForPC = () => {
  return (
    <div className="flex h-12.5 relative items-center">
      <MenuListDeco />
      {menus.map((Menu, index) => (
        <MenuContainer key={index} rightBorder={index !== menus.length - 1}>
          <Menu />
        </MenuContainer>
      ))}
    </div>
  );
};
