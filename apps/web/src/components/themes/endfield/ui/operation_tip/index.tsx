import { CustomPointOperationTip } from '@themes/endfield/ui/operation_tip/custom_point';
import { ElectricPoleOperationTip } from '@themes/endfield/ui/operation_tip/electric_pole';
import { RouteOperationTip } from '@themes/endfield/ui/operation_tip/route';
import { SelectModeTip } from '@themes/endfield/ui/operation_tip/select_mode';

const OperationTip = () => {
  return (
    <>
      <SelectModeTip />
      <ElectricPoleOperationTip />
      <CustomPointOperationTip />
      <RouteOperationTip />
    </>
  );
};

export default OperationTip;
