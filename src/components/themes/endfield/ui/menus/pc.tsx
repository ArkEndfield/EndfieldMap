import { MenuListForPC } from '@themes/endfield/ui/menus/left';

import { cn } from '@/utils/style';
import { OperateList } from '@themes/endfield/ui/menus/center/operate_list';
import { IconVersion } from '@themes/endfield/ui/menus/right/icon_version';

const Deco = ({ className, reverse }: { className?: string; reverse?: boolean }) => (
  <div
    className={cn(
      'w-full h-full top-0 ',
      'bg-[linear-gradient(-45deg,#3a3a3a_0,#3a3a3a_12.5%,#3a3a3a00_12.5%,#3a3a3a00_37.5%,#3a3a3a_37.5%,#3a3a3a_62.5%,#3a3a3a00_62.5%,#3a3a3a00_87.5%,#3a3a3a_87.5%,#3a3a3a_100%)]',
      'bg-repeat bg-size-[0.3em_0.3em]',
      reverse
        ? 'mask-[linear-gradient(to_left,black_40%,transparent)]'
        : 'mask-[linear-gradient(to_right,black_40%,transparent)]',
      className
    )}
  />
);

const Deco2 = () => {
  return (
    <div className="absolute bottom-0 h-1 flex items-stretch left-4 right-4">
      <div className="w-48 h-full bg-[#ff1aac]"></div>
      <div className="flex-1 h-full bg-[#fffa00]"></div>
      <div className="w-48 h-full bg-[#01ffa2]"></div>
    </div>
  );
};

export default function PCMenus() {
  return (
    <div
      className={cn(
        'fixed flex justify-start gap-8 text-white select-none z-10 pr-4',
        'w-full h-11 items-center left-0 top-0 bg-black/80 rounded-none pb-1'
      )}
    >
      <Deco className="absolute w-48 left-0 top-0 opacity-50" />

      <MenuListForPC />
      <OperateList />
      <IconVersion />

      <Deco className="absolute w-48 right-0 top-0 opacity-50" reverse />
      <Deco2 />
    </div>
  );
}
