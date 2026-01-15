import MobileMenus from '@themes/endfield/ui/menus/mobile';
import PCMenus from '@themes/endfield/ui/menus/pc';

import deviceJudge from '@/components/common/device_judge';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
