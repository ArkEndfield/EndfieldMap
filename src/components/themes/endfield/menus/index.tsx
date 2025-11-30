import MobileMenus from '@themes/endfield/menus/mobile';
import PCMenus from '@themes/endfield/menus/pc';

import deviceJudge from '@/components/common/device_judge';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
