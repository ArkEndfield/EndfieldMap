import MobileControlPanel from '@themes/blur/control_panel/mobile';
import PCControlPanel from '@themes/blur/control_panel/pc';

import deviceJudge from '@/components/common/device_judge';

const ControlPanel = deviceJudge(PCControlPanel, MobileControlPanel);

export default ControlPanel;
