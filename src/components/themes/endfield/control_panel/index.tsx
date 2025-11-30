import deviceJudge from '@/components/common/device_judge';

import MobileControlPanel from './mobile';
import PCControlPanel from './pc';

const ControlPanel = deviceJudge(PCControlPanel, MobileControlPanel);

export default ControlPanel;
