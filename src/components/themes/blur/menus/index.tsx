import MobileMenus from '@themes/blur/menus/mobile';
import PCMenus from '@themes/blur/menus/pc';

import deviceJudge from '@/components/common/device_judge';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
