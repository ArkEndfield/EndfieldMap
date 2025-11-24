import MobileMenus from './mobile';
import PCMenus from './pc';
import deviceJudge from '@/components/common/device_judge';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
