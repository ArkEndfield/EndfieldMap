import MobilePopup from './mobile';
import PCPopup from './pc';
import deviceJudge from '@/components/common/device_judge';

const Popup = deviceJudge(PCPopup, MobilePopup);

export default Popup;
