import { MenuListForPC } from '@themes/endfield/menus/left';
import { RightMenu } from '@themes/endfield/menus/right';

import { cn } from '@/utils/style';

export default function PCMenus() {
  return (
    <div
      className={cn(
        'fixed flex justify-start gap-8 text-white select-none z-10',
        'before:absolute before:-z-1 before:left-0 before:top-0 before:bottom-0 before:w-24 before:bg-linear-to-tr before:from-white/25 before:via-white/0 before:to-black/0',
        'after:absolute after:-z-1 after:left-0 after:right-6 after:bottom-0 after:h-1.5 after:bg-linear-to-r after:from-[#FDFA85]/0 after:via-[#FDFA85] after:to-[#FDFA85]',
        'w-full h-14 items-center left-0 top-0 bg-black/80 py-0 pl-5 pb-1.5 rounded-none'
      )}
    >
      <MenuListForPC />
      <div className="ml-auto">
        <RightMenu />
      </div>
      <div className="absolute bottom-0 right-4 border-[1.5px] border-[#FDFA85] h-2 w-1 border-l-0"></div>
    </div>
  );
}
