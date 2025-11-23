import MobileControlPanel from './mobile';
import PCControlPanel from './pc';
import deviceJudge from '@/components/common/DeviceJudge';

const ControlPanel = deviceJudge(PCControlPanel, MobileControlPanel);

export default ControlPanel;
