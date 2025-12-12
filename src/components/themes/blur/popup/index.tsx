import MobilePopup from '@themes/blur/popup/mobile';
import PCPopup from '@themes/blur/popup/pc';

import deviceJudge from '@/components/common/device_judge';

const Popup = deviceJudge(PCPopup, MobilePopup);

export default Popup;
