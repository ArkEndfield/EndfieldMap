import deviceJudge from '@/components/common/device_judge';

import MobilePopup from './mobile';
import PCPopup from './pc';

const Popup = deviceJudge(PCPopup, MobilePopup);

export default Popup;
