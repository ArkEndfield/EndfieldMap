import MobileMenus from './mobile';
import PCMenus from './pc';
import deviceJudge from '@/components/common/DeviceJudge';

const Menus = deviceJudge(PCMenus, MobileMenus);

export default Menus;
