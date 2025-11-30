import MobilePopup from '@themes/endfield/popup/mobile';
import PCPopup from '@themes/endfield/popup/pc';

import deviceJudge from '@/components/common/device_judge';

const Popup = deviceJudge(PCPopup, MobilePopup);

export default Popup;
