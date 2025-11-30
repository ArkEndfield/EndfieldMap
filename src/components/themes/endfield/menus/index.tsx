import deviceJudge from '@/components/common/device_judge';

import MobileMenus from './mobile';
import PCMenus from './pc';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
