import MobilePopup from './mobile';
import PCPopup from './pc';
import deviceJudge from '@/components/common/DeviceJudge';

const Popup = deviceJudge(PCPopup, MobilePopup);

export default Popup;
