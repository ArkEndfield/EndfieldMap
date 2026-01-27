import MobileControlPanel from '@themes/endfield/ui/control_panel/mobile';
import PCControlPanel from '@themes/endfield/ui/control_panel/pc';

import deviceJudge from '@/components/common/device_judge';

const ControlPanel = deviceJudge(PCControlPanel, MobileControlPanel);

export default ControlPanel;
