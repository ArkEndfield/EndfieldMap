import { cn } from '@/utils/style';
import { RightMenu } from './right';
import { HeaderMenuSettings } from './left/settings';

export default function MobileMenus() {
  return (
    <div className={
      cn(
        "fixed top-0 left-0 right-0 flex items-center",
        "bg-[#272727]/90 text-white",
        "backdrop-blur-sm"
      )
    }>
      <RightMenu />
      <HeaderMenuSettings />
    </div>
  );
}
